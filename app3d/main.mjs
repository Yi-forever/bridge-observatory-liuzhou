/**
 * M0 外壳入口：能力检测 → 路由 → 3D 场景 / 列表视图切换。
 *
 * 设计要点：
 *   - 3D 不可用（file:// 或 无 WebGL）时，整套 3D 不加载，直接进列表视图；
 *   - 现有 2D 页面（app.js）保持原样，列表视图就是它；
 *   - 列表视图中由 app.js 写入的旧格式 hash 与页内锚点，不会把用户拽进 3D。
 */

import { BRIDGES, BRIDGE_BY_ID, PROFILES } from "./data.mjs";
import { createLab } from "./lab.mjs";
import { createPanel } from "./panel.mjs";
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
  panel: document.getElementById("scenePanel"),
  labPanel: document.getElementById("sceneLab"),
  btnExplode: document.getElementById("btnExplode"),
  btnBrowse: document.getElementById("btnBrowse"),
  btnReset: document.getElementById("btnResetView"),
  guide: document.getElementById("guideDialog"),
  bootNotice: document.getElementById("bootNotice"),
  bootTitle: document.getElementById("bootNoticeTitle"),
  bootBody: document.getElementById("bootNoticeBody"),
  bootBrowse: document.getElementById("bootNoticeBrowse")
};

const navItems = Array.from(document.querySelectorAll("[data-nav]"));
const modeItems = Array.from(document.querySelectorAll("[data-mode]"));

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
let panel = null;
let lab = null;
/** 正在等待场景就绪的构件高亮（先跳视图、再高亮）。 */
let pendingPart = null;

/** 实验室的默认实验对象：文惠桥（M2 的垂直切片）。 */
const LAB_DEFAULT_BRIDGE = "wenhui";

/** 自动播放力流的定时器。 */
let labTimer = null;

/** 荷载（0..1）。P1 才接到场景上，P0 先存在状态里。 */
let labLoad = 0;

function stopLabPlayback() {
  if (labTimer !== null) {
    window.clearInterval(labTimer);
    labTimer = null;
  }
}

/** 当前实验室状态（视图、桥、步、拆解）。 */
function labStateOf(state) {
  return {
    bridgeId: state.bridgeId || LAB_DEFAULT_BRIDGE,
    step: Number.isInteger(state.step) ? state.step : null,
    exploded: Boolean(state.exploded)
  };
}

/** 力流步骤表：场景就绪后从 scene 取（FORCE_FLOW 在 scene.mjs 里）。 */
function labFlow(bridgeId) {
  if (!scene || !scene.forceFlow) return [];
  return scene.forceFlow(bridgeId) || [];
}

/**
 * 从 3D 资料卡跳到 2D 的"结构实验室"章节。
 * 先切到列表视图（3D 外壳隐藏、legacy 页面显示），再滚到 #lab——
 * 不能直接把 hash 设成 #lab：那会被 3D 路由当成"3D 实验室"接走。
 */
