/**
 * M0 外壳入口：能力检测 → 路由 → 3D 场景 / 列表视图切换。
 *
 * 设计要点：
 *   - 3D 不可用（file:// 或 无 WebGL）时，整套 3D 不加载，直接进列表视图；
 *   - 现有 2D 页面（app.js）保持原样，列表视图就是它；
 *   - 列表视图中由 app.js 写入的旧格式 hash 与页内锚点，不会把用户拽进 3D。
 */

import { BRIDGES, BRIDGE_BY_ID } from "./data.mjs";
import { createRouter, toHash } from "./state.mjs";

const els = {
  legacyRoot: document.getElementById("legacyRoot"),
  app3d: document.getElementById("app3d"),
  canvas: document.getElementById("sceneCanvas"),
  labels: document.getElementById("sceneLabels"),
  kicker: document.getElementById("sceneKicker"),
  title: document.getElementById("sceneTitle"),
  sub: document.getElementById("sceneSub"),
  status: document.getElementById("sceneStatus"),
  bridgeList: document.getElementById("sceneBridgeList"),
  btnBrowse: document.getElementById("btnBrowse"),
  btnReset: document.getElementById("btnResetView"),
  guide: document.getElementById("guideDialog"),
  bootNotice: document.getElementById("bootNotice"),
  bootTitle: document.getElementById("bootNoticeTitle"),
  bootBody: document.getElementById("bootNoticeBody"),
  bootBrowse: document.getElementById("bootNoticeBrowse")
};

const navItems = Array.from(document.querySelectorAll("[data-nav]"));

