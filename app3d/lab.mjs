/**
 * 3D 结构实验室侧栏。
 *
 * 两个页签：
 *   实验 —— 选桥、力流四步（手动/自动）、车辆荷载、受力配色、拆解；
 *   对比 —— 选 A/B 两座桥，把受力特点、主要构件、适用场景、思考题、学习目标并排看，
 *           镜头可分别飞到 A、B。这是"串行对比"：不做双实例同屏（要第二套场景与相机，
 *           成本翻倍而收益有限）。
 *
 * 文案全部来自 app3d/bridges.data.mjs（由 app.js 抽取），这里只做交互。
 */

const STEP_HINT = {
  deck: "荷载先落在桥面上",
  girder: "主梁把竖荷载转成弯矩",
  "box-girder": "箱梁在墩顶最深，弯矩最大",
  arch: "拱肋把荷载变成压力",
  hanger: "吊杆把桥面提住，自己受拉",
  cable: "斜拉索受拉，把桥面提向主塔",
  ring: "主塔受压，把索力传向基础",
  pavilion: "风雨亭是公共空间，不参与承重",
  gallery: "连廊是附属结构，荷载走桥面梁",
  pier: "桥墩受压，把力量继续往下传",
  abutment: "拱座承受拱肋的推力",
  bearing: "支座把梁端反力集中传给墩",
  foundation: "基础把荷载分散到河床",
  anchor: "锚固区把索力锚进梁体",
  support: "桥台承接引道与主桥的过渡"
};

const COMPARE_ROWS = [
  { key: "force", label: "受力特点" },
  { key: "members", label: "主要构件" },
  { key: "scene", label: "适用场景" },
  { key: "question", label: "思考题" }
];

