/**
 * 3D 结构实验室的侧栏。
 *
 * 定位：回答"力怎么走"。所有文案来自 app3d/bridges.data.mjs
 * （由 app.js 抽取），这里只负责把"选桥 / 力流步骤 / 拆解 / 荷载"做成可操作的控件。
 *
 * 与资料卡的区别：资料卡是"读"，实验室是"做"——每一步都要能牵动场景，
 * 否则就只是把 2D 的按钮搬进 3D。
 */

const STEP_HINT = {
  deck: "荷载先落在桥面上",
  girder: "主梁把竖向荷载转成弯曲",
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
  pier_foundation: "基础把荷载分散到河床",
  foundation: "基础把荷载分散到河床",
  anchor: "锚固区把索力锚进梁体",
  support: "桥台承接引道与主桥的过渡"
};

export function createLab(host, options = {}) {
  if (!host) throw new Error("实验室面板缺少宿主节点");

  const {
    onSelectBridge,
    onSelectStep,
    onTogglePlay,
    onToggleExplode,
    onSetLoad,
    onOpenBridge,
    onOpen2d
  } = options;

  let state = { bridge: null, step: null, exploded: false, playing: false, flow: [], load: 0 };
  let els = null;

  host.classList.add("a3d-lab");

  const stepLabel = (partId) => {
    const part = (state.bridge && state.bridge.parts ? state.bridge.parts : []).find(
      (item) => item.id === partId
    );
    return part ? part.label : partId;
  };

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

    /* 选桥 */
    const chips = document.createElement("div");
    chips.className = "a3d-lab-chips";
    chips.setAttribute("role", "group");
    chips.setAttribute("aria-label", "选择实验桥梁");
    const chipButtons = new Map();
    for (const bridge of options.bridges) {
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

    /* 力流步骤 */
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

    for (let i = 0; i < state.flow.length; i += 1) {
      const item = document.createElement("li");
      const button = document.createElement("button");
      button.type = "button";
      button.className = "a3d-lab-step";
      button.dataset.step = String(i);

      const index = document.createElement("span");
      index.className = "a3d-lab-index";
      index.textContent = String(i + 1);

      const text = document.createElement("span");
      text.className = "a3d-lab-steptext";
      const strong = document.createElement("strong");
      strong.textContent = stepLabel(state.flow[i]);
      const small = document.createElement("small");
      small.textContent = STEP_HINT[state.flow[i]] || "";
      text.append(strong, small);

      button.append(index, text);
      button.addEventListener("click", () => onSelectStep && onSelectStep(i));
      item.append(button);
      stepList.append(item);
      stepButtons.push(button);
    }

    const forceNote = document.createElement("p");
    forceNote.className = "a3d-lab-note";

    flowSection.append(flowHead, stepList, forceNote);

    /* 荷载与挠度 */
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

    /* 工具 */
    const tools = document.createElement("div");
    tools.className = "a3d-lab-tools";

    const explodeButton = document.createElement("button");
    explodeButton.type = "button";
    explodeButton.className = "a3d-lab-tool";
    explodeButton.textContent = "结构拆解";
    explodeButton.addEventListener("click", () => onToggleExplode && onToggleExplode());

    const openBridgeButton = document.createElement("button");
    openBridgeButton.type = "button";
    openBridgeButton.className = "a3d-lab-tool";
    openBridgeButton.textContent = "看这座桥的资料";
    openBridgeButton.addEventListener("click", () => {
      if (state.bridge && onOpenBridge) onOpenBridge(state.bridge.id);
    });

    tools.append(explodeButton, openBridgeButton);

    /* 底部 */
    const footer = document.createElement("footer");
    footer.className = "a3d-panel-foot";
    const cta = document.createElement("button");
    cta.type = "button";
    cta.className = "a3d-panel-cta";
    cta.textContent = "在 2D 实验室里打开 →";
    cta.addEventListener("click", () => onOpen2d && onOpen2d(state.bridge && state.bridge.id));
    footer.append(cta);

    host.append(header, chips, flowSection, loadSection, tools, footer);

    els = { chipButtons, stepButtons, playButton, explodeButton, forceNote, loadInput, loadValue, loadNote, loadSection };
  }

  function render() {
    if (!els) return;
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

    const profile = state.bridge ? (options.profiles || {})[state.bridge.model] : null;
    els.forceNote.textContent = profile
      ? `${profile.force}。构件：${profile.members}。`
      : "";

    els.loadInput.value = String(Math.round((state.load || 0) * 100));
    els.loadValue.textContent = `${Math.round((state.load || 0) * 100)}%`;
    els.loadNote.textContent = options.loadNote ? options.loadNote(state.load || 0) : "";
  }

  return {
    /** 用最新的状态渲染（bridge 变化会整体重建）。 */
    show(next) {
      const bridgeChanged = !state.bridge || !next.bridge || state.bridge.id !== next.bridge.id;
      const flowChanged =
        JSON.stringify(state.flow) !== JSON.stringify(next.flow || []);
      state = { ...state, ...next };
      if (bridgeChanged || flowChanged || !els) build();
      render();
      // 重建后步骤按钮是新节点，需要重新绑定标签文字
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