function detectWebGL() {
  try {
    const probe = document.createElement("canvas");
    return Boolean(
      probe.getContext("webgl2") ||
        probe.getContext("webgl") ||
        probe.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

const isFileProtocol = window.location.protocol === "file:";
const webglAvailable = detectWebGL();

let browseOnly = isFileProtocol || !webglAvailable;
let scene = null;
let sceneInitPromise = null;
let renderedView = null;
let latestState = null;
let returnButton = null;
let router = null;

/** 浏览模式下只认这三种地址，其余（页内锚点、旧格式）交给 2D 页面。 */
function isSceneRoute(hash) {
  const raw = String(hash).replace(/^#/, "");
  if (raw === "atlas" || raw === "browse") return true;
  return /^bridge\/[A-Za-z0-9_-]+/.test(raw);
}

function closeGuide() {
  const dialog = els.guide;
  if (dialog && dialog.open) {
    try {
      dialog.close();
    } catch {
      /* 忽略：关闭失败不影响主流程 */
    }
  }
}

/**
 * app.js 首次访问会在 650ms 后自动 showModal 弹出新手引导。
 * 该引导讲的是 2D 流程，在 3D 场景里既不合语境，模态框还会让页面 inert。
 * 这里在 3D 视图下拦截它：优先用 dialog 的 toggle 事件（无闪烁），
 * 再用几个定时器兜底不支持该事件的浏览器。列表视图下不干预。
 */
function guardGuideIn3d() {
  const dialog = els.guide;
  if (!dialog) return;

  const enforce = () => {
    if (renderedView && renderedView !== "browse" && dialog.open) {
      closeGuide();
    }
  };

  if (typeof dialog.addEventListener === "function") {
    dialog.addEventListener("toggle", enforce);
  }
  for (const delay of [700, 1200, 2500]) {
    window.setTimeout(enforce, delay);
  }
}

function describe(state) {
  if (state.view === "bridge") {
    const bridge = BRIDGE_BY_ID.get(state.bridgeId);
    if (bridge) {
      return {
        kicker: `M2 / BRIDGE · ${bridge.order}`,
        title: bridge.name,
        sub: `${bridge.year} 年 · ${bridge.type} · 已按真实坐标与桥轴定位，镜头已拉近。`
      };
    }
  }
  if (state.view === "lab") {
    return {
      kicker: "M2 / STRUCTURE LAB",
      title: "桥梁结构实验室",
      sub: "建筑已就位 · 室内交互建设中（M3）。可先切到列表视图使用现有实验室页面。"
    };
  }
  if (state.view === "archive") {
    return {
      kicker: "M2 / ARCHIVE",
      title: "桥梁档案馆",
      sub: "建筑已就位 · 档案与答题建设中（M3）。可先切到列表视图使用现有对比与答题页面。"
    };
  }
  return {
    kicker: "M2 / CITY ATLAS",
    title: "柳江 · LIUJIANG",
    sub: "真实河道与五桥位置（OpenStreetMap）。拖动可任意角度环视，滚轮缩放，点击桥梁把镜头拉近看结构。"
  };
}

function updateStatus(state) {
  if (!els.status) return;
  const parts = [toHash(state)];
  if (isFileProtocol) parts.push("file://");
  else if (!webglAvailable) parts.push("WebGL 不可用");
  else parts.push("WebGL 就绪");
  if (scene) parts.push(`three r${scene.revision}`);
  parts.push("1 单位 = 100 m");
  els.status.textContent = parts.join(" · ");
}

function buildBridgeList() {
  if (!els.bridgeList) return;
  const fragment = document.createDocumentFragment();
  for (const bridge of BRIDGES) {
    const item = document.createElement("li");
    const link = document.createElement("a");
    link.className = "app3d-bridge-link";
    link.href = `#bridge/${bridge.id}`;
    link.dataset.bridge = bridge.id;
    link.style.setProperty("--dot", bridge.accent);

    const dot = document.createElement("i");
    dot.setAttribute("aria-hidden", "true");
    const label = document.createElement("span");
    label.textContent = `${bridge.order} ${bridge.name}`;

    link.append(dot, label);
    item.append(link);
    fragment.append(item);
  }
  els.bridgeList.append(fragment);
}

function syncReturnButton(visible) {
  if (visible && !browseOnly) {
    if (!returnButton) {
      returnButton = document.createElement("a");
      returnButton.className = "return-3d";
      returnButton.href = "#atlas";
      returnButton.textContent = "← 返回 3D 城市总览";
    }
    if (!returnButton.isConnected) document.body.append(returnButton);
    return;
  }
  if (returnButton && returnButton.isConnected) returnButton.remove();
}

function showBootNotice(title, bodyHtml) {
  if (!els.bootNotice) return;
  if (els.bootTitle) els.bootTitle.textContent = title;
  if (els.bootBody) els.bootBody.innerHTML = bodyHtml;
  els.bootNotice.hidden = false;
}

function handlePick(pick) {
  if (!pick) return;
  if (pick.type === "bridge") {
    window.location.hash = `#bridge/${pick.id}`;
    return;
  }
  if (pick.type === "building" && (pick.id === "lab" || pick.id === "archive")) {
    window.location.hash = `#${pick.id}`;
  }
}

function initScene() {
  if (sceneInitPromise) return sceneInitPromise;
  sceneInitPromise = (async () => {
    const module = await import("./scene.mjs");
    const instance = await module.createScene({
      canvas: els.canvas,
      labelLayer: els.labels,
      onPick: handlePick
    });
    scene = instance;
    return instance;
  })();
  return sceneInitPromise;
}

async function ensureSceneReady(state) {
  try {
    const instance = scene || (await initScene());
    if (latestState) instance.setState(latestState);
    instance.start();
    updateStatus(latestState || state);
  } catch (error) {
    console.error("[app3d] 场景初始化失败", error);
    browseOnly = true;
    showBootNotice(
      "3D 场景加载失败",
      `无法初始化 WebGL 场景（${String((error && error.message) || error)}）。已切换到列表视图，全部内容仍可访问。`
    );
    window.location.hash = "#browse";
  }
}

function renderBrowse() {
  renderedView = "browse";
  if (els.app3d) els.app3d.hidden = true;
  if (els.legacyRoot) els.legacyRoot.hidden = false;
  document.body.classList.remove("a3d-active");
  if (scene) scene.stop();
  syncReturnButton(true);
  updateStatus({ view: "browse", bridgeId: null, mode: "structure", exploded: false });
}

function renderApp3d(state) {
  renderedView = state.view;
  if (els.legacyRoot) els.legacyRoot.hidden = true;
  if (els.app3d) els.app3d.hidden = false;
  document.body.classList.add("a3d-active");
  closeGuide();
  syncReturnButton(false);

  const text = describe(state);
  if (els.kicker) els.kicker.textContent = text.kicker;
  if (els.title) els.title.textContent = text.title;
  if (els.sub) els.sub.textContent = text.sub;

  for (const item of navItems) {
    item.classList.toggle("is-active", item.dataset.nav === state.view);
  }
  if (els.bridgeList) {
    for (const link of els.bridgeList.querySelectorAll("a")) {
      const active = state.view === "bridge" && link.dataset.bridge === state.bridgeId;
      link.classList.toggle("is-active", active);
      link.setAttribute("aria-current", active ? "true" : "false");
    }
  }

  latestState = state;
  updateStatus(state);
  ensureSceneReady(state);
}

function onChange(state, meta) {
  // 列表视图内的页内锚点、旧格式 hash 不应把我们切进 3D。
  if (!meta.initial && renderedView === "browse" && !isSceneRoute(window.location.hash)) {
    return;
  }

  if (state.legacy) {
    router.replace({ ...state, legacy: false });
  }

  if (browseOnly) {
    if (state.view !== "browse") {
      router.replace({ view: "browse", bridgeId: null, mode: "structure", exploded: false });
    }
    renderBrowse();
    return;
  }

  if (state.view === "browse") renderBrowse();
  else renderApp3d(state);
}

function boot() {
  if (!els.app3d || !els.legacyRoot || !els.canvas) {
    console.warn("[app3d] 外壳节点缺失，保持现有 2D 页面不变。");
    return;
  }

  buildBridgeList();
  guardGuideIn3d();

  if (els.btnBrowse) {
    els.btnBrowse.addEventListener("click", () => {
      window.location.hash = "#browse";
    });
  }

  if (els.btnReset) {
    els.btnReset.addEventListener("click", () => {
      if (scene) scene.resetView();
    });
  }

  if (els.bootBrowse) {
    els.bootBrowse.addEventListener("click", () => {
      if (els.bootNotice) els.bootNotice.hidden = true;
      window.location.hash = "#browse";
    });
  }

  window.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    if (renderedView && renderedView !== "atlas" && renderedView !== "browse") {
      window.location.hash = "#atlas";
    }
  });

  router = createRouter(onChange);
  router.start();

  if (isFileProtocol) {
    showBootNotice(
      "需要通过本地服务器打开",
      "3D 场景依赖 ES module 与 WebGL，必须经 <code>http://</code> 访问。请在项目目录运行 <code>node server.js</code>，再打开 <code>http://127.0.0.1:4173</code>。当前先进入列表视图。"
    );
  }

  // 便于人工自检与后续里程碑调试。
  window.bridgeObservatory = {
    get state() {
      return router ? router.current : null;
    },
    get scene() {
      return scene;
    },
    get capabilities() {
      return { isFileProtocol, webglAvailable, browseOnly };
    }
  };
}

boot();