export function createLab(host, options = {}) {
  if (!host) throw new Error("实验室面板缺少宿主节点");

  const {
    onSelectBridge,
    onSelectStep,
    onTogglePlay,
    onToggleExplode,
    onSetLoad,
    onToggleColors,
    onSelectTab,
    onSelectCompare,
    onFocusBridge,
    onOpenBridge,
    onOpen2d,
    legend = {},
    goals = {},
    profiles = {}
  } = options;

  let state = {
    bridge: null,
    step: null,
    exploded: false,
    playing: false,
    flow: [],
    load: 0,
    loadText: "",
    forceColors: false,
    showLoad: false,
    tab: "experiment",
    compare: { a: null, b: null }
  };
  let els = null;

  host.classList.add("a3d-lab");

  const bridgeById = (id) => (options.bridges || []).find((item) => item.id === id) || null;
  const profileOf = (id) => {
    const bridge = bridgeById(id);
    return bridge ? profiles[bridge.model] || null : null;
  };
  const stepLabel = (partId) => {
    const parts = state.bridge && state.bridge.parts ? state.bridge.parts : [];
    const part = parts.find((item) => item.id === partId);
    return part ? part.label : partId;
  };

  /* ---------------- 实验页 ---------------- */

  function buildExperiment() {
    const wrap = document.createElement("div");
    wrap.className = "a3d-lab-page";

    const chips = document.createElement("div");
    chips.className = "a3d-lab-chips";
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "选择实验桥梁");
    const chipButtons = new Map();
    for (const bridge of options.bridges || []) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "a3d-lab-chip";
      button.dataset.bridge = bridge.id;
      button.textContent = bridge.name.replace("大桥", "").replace("桥", "");
      button.title = `${bridge.name} · ${bridge.year} · ${bridge.type}`;
      button.addEventListener("click", () => onSelectBridge && onSelectBridge(bridge.id));
      chips.append(button);
      chipButtons.set(bridge.id, button);
    }

    /* 力流 */
    const flowSection = document.createElement("section");
    flowSection.className = "a3d-lab-section";
    const flowHead = document.createElement("div");
    flowHead.className = "a3d-lab-head";
    const flowTitle = document.createElement("h3");
    flowTitle.textContent = "力流";
    const playButton = document.createElement("button");
    playButton.type = "button";
    playButton.className = "a3d-lab-play";
    playButton.addEventListener("click", () => onTogglePlay && onTogglePlay());
    flowHead.append(flowTitle, playButton);

    const stepList = document.createElement("ol");
    stepList.className = "a3d-lab-steps";
    stepList.setAttribute("aria-label", "力流步骤");
    const stepButtons = [];
    state.flow.forEach((partId, index) => {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "a3d-lab-step";
      button.dataset.step = String(index);

      const indexEl = document.createElement("span");
      indexEl.className = "a3d-lab-index";
      indexEl.textContent = String(index + 1);

      const text = document.createElement("span");
      text.className = "a3d-lab-steptext";
      const strong = document.createElement("strong");
      strong.textContent = stepLabel(partId);
      const small = document.createElement("small");
      small.textContent = STEP_HINT[partId] || "";
      text.append(strong, small);

      button.append(indexEl, text);
      button.addEventListener("click", () => onSelectStep && onSelectStep(index));
      item.append(button);
      stepList.append(item);
      stepButtons.push(button);
    });

    const forceNote = document.createElement("p");
    forceNote.className = "a3d-lab-note";
    flowSection.append(flowHead, stepList, forceNote);

    /* 荷载 */
    const loadSection = document.createElement("section");
    loadSection.className = "a3d-lab-section";
    const loadHead = document.createElement("div");
    loadHead.className = "a3d-lab-head";
    const loadTitle = document.createElement("h3");
    loadTitle.textContent = "车辆荷载";
    const loadValue = document.createElement("output");
    loadValue.className = "a3d-lab-value";
    loadHead.append(loadTitle, loadValue);

    const loadInput = document.createElement("input");
    loadInput.type = "range";
    loadInput.min = "0";
    loadInput.max = "100";
    loadInput.step = "5";
    loadInput.className = "a3d-lab-range";
    loadInput.setAttribute("aria-label", "车辆荷载大小");
    loadInput.addEventListener("input", () => {
      if (onSetLoad) onSetLoad(Number(loadInput.value) / 100);
    });

    const loadNote = document.createElement("p");
    loadNote.className = "a3d-lab-note";
    loadSection.append(loadHead, loadInput, loadNote);

    /* 工具 + 图例 */
    const tools = document.createElement("div");
    tools.className = "a3d-lab-tools";

    const explodeButton = document.createElement("button");
    explodeButton.type = "button";
    explodeButton.className = "a3d-lab-tool";
    explodeButton.textContent = "结构拆解";
    explodeButton.addEventListener("click", () => onToggleExplode && onToggleExplode());

    const colorsButton = document.createElement("button");
    colorsButton.type = "button";
    colorsButton.className = "a3d-lab-tool";
    colorsButton.textContent = "受力配色";
    colorsButton.addEventListener("click", () => onToggleColors && onToggleColors());

    const openBridgeButton = document.createElement("button");
    openBridgeButton.type = "button";
    openBridgeButton.className = "a3d-lab-tool";
    openBridgeButton.textContent = "看资料";
    openBridgeButton.addEventListener("click", () => {
      if (state.bridge && onOpenBridge) onOpenBridge(state.bridge.id);
    });

    tools.append(explodeButton, colorsButton, openBridgeButton);

    const legendList = document.createElement("ul");
    legendList.className = "a3d-lab-legend";
    legendList.setAttribute("aria-label", "受力配色图例");
    for (const [key, item] of Object.entries(legend)) {
      const entry = document.createElement("li");
      entry.dataset.nature = key;
      const dot = document.createElement("i");
      dot.setAttribute("aria-hidden", "true");
      const text = document.createElement("span");
      text.textContent = item.label || key;
      text.title = item.hint || "";
      entry.append(dot, text);
      legendList.append(entry);
    }

    wrap.append(chips, flowSection, loadSection, tools, legendList);
    return {
      wrap,
      chipButtons,
      stepButtons,
      playButton,
      explodeButton,
      colorsButton,
      legendList,
      forceNote,
      loadInput,
      loadValue,
      loadNote,
      loadSection
    };
  }

  /* ---------------- 对比页 ---------------- */

  function buildCompare() {
    const wrap = document.createElement("div");
    wrap.className = "a3d-lab-page";

    const pick = document.createElement("div");
    pick.className = "a3d-lab-compare";
    const slots = {};
    for (const slot of ["a", "b"]) {
      const row = document.createElement("div");
      row.className = "a3d-lab-slot";
      const label = document.createElement("span");
      label.className = "a3d-lab-slotlabel";
      label.textContent = slot.toUpperCase();
      const buttons = document.createElement("div");
      buttons.className = "a3d-lab-chips";
      const map = new Map();
      for (const bridge of options.bridges || []) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "a3d-lab-chip";
        button.dataset.bridge = bridge.id;
        button.textContent = bridge.name.replace("大桥", "").replace("桥", "");
        button.addEventListener("click", () => onSelectCompare && onSelectCompare(slot, bridge.id));
        buttons.append(button);
        map.set(bridge.id, button);
      }
      row.append(label, buttons);
      pick.append(row);
      slots[slot] = map;
    }

    const table = document.createElement("table");
    table.className = "a3d-lab-table";
    const thead = document.createElement("thead");
    const headRow = document.createElement("tr");
    for (const text of ["对比项", "A", "B"]) {
      const th = document.createElement("th");
      th.scope = "col";
      th.textContent = text;
      headRow.append(th);
    }
    thead.append(headRow);
    const tbody = document.createElement("tbody");
    table.append(thead, tbody);

    const actions = document.createElement("div");
    actions.className = "a3d-lab-tools";
    const focusA = document.createElement("button");
    focusA.type = "button";
    focusA.className = "a3d-lab-tool";
    focusA.textContent = "镜头 → A";
    focusA.addEventListener("click", () => {
      const id = state.compare.a || (state.bridge && state.bridge.id);
      if (id && onFocusBridge) onFocusBridge(id);
    });
    const focusB = document.createElement("button");
    focusB.type = "button";
    focusB.className = "a3d-lab-tool";
    focusB.textContent = "镜头 → B";
    focusB.addEventListener("click", () => {
      if (state.compare.b && onFocusBridge) onFocusBridge(state.compare.b);
    });
    actions.append(focusA, focusB);

    const note = document.createElement("p");
    note.className = "a3d-lab-note";
    note.textContent = "串行对比：两座桥不同屏，用镜头分别飞过去看。";

    wrap.append(pick, table, actions, note);
    return { wrap, slots, tbody };
  }

  function renderCompare() {
    if (!els) return;
    for (const slot of ["a", "b"]) {
      for (const [id, button] of els.compareSlots[slot]) {
        const active = state.compare[slot] === id;
        button.classList.toggle("is-active", active);
        button.setAttribute("aria-pressed", active ? "true" : "false");
      }
    }

    const idA = state.compare.a;
    const idB = state.compare.b;
    const profileA = profileOf(idA);
    const profileB = profileOf(idB);
    const bridgeA = bridgeById(idA);
    const bridgeB = bridgeById(idB);

    const rows = COMPARE_ROWS.map((row) => ({
      label: row.label,
      a: profileA ? profileA[row.key] : "",
      b: profileB ? profileB[row.key] : ""
    }));
    rows.push({
      label: "学习目标",
      a: bridgeA ? goals[bridgeA.model] : "",
      b: bridgeB ? goals[bridgeB.model] : ""
    });

    const tbody = els.compareBody;
    tbody.innerHTML = "";
    for (const row of rows) {
      const tr = document.createElement("tr");
      const th = document.createElement("th");
      th.textContent = row.label;
      th.scope = "row";
      const tdA = document.createElement("td");
      tdA.textContent = row.a || "—";
      const tdB = document.createElement("td");
      tdB.textContent = row.b || "—";
      if (row.a && row.b && row.a !== row.b) tr.classList.add("is-diff");
      tr.append(th, tdA, tdB);
      tbody.append(tr);
    }
  }

  /* ---------------- 组装 ---------------- */

  function build() {
    host.innerHTML = "";
    host.hidden = false;

    const header = document.createElement("header");
    header.className = "a3d-panel-head";
    const titleWrap = document.createElement("div");
    titleWrap.className = "a3d-panel-title";
    const kicker = document.createElement("span");
    kicker.className = "a3d-panel-order";
    kicker.textContent = "STRUCTURE LAB";
    const title = document.createElement("h2");
    title.textContent = "结构实验室";
    titleWrap.append(kicker, title);

    const close = document.createElement("button");
    close.type = "button";
    close.className = "a3d-panel-close";
    close.setAttribute("aria-label", "关闭实验室，回到总览");
    close.textContent = "×";
    close.addEventListener("click", () => {
      window.location.hash = "#atlas";
    });
    header.append(titleWrap, close);

    const tabs = document.createElement("div");
    tabs.className = "a3d-lab-tabs";
    tabs.setAttribute("role", "tablist");
    const tabButtons = {};
    for (const [key, label] of [
      ["experiment", "实验"],
      ["compare", "对比"]
    ]) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "a3d-lab-tab";
      button.textContent = label;
      button.dataset.tab = key;
      button.addEventListener("click", () => onSelectTab && onSelectTab(key));
      tabs.append(button);
      tabButtons[key] = button;
    }

    const experiment = buildExperiment();
    const compare = buildCompare();
    host.append(header, tabs, experiment.wrap, compare.wrap);

    const footer = document.createElement("footer");
    footer.className = "a3d-panel-foot";
    const cta = document.createElement("button");
    cta.type = "button";
    cta.className = "a3d-panel-cta";
    cta.textContent = "在 2D 实验室里打开 →";
    cta.addEventListener("click", () => onOpen2d && onOpen2d(state.bridge && state.bridge.id));
    footer.append(cta);
    host.append(footer);

    els = {
      ...experiment,
      tabButtons,
      compareWrap: compare.wrap,
      compareSlots: compare.slots,
      compareBody: compare.tbody
    };
  }

  function render() {
    if (!els) return;

    for (const [key, button] of Object.entries(els.tabButtons)) {
      const active = state.tab === key;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", active ? "true" : "false");
    }
    els.wrap.hidden = state.tab !== "experiment";
    els.compareWrap.hidden = state.tab !== "compare";

    for (const [id, button] of els.chipButtons) {
      const active = state.bridge && state.bridge.id === id;
      button.classList.toggle("is-active", Boolean(active));
      button.setAttribute("aria-pressed", active ? "true" : "false");
    }
    els.stepButtons.forEach((button, index) => {
      const active = index === state.step;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-current", active ? "step" : "false");
    });

    els.playButton.textContent = state.playing ? "暂停" : "自动播放";
    els.playButton.setAttribute("aria-pressed", state.playing ? "true" : "false");
    els.explodeButton.setAttribute("aria-pressed", state.exploded ? "true" : "false");
    els.explodeButton.classList.toggle("is-active", state.exploded);
    els.colorsButton.classList.toggle("is-active", Boolean(state.forceColors));
    els.colorsButton.setAttribute("aria-pressed", state.forceColors ? "true" : "false");
    els.legendList.hidden = !state.forceColors;

    const profile = state.bridge ? profiles[state.bridge.model] : null;
    els.forceNote.textContent = profile ? `${profile.force}。构件：${profile.members}。` : "";

    els.loadSection.hidden = !state.showLoad;
    els.loadInput.value = String(Math.round((state.load || 0) * 100));
    els.loadValue.textContent = `${Math.round((state.load || 0) * 100)}%`;
    els.loadNote.textContent = state.loadText || "";

    renderCompare();
  }

  return {
    show(next) {
      const bridgeChanged = !state.bridge || !next.bridge || state.bridge.id !== next.bridge.id;
      const flowChanged = JSON.stringify(state.flow) !== JSON.stringify(next.flow || []);
      state = { ...state, ...next };
      if (bridgeChanged || flowChanged || !els) build();
      render();
      if (els) {
        els.stepButtons.forEach((button, index) => {
          const strong = button.querySelector ? button.querySelector("strong") : null;
          if (strong) strong.textContent = stepLabel(state.flow[index]);
        });
      }
    },
    hide() {
      host.hidden = true;
      host.innerHTML = "";
      els = null;
    },
    get isOpen() {
      return Boolean(els) && !host.hidden;
    },
    get element() {
      return host;
    }
  };
}