function openLegacyLab() {
  window.location.hash = "#browse";
  window.setTimeout(() => {
    const section = document.getElementById("lab");
    if (section) section.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 160);
}

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
      let sub = `${bridge.year} 年 · ${bridge.type} · 点桥上的构件可以单独高亮，右侧资料卡会跟着定位。`;
      if (state.mode === "force") {
        sub = "力流演示：桥面 → 承重构件 → 墩座，逐级高亮（玫红），右侧资料卡同步讲解。";
      }
      if (state.exploded) sub += " 已拆解：构件按层拉开，能看清谁压在谁上面。";
      return {
        kicker: `M2 / BRIDGE · ${bridge.order}`,
        title: bridge.name,
        sub
      };
    }
  }
  if (state.view === "lab") {
    const { bridgeId, step } = labStateOf(state);
    const bridge = BRIDGE_BY_ID.get(bridgeId);
    const flow = labFlow(bridgeId);
    const stepText =
      Number.isInteger(step) && step >= 0 && flow[step]
        ? `第 ${step + 1} 步 · ${flow[step]}`
        : "选一步开始";
    const profile = bridge ? PROFILES[bridge.model] : null;
    return {
      kicker: "M2 / STRUCTURE LAB",
      title: bridge ? `结构实验室 · ${bridge.name}` : "桥梁结构实验室",
      sub: profile
        ? `${stepText}。${profile.force}；${profile.question}`
        : stepText
    };
  }
  if (state.view === "archive") {
    return {
      kicker: "M2 / ARCHIVE",
      title: "桥梁档案馆",
      sub: "建筑已就位 · 档案与答题建设中（M3）。可先切到列表视图使用现有对比与答题页面。"
    };
  }
  const atlasSub =
    state.mode === "force"
      ? "选一座桥再切到「受力」，就会逐级演示荷载怎么往下传。"
      : "真实河道与五桥位置（OpenStreetMap）。拖动可任意角度环视，滚轮以光标为中心缩放；点桥梁拉近看结构，点构件看它在受力里干什么。";
  return {
    kicker: "M2 / CITY ATLAS",
    title: "柳江 · LIUJIANG",
    sub: atlasSub
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

  // 构件：先确保进到这座桥的视图，再高亮并让资料卡滚到那一行
  if (pick.type === "part") {
    const state = router ? router.current : null;
    const alreadyHere = state && state.view === "bridge" && state.bridgeId === pick.id;
    if (alreadyHere) {
      focusPart(pick.id, pick.partId);
    } else {
      // 换了视图：视图渲染会重建资料卡并清高亮，
      // 所以这里先记下来，等 applyPanel 渲染完再高亮。
      pendingPart = { bridgeId: pick.id, partId: pick.partId };
      window.location.hash = `#bridge/${pick.id}`;
    }
    return;
  }

  if (pick.type === "bridge") {
    const state = router ? router.current : null;
    if (state && state.view === "lab") {
      window.location.hash = toHash({ ...state, bridgeId: pick.id, step: 0, exploded: false });
      return;
    }
    window.location.hash = `#bridge/${pick.id}`;
    return;
  }
  if (pick.type === "building" && (pick.id === "lab" || pick.id === "archive")) {
    window.location.hash = `#${pick.id}`;
  }
}

/** 高亮构件并把资料卡同步到那一行。 */
function focusPart(bridgeId, partId) {
  const hit = scene && scene.highlightPart ? scene.highlightPart(bridgeId, partId) : null;
  if (panel && panel.isOpen) panel.focusPart(partId);
  return hit;
}

