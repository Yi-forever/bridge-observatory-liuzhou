/**
 * 3D 桥梁资料卡。
 *
 * 数据来自 app3d/bridges.data.mjs（由 app.js 抽取，2D 页面是权威来源），
 * 所以卡片上的别名、结构家族、规模、构件说明、观察要点与 2D 章节完全一致。
 *
 * 交互约定：
 *   - 点卡片里的构件 → 回传给场景做高亮；场景里点构件 → 卡片滚到对应行；
 *   - 没有对应几何的构件（比如文昌的"跨中"）只展示说明，不假装能高亮；
 *   - 底部给一条去 2D 结构实验室的路（M2 决策点：3D 讲解不如 SVG 清楚时的混合方案）。
 */

const PANEL_CLASS = "a3d-panel";

export function createPanel(host, { onPartSelect, onOpenLab } = {}) {
  if (!host) throw new Error("资料卡缺少宿主节点");

  let bridge = null;
  let modeled = new Set();
  let activePart = null;
  let els = null;

  host.classList.add(PANEL_CLASS);

  function build() {
    host.innerHTML = "";
    host.hidden = false;

    const header = document.createElement("header");
    header.className = "a3d-panel-head";

    const title = document.createElement("div");
    title.className = "a3d-panel-title";

    const order = document.createElement("span");
    order.className = "a3d-panel-order";
    order.textContent = bridge.order;

    const name = document.createElement("h2");
    name.textContent = bridge.name;

    title.append(order, name);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "a3d-panel-close";
    close.setAttribute("aria-label", "关闭资料卡");
    close.textContent = "×";
    close.addEventListener("click", () => {
      window.location.hash = "#atlas";
    });

    header.append(title, close);

    const alias = document.createElement("p");
    alias.className = "a3d-panel-alias";
    alias.textContent = bridge.alias || "";

    const meta = document.createElement("dl");
    meta.className = "a3d-panel-meta";
    for (const [term, value] of [
      ["年代", bridge.year],
      ["桥型", bridge.type],
      ["结构", bridge.family],
      ["规模", bridge.size]
    ]) {
      if (!value) continue;
      const dt = document.createElement("dt");
      dt.textContent = term;
      const dd = document.createElement("dd");
      dd.textContent = value;
      meta.append(dt, dd);
    }

    const body = document.createElement("div");
    body.className = "a3d-panel-body";

    if (bridge.tagline) {
      const tagline = document.createElement("p");
      tagline.className = "a3d-panel-tagline";
      tagline.textContent = bridge.tagline;
      body.append(tagline);
    }

    if (bridge.description) {
      const desc = document.createElement("p");
      desc.className = "a3d-panel-desc";
      desc.textContent = bridge.description;
      body.append(desc);
    }

    /* 构件列表 */
    const partList = document.createElement("ul");
    partList.className = "a3d-panel-parts";
    partList.setAttribute("aria-label", "关键构件");

    const rows = new Map();
    for (const part of bridge.parts || []) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "a3d-part";
      button.dataset.part = part.id;
      const canHighlight = modeled.has(part.id);
      button.classList.toggle("is-modeled", canHighlight);
      button.title = canHighlight ? "在 3D 模型里高亮这个构件" : "该构件没有单独建模，仅作说明";

      const dot = document.createElement("i");
      dot.setAttribute("aria-hidden", "true");

      const text = document.createElement("span");
      const label = document.createElement("strong");
      label.textContent = part.label;
      const detail = document.createElement("small");
      detail.textContent = part.description;
      text.append(label, detail);

      button.append(dot, text);
      button.addEventListener("click", () => {
        if (!canHighlight) return;
        if (onPartSelect) onPartSelect(part.id);
      });

      item.append(button);
      partList.append(item);
      rows.set(part.id, button);
    }

    body.append(partList);

    if (bridge.observation) {
      const note = document.createElement("p");
      note.className = "a3d-panel-note";
      const strong = document.createElement("strong");
      strong.textContent = "观察要点 · ";
      note.append(strong, document.createTextNode(bridge.observation));
      body.append(note);
    }

    /* 当前构件 */
    const current = document.createElement("div");
    current.className = "a3d-panel-current";
    current.hidden = true;
    current.setAttribute("aria-live", "polite");
    body.append(current);

    /* 底部动作 */
    const footer = document.createElement("footer");
    footer.className = "a3d-panel-foot";

    const labButton = document.createElement("button");
    labButton.type = "button";
    labButton.className = "a3d-panel-cta";
    labButton.textContent = "在结构实验室里看受力 →";
    labButton.addEventListener("click", () => {
      if (onOpenLab) onOpenLab(bridge.id);
    });

    footer.append(labButton);
    host.append(header, alias, meta, body, footer);

    els = { rows, current, partList };
    setActivePart(null);
  }

  /** 标记当前高亮构件（null = 清除）。 */
  function setActivePart(partId) {
    activePart = partId;
    if (!els) return;
    for (const [id, row] of els.rows) {
      row.classList.toggle("is-active", id === partId);
    }
    if (!partId) {
      els.current.hidden = true;
      els.current.innerHTML = "";
      return;
    }
    const part = (bridge.parts || []).find((entry) => entry.id === partId);
    els.current.hidden = false;
    els.current.innerHTML = "";
    const strong = document.createElement("strong");
    strong.textContent = part ? part.label : partId;
    const text = document.createElement("span");
    text.textContent = part
      ? part.description
      : "这个构件在资料卡里没有单独条目，仅作结构示意。";
    els.current.append(strong, text);
    if (els.rows.has(partId)) {
      els.rows.get(partId).scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }

  return {
    /** 展示某座桥。modeled 是"有几何、可高亮"的构件 id 集合。 */
    show(nextBridge, options = {}) {
      const changed = bridge !== nextBridge;
      bridge = nextBridge;
      modeled = new Set(options.modeled || []);
      if (changed || !els) build();
      else {
        for (const [id, row] of els.rows) row.classList.toggle("is-modeled", modeled.has(id));
      }
      setActivePart(options.partId || null);
    },
    hide() {
      host.hidden = true;
      host.innerHTML = "";
      els = null;
      bridge = null;
      activePart = null;
    },
    setModeled(ids) {
      modeled = new Set(ids || []);
      if (!els) return;
      for (const [id, row] of els.rows) row.classList.toggle("is-modeled", modeled.has(id));
    },
    focusPart(partId) {
      if (!els) return;
      setActivePart(partId);
    },
    get isOpen() {
      return Boolean(els) && !host.hidden;
    },
    get partId() {
      return activePart;
    }
  };
}