function initScene() {
  if (sceneInitPromise) return sceneInitPromise;
  sceneInitPromise = (async () => {
    const module = await import("./scene.mjs");
    const instance = await module.createScene({
      canvas: els.canvas,
      labelLayer: els.labels,
      onPick: handlePick,
      // 受力演示每走一步，资料卡跟到那个构件
      onPartFocus: (bridgeId, partId) => {
        if (!panel) return;
        if (partId) panel.focusPart(partId);
        else if (bridgeId === null) panel.focusPart(null);
      }
    });
    scene = instance;
    if (latestState) {
      applyPanel(latestState);
      applyLab(latestState);
    }
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

/** 只有"单桥视图"才显示资料卡；其余视图收起并清掉构件高亮。 */
function applyPanel(state) {
  if (!panel) return;
  if (!state || state.view !== "bridge") {
    panel.hide();
    if (scene && scene.clearPartHighlight) scene.clearPartHighlight();
    return;
  }
  const bridge = BRIDGE_BY_ID.get(state.bridgeId);
  if (!bridge) {
    panel.hide();
    return;
  }
  const modeled = scene && scene.getPartIds ? scene.getPartIds(state.bridgeId) : [];
  panel.show(bridge, { modeled });

  if (pendingPart && pendingPart.bridgeId === state.bridgeId) {
    if (scene && scene.highlightPart) {
      const waiting = pendingPart.partId;
      pendingPart = null;
      focusPart(state.bridgeId, waiting);
    } else {
      // 场景尚未就绪：卡片先定位，待办保留——initScene 就绪后会再走一次 applyPanel
      panel.focusPart(pendingPart.partId);
    }
  } else if (scene && scene.clearPartHighlight) {
    scene.clearPartHighlight();
  }
}

/** 实验室侧栏与场景同步；离开实验室视图时收起并停止播放。 */
function applyLab(state) {
  if (!lab) return;
  if (!state || state.view !== "lab") {
    lab.hide();
    stopLabPlayback();
    return;
  }

  const { bridgeId, step, exploded } = labStateOf(state);
  const bridge = BRIDGE_BY_ID.get(bridgeId);
  if (!bridge) {
    lab.hide();
    return;
  }

  const flow = labFlow(bridgeId);
  lab.show({
    bridge,
    flow,
    step: Number.isInteger(step) ? step : null,
    exploded,
    playing: labTimer !== null,
    load: labLoad,
    showLoad: Boolean(scene && scene.setLabLoad)
  });
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
  for (const item of modeItems) {
    const active = (state.mode || "structure") === item.dataset.mode;
    item.classList.toggle("is-active", active);
    item.setAttribute("aria-pressed", active ? "true" : "false");
  }
  if (els.btnExplode) {
    els.btnExplode.setAttribute("aria-pressed", state.exploded ? "true" : "false");
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
  applyPanel(state);
  applyLab(state);
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

  if (els.labPanel) {
    lab = createLab(els.labPanel, {
      bridges: BRIDGES,
      profiles: PROFILES,
      loadNote: () => "",
      onSelectBridge: (bridgeId) => {
        const state = router ? router.current : null;
        if (!state) return;
        window.location.hash = toHash({
          ...state,
          view: "lab",
          bridgeId,
          step: 0,
          exploded: false
        });
      },
      onSelectStep: (index) => {
        const state = router ? router.current : null;
        if (!state) return;
        stopLabPlayback();
        window.location.hash = toHash({ ...state, step: index });
      },
      onTogglePlay: () => {
        const state = router ? router.current : null;
        if (!state) return;
        if (labTimer !== null) {
          stopLabPlayback();
          lab.show({ playing: false });
          return;
        }
        const flow = labFlow(labStateOf(state).bridgeId);
        if (flow.length === 0) return;
        const start = Number.isInteger(state.step) ? state.step : -1;
        let cursor = start;
        const advance = () => {
          cursor = (cursor + 1) % flow.length;
          window.location.hash = toHash({ ...router.current, step: cursor });
        };
        advance();
        labTimer = window.setInterval(advance, 1800);
        lab.show({ playing: true });
      },
      onToggleExplode: () => {
        const state = router ? router.current : null;
        if (!state) return;
        window.location.hash = toHash({ ...state, exploded: !state.exploded });
      },
      onOpenBridge: (bridgeId) => {
        window.location.hash = `#bridge/${bridgeId}`;
      },
      onOpen2d: () => openLegacyLab()
    });
  }

  if (els.panel) {
    panel = createPanel(els.panel, {
      onPartSelect: (partId) => {
        const state = router ? router.current : null;
        if (state && state.view === "bridge") focusPart(state.bridgeId, partId);
      },
      onOpenLab: () => openLegacyLab()
    });
  }

  if (els.btnBrowse) {
    els.btnBrowse.addEventListener("click", () => {
      window.location.hash = "#browse";
    });
  }

  for (const item of modeItems) {
    item.addEventListener("click", () => {
      const state = router ? router.current : null;
      if (!state) return;
      window.location.hash = toHash({ ...state, mode: item.dataset.mode });
    });
  }

  if (els.btnExplode) {
    els.btnExplode.addEventListener("click", () => {
      const state = router ? router.current : null;
      if (!state) return;
      window.location.hash = toHash({ ...state, exploded: !state.exploded });
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
