"use strict";

const bridges = [
  {
    id: "liujiang",
    order: "01",
    name: "柳江大桥",
    alias: "柳江一桥 · LIUJIANG NO.1 BRIDGE",
    year: "1968",
    type: "梁桥",
    family: "梁桥结构",
    size: "608 m",
    accent: "#f47c4d",
    model: "girder",
    deflectionBase: 8,
    map: { x: 35, y: 65 },
    tag: "市区第一座跨江公路大桥",
    tagline: "一条城市主轴，从江面上生长出来。",
    description:
      "柳江大桥让柳江两岸第一次拥有了稳定的公路连接。桥面把车辆荷载交给主梁，主梁再通过桥墩与基础，将力量传到河床深处。它像一条简洁的城市基线，记录了柳州跨江交通的起点。",
    tip: "点击桥面、主梁、桥墩或基础，观察一辆车带来的力量如何一路向下传递。",
    observation: "桥面承接车辆，主梁发生弯曲，再把荷载交给桥墩和基础。",
    parts: [
      {
        id: "deck",
        label: "桥面",
        description: "桥面直接承受车辆和行人的重量，并把荷载交给下方的承重结构。"
      },
      {
        id: "girder",
        label: "主梁",
        description: "主梁是梁桥的主要承重构件。车辆经过时，它会将荷载转化为弯曲变形并传向桥墩。"
      },
      {
        id: "pier",
        label: "桥墩",
        description: "桥墩把主梁传来的竖向荷载继续向下传递，同时帮助桥梁跨越江面。"
      },
      {
        id: "foundation",
        label: "基础",
        description: "基础藏在河水与河床之中，把整座桥的荷载分散到更稳定的地基里。"
      }
    ]
  },
  {
    id: "wenhui",
    order: "02",
    name: "文惠桥",
    alias: "WENHUI BRIDGE · 1994",
    year: "1994",
    type: "拱桥",
    family: "中承式钢管混凝土拱桥",
    size: "主桥 483 m",
    accent: "#efb861",
    model: "arch",
    deflectionBase: 3.2,
    map: { x: 43, y: 59 },
    tag: "广西首座中承式钢管混凝土拱桥",
    tagline: "把重量变成弧线，让两岸在江上相遇。",
    description:
      "文惠桥用一道醒目的拱肋跨过柳江。拱的主要工作方式不是“向下承重”，而是把竖向荷载转化为沿拱轴传递的压力。吊杆把桥面连接到拱肋，共同组成清晰的传力路径。",
    tip: "依次点击拱肋、吊杆和桥面，理解为什么拱桥特别擅长把荷载转化为压力。",
    observation: "桥面荷载经吊杆拉起，再由拱肋沿弧线把压力送到两岸拱座。",
    parts: [
      {
        id: "arch",
        label: "拱肋",
        description: "拱肋是拱桥的核心构件，主要承受沿拱轴方向的压力，把荷载送往两岸。"
      },
      {
        id: "hanger",
        label: "吊杆",
        description: "吊杆把桥面与拱肋连接起来，通过受拉作用将桥面荷载悬吊到拱肋上。"
      },
      {
        id: "deck",
        label: "桥面梁",
        description: "桥面梁承接车辆荷载，并通过吊杆逐段传递给上方的拱肋。"
      },
      {
        id: "abutment",
        label: "拱座",
        description: "拱座位于拱的两端，为拱肋提供坚固的反力支撑，并继续把力量传给地基。"
      }
    ]
  },
  {
    id: "wenchang",
    order: "03",
    name: "文昌大桥",
    alias: "WENCHANG BRIDGE · 2005",
    year: "2005",
    type: "连续梁桥",
    family: "预应力混凝土连续箱梁桥",
    size: "1.713 km",
    accent: "#6fa9ab",
    model: "continuous",
    deflectionBase: 6.5,
    map: { x: 52, y: 52 },
    tag: "柳江第11座跨江大桥",
    tagline: "让多个桥跨共同分担，让长桥保持从容。",
    description:
      "文昌大桥采用连续箱梁结构，多个桥跨连成整体，车辆荷载可以在相邻桥跨之间重新分配。连续结构减少了桥面接缝，也让行车体验更加平顺。",
    tip: "比较跨中与桥墩附近的响应，留意连续箱梁如何把相邻桥跨连接成一个整体。",
    observation: "连续箱梁跨越多个桥墩，某一跨受力时，相邻桥跨也会参与分担。",
    parts: [
      {
        id: "box-girder",
        label: "连续箱梁",
        description: "连续箱梁跨越多个桥墩并连成整体，具有较好的抗弯与抗扭能力。"
      },
      {
        id: "pier",
        label: "桥墩",
        description: "桥墩支撑连续梁的多个支点，将上部结构荷载传给基础。"
      },
      {
        id: "bearing",
        label: "支座",
        description: "支座位于主梁与桥墩之间，负责传递荷载，同时允许结构产生必要的位移和转动。"
      },
      {
        id: "mid-span",
        label: "跨中",
        description: "跨中是两座桥墩之间的中部区域，也是观察主梁弯曲变形最直观的位置。"
      }
    ]
  },
  {
    id: "baisha",
    order: "04",
    name: "白沙大桥",
    alias: "BAISHA BRIDGE · 2018",
    year: "2018",
    type: "斜拉桥",
    family: "反对称全漂浮斜拉桥",
    size: "环形主塔",
    accent: "#eaa45b",
    model: "cable",
    deflectionBase: 5.5,
    map: { x: 62, y: 43 },
    tag: "柳江第20座跨江大桥 · 柳州之门",
    tagline: "一枚落在江面上的戒指，也是一扇城市之门。",
    description:
      "白沙大桥拥有醒目的环形主塔。斜拉索把桥面荷载汇集到主塔，再由主塔传向基础。“全漂浮”体系让桥面与墩塔之间的关系更轻盈，也让结构受力组织更具特色。",
    tip: "先点亮斜拉索，再观察主塔与桥面的关系：索在受拉，塔把力量压向基础。",
    observation: "斜拉索承担拉力，把桥面重量集中到主塔，再由主塔传向大地。",
    parts: [
      {
        id: "ring",
        label: "环形主塔",
        description: "环形主塔是白沙大桥最有辨识度的结构，也是斜拉索力量汇集与转向的核心。"
      },
      {
        id: "cable",
        label: "斜拉索",
        description: "斜拉索主要承受拉力，像一组张紧的琴弦，把桥面荷载提向主塔。"
      },
      {
        id: "deck",
        label: "漂浮桥面",
        description: "全漂浮体系让桥面通过斜拉索与主塔协同工作，呈现出轻盈的跨江姿态。"
      },
      {
        id: "anchor",
        label: "锚固区",
        description: "锚固区把斜拉索中的拉力可靠地传给主梁或塔身，是索力交接的重要节点。"
      }
    ]
  },
  {
    id: "fenghuangling",
    order: "05",
    name: "凤凰岭大桥",
    alias: "FENGHUANGLING BRIDGE · 2021",
    year: "2021",
    type: "风雨桥",
    family: "跨江风雨桥造型",
    size: "主桥 700 m",
    accent: "#8bb391",
    model: "pavilion",
    deflectionBase: 4.2,
    map: { x: 73, y: 34 },
    tag: "柳江第22座跨江大桥 · 五座风雨亭",
    tagline: "桥不只在渡人，也在安放一座城市的文化记忆。",
    description:
      "凤凰岭大桥把侗族风雨桥的建筑意象带进现代城市交通。五座风雨亭与桥面共同形成连续的城市景观。廊亭承担遮阳避雨的公共空间功能，真正的交通荷载仍由桥面梁、桥墩和基础体系承担。",
    tip: "区分“建筑造型”与“承重结构”：风雨亭提供空间体验，桥面梁和桥墩负责通行安全。",
    observation: "风雨亭塑造文化形象；桥面梁、桥墩和基础共同完成主要交通荷载传递。",
    parts: [
      {
        id: "pavilion",
        label: "风雨亭",
        description: "五座风雨亭延续了风雨桥的文化意象，为行人和城市提供有辨识度的公共空间。"
      },
      {
        id: "gallery",
        label: "连廊屋面",
        description: "连续的屋面形成遮阳避雨的步行空间，也让整座桥的轮廓更完整。"
      },
      {
        id: "deck",
        label: "桥面梁",
        description: "桥面梁承担机动车、非机动车与行人的主要交通荷载，是桥梁的交通承重界面。"
      },
      {
        id: "pier",
        label: "桥墩与基础",
        description: "桥墩与基础把上部结构的力量传到河床，保障整座桥长期稳定工作。"
      }
    ]
  }
];

const comparisonProfiles = {
  girder: {
    force: "主梁主要受弯，桥墩受压",
    members: "桥面 · 主梁 · 桥墩 · 基础",
    scene: "城市道路、中等跨度跨江交通",
    question: "车辆荷载如何经主梁传给桥墩？"
  },
  arch: {
    force: "拱肋主要受压，吊杆受拉",
    members: "桥面梁 · 吊杆 · 拱肋 · 拱座",
    scene: "需要较强跨越能力与景观表现",
    question: "为什么拱肋能把荷载变成压力？"
  },
  continuous: {
    force: "连续箱梁受弯，多跨共同分担",
    members: "连续箱梁 · 支座 · 桥墩 · 基础",
    scene: "较长桥面、需要平顺行车体验",
    question: "相邻桥跨如何参与荷载分担？"
  },
  cable: {
    force: "斜拉索受拉，主塔受压",
    members: "漂浮桥面 · 斜拉索 · 环形主塔 · 锚固区",
    scene: "大跨度、地标形象突出的城市桥梁",
    question: "斜拉索把桥面重量提向哪里？"
  },
  pavilion: {
    force: "桥面梁受弯，风雨亭塑造公共空间",
    members: "风雨亭 · 连廊 · 桥面梁 · 桥墩",
    scene: "交通与文化形象并重的城市地标",
    question: "建筑造型与承重结构如何区分？"
  }
};

const learningGoals = {
  girder: "学完后，你能说明车辆荷载如何经主梁、桥墩和基础传向地基。",
  arch: "学完后，你能解释拱肋为什么主要受压，以及吊杆如何把桥面提住。",
  continuous: "学完后，你能说明连续箱梁为什么能让相邻桥跨共同分担荷载。",
  cable: "学完后，你能区分斜拉索的拉力、主塔的受压和桥面的漂浮关系。",
  pavilion: "学完后，你能区分风雨亭的文化造型与桥梁的真实承重体系。"
};

const bridgeSources = {
  liujiang: [1, 3],
  wenhui: [1, 3],
  wenchang: [3],
  baisha: [1, 3],
  fenghuangling: [2, 3]
};

const sourceLibrary = {
  1: {
    name: "广西新闻网",
    url: "http://www.gxnews.com.cn/staticpages/20180917/newgx5b9ee61c-17651300.shtml"
  },
  2: {
    name: "澎湃新闻·柳州1号",
    url: "https://www.thepaper.cn/newsDetail_forward_16077854"
  },
  3: {
    name: "柳州市文旅资料",
    url: "https://news.sohu.com/a/507612954_121106875"
  }
};

const quizQuestions = [
  {
    question: "柳江大桥建成于哪一年？",
    options: ["1958年", "1968年", "1978年"],
    answer: 1,
    explanation: "柳江大桥于1968年建成通车，是柳州市区第一座跨江公路大桥。"
  },
  {
    question: "文惠桥最突出的结构特征是什么？",
    options: ["中承式钢管混凝土拱桥", "双塔悬索桥", "全漂浮斜拉桥"],
    answer: 0,
    explanation: "文惠桥是广西第一座中承式钢管混凝土拱桥，弧形的拱肋是它最醒目的结构语言。"
  },
  {
    question: "连续梁桥把相邻桥跨连成整体，主要好处是什么？",
    options: ["相邻桥跨可以共同分担荷载", "完全不再需要桥墩", "只依靠桥面铺装承重"],
    answer: 0,
    explanation: "连续箱梁跨越多个桥墩并连成整体，某一跨受力时，相邻桥跨也会参与分担。"
  },
  {
    question: "如何理解凤凰岭大桥的风雨亭与承重结构？",
    options: ["风雨亭体现文化造型，交通荷载仍由桥梁结构承担", "所有交通荷载由屋顶承担", "风雨亭只是无作用的装饰"],
    answer: 0,
    explanation: "风雨亭提供遮阳避雨与公共空间，真正的交通荷载由桥面梁、桥墩和基础体系承担。"
  },
  {
    question: "斜拉桥中的斜拉索主要承受哪种力？",
    options: ["压力", "拉力", "静摩擦力"],
    answer: 1,
    explanation: "斜拉索处于张紧状态，主要承受拉力，把桥面荷载提向主塔。"
  },
  {
    question: "拱桥的拱肋通常主要通过什么方式传力？",
    options: ["沿拱轴传递压力", "只靠吊杆承重", "完全依靠桥墩抗拉"],
    answer: 0,
    explanation: "拱的形态使竖向荷载可以转化为沿拱轴方向的压力，再传到两岸拱座。"
  }
];

const state = {
  activeBridgeId: "liujiang",
  view: "structure",
  load: 35,
  visited: new Set(),
  quizIndex: 0,
  quizScore: 0,
  quizAnswers: [],
  quizAnswered: false,
  selectedPart: null,
  flowIndex: -1,
  flowActive: false,
  exploded: false,
  isDragging: false,
  dragStart: null,
  rotation: { x: 0, y: 0 },
  suppressClick: false,
  toastTimer: null
};

const elements = {};

document.addEventListener("DOMContentLoaded", init);

function init() {
  cacheElements();
  restoreProgress();
  bindGlobalEvents();
  renderMapMarkers();
  selectBridge("liujiang", { initial: true, scrollLab: false, updateUrl: false });
  renderCompareGrid();
  renderQuiz();
  setupRevealAnimations();
  updateVisitedUI();
  restoreUrlState();
  initializeGuide();
}

function cacheElements() {
  elements.guideDialog = document.getElementById("guideDialog");
  elements.closeGuide = document.getElementById("closeGuide");
  elements.beginGuide = document.getElementById("beginGuide");
  elements.skipGuide = document.getElementById("skipGuide");
  elements.showGuideButton = document.getElementById("showGuideButton");
  elements.resetProgress = document.getElementById("resetProgress");
  elements.header = document.querySelector(".site-header");
  elements.riverMarkers = document.getElementById("riverMarkers");
  elements.bridgeProfile = document.getElementById("bridgeProfile");
  elements.bridgeStage = document.getElementById("bridgeStage");
  elements.bridgeScene = document.getElementById("bridgeScene");
  elements.stageBridgeName = document.getElementById("stageBridgeName");
  elements.bridgeTip = document.getElementById("bridgeTip");
  elements.partCallout = document.getElementById("partCallout");
  elements.calloutPart = document.getElementById("calloutPart");
  elements.calloutTitle = document.getElementById("calloutTitle");
  elements.calloutText = document.getElementById("calloutText");
  elements.closeCallout = document.getElementById("closeCallout");
  elements.labBridgeName = document.getElementById("labBridgeName");
  elements.labBridgeType = document.getElementById("labBridgeType");
  elements.labBridgeYear = document.getElementById("labBridgeYear");
  elements.labBridgeSize = document.getElementById("labBridgeSize");
  elements.labBridgeFamily = document.getElementById("labBridgeFamily");
  elements.labObservation = document.getElementById("labObservation");
  elements.loadSlider = document.getElementById("loadSlider");
  elements.loadOutput = document.getElementById("loadOutput");
  elements.pathStatus = document.getElementById("pathStatus");
  elements.deflectionStatus = document.getElementById("deflectionStatus");
  elements.deflectionMeter = document.getElementById("deflectionMeter");
  elements.partButtons = document.getElementById("partButtons");
  elements.compareGrid = document.getElementById("compareGrid");
  elements.startFlow = document.getElementById("startFlow");
  elements.flowPanel = document.getElementById("flowPanel");
  elements.closeFlow = document.getElementById("closeFlow");
  elements.flowDots = document.getElementById("flowDots");
  elements.flowTitle = document.getElementById("flowTitle");
  elements.flowText = document.getElementById("flowText");
  elements.flowCounter = document.getElementById("flowCounter");
  elements.flowPrev = document.getElementById("flowPrev");
  elements.flowNext = document.getElementById("flowNext");
  elements.explodeToggle = document.getElementById("explodeToggle");
  elements.rotateLeft = document.getElementById("rotateLeft");
  elements.rotateRight = document.getElementById("rotateRight");
  elements.resetView = document.getElementById("resetView");
  elements.quizContent = document.getElementById("quizContent");
  elements.quizProgressBar = document.getElementById("quizProgressBar");
  elements.quizLiveScore = document.getElementById("quizLiveScore");
  elements.headerVisitedCount = document.getElementById("headerVisitedCount");
  elements.progressPill = document.getElementById("progressPill");
  elements.toast = document.getElementById("toast");
}

function bindGlobalEvents() {
  window.addEventListener("scroll", updateHeaderState, { passive: true });
  window.addEventListener("resize", debounce(resetSceneRotationIfNarrow, 180));
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && state.flowActive) closeFlowGuide();
  });

  [elements.closeGuide, elements.beginGuide, elements.skipGuide].forEach((button) => {
    button.addEventListener("click", closeGuide);
  });
  elements.showGuideButton.addEventListener("click", openGuide);
  elements.guideDialog.addEventListener("click", (event) => {
    if (event.target === elements.guideDialog) closeGuide();
  });
  elements.guideDialog.addEventListener("close", markGuideSeen);

  elements.resetProgress.addEventListener("click", () => {
    state.visited.clear();
    state.visited.add(state.activeBridgeId);
    persistVisited();
    updateVisitedUI();
    showToast("探索记录已清除，当前桥梁保留为起点。");
  });

  elements.riverMarkers.addEventListener("click", (event) => {
    const marker = event.target.closest("[data-bridge-id]");
    if (!marker) return;
    selectBridge(marker.dataset.bridgeId, { scrollLab: false });
  });

  elements.bridgeProfile.addEventListener("click", (event) => {
    const button = event.target.closest("[data-open-lab]");
    if (!button) return;
    document.getElementById("lab").scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      showToast("已进入结构实验室，点击构件继续观察。");
    }, 500);
  });

  document.querySelectorAll(".view-button").forEach((button) => {
    button.addEventListener("click", () => setView(button.dataset.view));
  });

  elements.startFlow.addEventListener("click", startFlowGuide);
  elements.closeFlow.addEventListener("click", closeFlowGuide);
  elements.flowPrev.addEventListener("click", () => setFlowStep(state.flowIndex - 1));
  elements.flowNext.addEventListener("click", advanceFlowGuide);
  elements.flowDots.addEventListener("click", (event) => {
    const step = event.target.closest("[data-flow-step]");
    if (step) setFlowStep(Number(step.dataset.flowStep));
  });
  elements.explodeToggle.addEventListener("click", toggleExploded);
  elements.rotateLeft.addEventListener("click", () => nudgeSceneRotation(-8));
  elements.rotateRight.addEventListener("click", () => nudgeSceneRotation(8));
  elements.resetView.addEventListener("click", resetSceneRotation);

  elements.compareGrid.addEventListener("click", (event) => {
    const card = event.target.closest("[data-compare-id]");
    if (!card) return;
    event.preventDefault();
    selectBridge(card.dataset.compareId, { scrollLab: true });
  });

  elements.loadSlider.addEventListener("input", () => {
    state.load = Number(elements.loadSlider.value);
    if (state.view !== "force") setView("force", { keepFlow: state.flowActive });
    updatePhysics();
  });

  elements.partButtons.addEventListener("click", (event) => {
    const button = event.target.closest("[data-part]");
    if (!button) return;
    showPart(button.dataset.part);
  });

  elements.bridgeScene.addEventListener("click", (event) => {
    if (state.suppressClick) {
      state.suppressClick = false;
      return;
    }
    const part = event.target.closest("[data-part]");
    if (!part) return;
    showPart(part.dataset.part);
  });

  elements.bridgeScene.addEventListener("keydown", (event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    const part = event.target.closest("[data-part]");
    if (!part) return;
    event.preventDefault();
    showPart(part.dataset.part);
  });

  elements.closeCallout.addEventListener("click", hideCallout);

  elements.bridgeStage.addEventListener("pointerdown", startSceneDrag);
  elements.bridgeStage.addEventListener("pointermove", moveSceneDrag);
  elements.bridgeStage.addEventListener("pointerup", endSceneDrag);
  elements.bridgeStage.addEventListener("pointercancel", endSceneDrag);
  elements.bridgeStage.addEventListener("dblclick", resetSceneRotation);

  elements.quizContent.addEventListener("click", handleQuizClick);

  elements.progressPill.addEventListener("click", () => {
    const missing = bridges.filter((bridge) => !state.visited.has(bridge.id));
    document.getElementById("map").scrollIntoView({ behavior: "smooth", block: "start" });
    window.setTimeout(() => {
      showToast(
        missing.length
          ? `还有 ${missing.length} 座桥等待解锁：${missing.map((item) => item.name).join("、")}。`
          : "五座桥梁已全部解锁，可以继续挑战结构实验室。"
      );
    }, 500);
  });
}

function restoreProgress() {
  try {
    const saved = JSON.parse(localStorage.getItem("bridge-observatory-visited") || "[]");
    if (Array.isArray(saved)) {
      saved.forEach((id) => {
        if (bridges.some((bridge) => bridge.id === id)) state.visited.add(id);
      });
    }
  } catch {
    // A blocked storage API should not prevent the main experience from running.
  }

  state.visited.add("liujiang");
  persistVisited();
}

function persistVisited() {
  try {
    localStorage.setItem("bridge-observatory-visited", JSON.stringify([...state.visited]));
  } catch {
    // The experience remains fully usable in memory when storage is unavailable.
  }
}

function renderMapMarkers() {
  elements.riverMarkers.innerHTML = bridges
    .map(
      (bridge) => `
        <button
          class="map-marker"
          type="button"
          data-bridge-id="${bridge.id}"
          style="left:${bridge.map.x}%;top:${bridge.map.y}%"
          aria-label="查看${bridge.name}，${bridge.year}年，${bridge.type}"
        >
          <span class="marker-pin"><span>${bridge.order}</span></span>
          <span class="marker-copy">
            <strong>${bridge.name}</strong>
            <small>${bridge.year} · ${bridge.type}</small>
          </span>
        </button>
      `
    )
    .join("");
}

function renderCompareGrid() {
  elements.compareGrid.innerHTML = bridges
    .map((bridge) => {
      const profile = comparisonProfiles[bridge.model];
      return `
        <a
          class="compare-card"
          href="#lab"
          data-compare-id="${bridge.id}"
          style="--profile-accent:${bridge.accent}"
          aria-label="比较${bridge.name}并返回结构实验室"
        >
          <div class="compare-card-top">
            <span class="compare-index">${bridge.order}</span>
            <span class="compare-year">${bridge.year}</span>
          </div>
          <div class="compare-art">${profileSketch(bridge)}</div>
          <div class="compare-title-row">
            <h3>${bridge.name}</h3>
            <span>${bridge.type}</span>
          </div>
          <dl class="compare-facts">
            <div><dt>主要受力</dt><dd>${profile.force}</dd></div>
            <div><dt>关键构件</dt><dd>${profile.members}</dd></div>
            <div><dt>典型场景</dt><dd>${profile.scene}</dd></div>
          </dl>
          <p class="compare-question"><span>观察问题</span>${profile.question}</p>
          <span class="compare-open">返回实验模型 <b>→</b></span>
        </a>
      `;
    })
    .join("");
}

function initializeGuide() {
  let guideSeen = false;
  try {
    guideSeen = localStorage.getItem("bridge-observatory-guide-seen") === "1";
  } catch {
    // Storage can be unavailable without affecting the guide itself.
  }
  if (guideSeen) return;
  window.setTimeout(openGuide, 650);
}

function openGuide() {
  if (elements.guideDialog.open) return;
  if (typeof elements.guideDialog.showModal === "function") {
    elements.guideDialog.showModal();
  } else {
    elements.guideDialog.setAttribute("open", "");
  }
}

function closeGuide() {
  if (elements.guideDialog.open && typeof elements.guideDialog.close === "function") {
    elements.guideDialog.close();
  } else {
    elements.guideDialog.removeAttribute("open");
    markGuideSeen();
  }
}

function markGuideSeen() {
  try {
    localStorage.setItem("bridge-observatory-guide-seen", "1");
  } catch {
    // The guide can still be dismissed for the current session.
  }
}

function restoreUrlState() {
  const rawHash = window.location.hash.replace(/^#/, "");
  if (!rawHash) return;

  if (rawHash.includes("=")) {
    const params = new URLSearchParams(rawHash);
    const bridgeId = params.get("bridge");
    const mode = params.get("mode");
    const exploded = params.get("explode") === "1";
    if (bridges.some((bridge) => bridge.id === bridgeId)) {
      selectBridge(bridgeId, { updateUrl: false, scrollLab: true });
    }
    if (["structure", "force", "night"].includes(mode)) {
      setView(mode, { updateUrl: false, keepFlow: true });
    }
    if (exploded) {
      state.exploded = true;
      elements.bridgeStage.classList.add("is-exploded");
      elements.explodeToggle.classList.add("is-active");
      elements.explodeToggle.setAttribute("aria-pressed", "true");
    }
    return;
  }

  window.setTimeout(() => {
    document.getElementById(rawHash)?.scrollIntoView({ block: "start" });
  }, 260);
}

function updateUrlState() {
  const params = new URLSearchParams();
  params.set("bridge", state.activeBridgeId);
  params.set("mode", state.view);
  if (state.exploded) params.set("explode", "1");
  try {
    history.replaceState(null, "", `#${params.toString()}`);
  } catch {
    // The app remains usable when the browser blocks history updates.
  }
}

function selectBridge(id, options = {}) {
  const bridge = bridges.find((item) => item.id === id);
  if (!bridge) return;

  if (state.flowActive) closeFlowGuide();
  const isNewVisit = !state.visited.has(bridge.id);
  state.activeBridgeId = bridge.id;
  state.visited.add(bridge.id);
  state.selectedPart = null;
  persistVisited();

  elements.bridgeProfile.classList.add("is-changing");
  window.setTimeout(() => {
    renderBridgeProfile(bridge);
    elements.bridgeProfile.classList.remove("is-changing");
  }, options.initial ? 0 : 90);

  document.querySelectorAll(".map-marker").forEach((marker) => {
    const active = marker.dataset.bridgeId === bridge.id;
    marker.classList.toggle("is-active", active);
    marker.classList.toggle("is-visited", state.visited.has(marker.dataset.bridgeId));
    marker.setAttribute("aria-current", active ? "true" : "false");
  });

  renderLabBridge(bridge);
  updateVisitedUI();
  resetSceneRotation();
  hideCallout();
  if (options.updateUrl !== false) updateUrlState();
  if (options.scrollLab) {
    document.getElementById("lab").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (isNewVisit && !options.initial) {
    showToast(`已解锁「${bridge.name}」：${bridge.tag}`);
  }
}

function renderBridgeProfile(bridge) {
  elements.bridgeProfile.style.setProperty("--profile-accent", bridge.accent);
  const refs = (bridgeSources[bridge.id] || [])
    .map((sourceId) => {
      const source = sourceLibrary[sourceId];
      return `<a href="${source.url}" target="_blank" rel="noreferrer">[${sourceId}] ${source.name}</a>`;
    })
    .join("");
  elements.bridgeProfile.innerHTML = `
    <div class="profile-top">
      <span class="profile-index">${bridge.order} / 05</span>
      <span class="profile-year">${bridge.year}</span>
    </div>
    <div class="profile-hero">${profileSketch(bridge)}</div>
    <h3>${bridge.name}</h3>
    <p class="profile-alias">${bridge.alias}</p>
    <p class="profile-tagline">${bridge.tagline}</p>
    <p class="profile-goal"><span>本桥学习目标</span>${learningGoals[bridge.model]}</p>
    <p class="profile-description">${bridge.description}</p>
    <div class="profile-specs">
      <div><span>结构家族</span><strong>${bridge.family}</strong></div>
      <div><span>关键信息</span><strong>${bridge.size}</strong></div>
      <div><span>时代坐标</span><strong>${bridge.year} 年</strong></div>
      <div><span>城市标签</span><strong>${bridge.tag}</strong></div>
    </div>
    <div class="profile-sources"><span>资料依据</span>${refs}</div>
    <div class="profile-footer">
      <span>已加入探索档案</span>
      <button class="profile-action" type="button" data-open-lab>
        去做受力实验
        <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3 8h9M8.5 3.5 13 8l-4.5 4.5" /></svg>
      </button>
    </div>
  `;
}

function profileSketch(bridge) {
  const commonWater = `
    <path class="profile-water" d="M12 111c72-15 122-12 184 2s103 15 181-1" />
  `;

  if (bridge.model === "arch") {
    return `
      <svg viewBox="0 0 400 130" aria-hidden="true">
        <path class="profile-fill" d="M58 96C102 16 151 7 200 7s98 9 142 89Z" />
        <path d="M58 96c44-80 93-89 142-89s98 9 142 89M106 96h188M37 96h326" />
        <path d="M105 49v47M141 28v68M178 15v81M222 15v81M259 28v68M295 49v47" />
        ${commonWater}
      </svg>
    `;
  }

  if (bridge.model === "cable") {
    return `
      <svg viewBox="0 0 400 130" aria-hidden="true">
        <ellipse class="profile-fill" cx="200" cy="49" rx="39" ry="45" />
        <ellipse cx="200" cy="49" rx="39" ry="45" />
        <path d="M40 94h320M200 94v-4M160 93l31-39M240 93l-31-39M130 93l56-34M270 93l-56-34M100 93l74-28M300 93l-74-28" />
        ${commonWater}
      </svg>
    `;
  }

  if (bridge.model === "pavilion") {
    return `
      <svg viewBox="0 0 400 130" aria-hidden="true">
        <path class="profile-fill" d="M48 82 82 57l34 25 34-34 34 34 34-34 34 34 34-34 34 34v20H48Z" />
        <path d="M28 92h344M62 92V71M132 92V60M200 92V51M268 92V60M338 92V71" />
        <path d="m45 71 34-19 34 19M111 60l34-19 34 19M177 51l23-19 23 19M237 60l34-19 34 19M305 71l34-19 34 19" />
        ${commonWater}
      </svg>
    `;
  }

  if (bridge.model === "continuous") {
    return `
      <svg viewBox="0 0 400 130" aria-hidden="true">
        <path class="profile-fill" d="M40 78h320v16H40Z" />
        <path d="M25 85h350M40 78c85-10 235-10 320 0M98 94V67M183 94V64M267 94V67M50 94h315" />
        ${commonWater}
      </svg>
    `;
  }

  return `
    <svg viewBox="0 0 400 130" aria-hidden="true">
      <path class="profile-fill" d="M47 81h306v18H47Z" />
      <path d="M28 91h344M47 77h306M91 99V75M165 99V75M239 99V75M313 99V75" />
      ${commonWater}
    </svg>
  `;
}

function renderLabBridge(bridge) {
  elements.stageBridgeName.textContent = bridge.name;
  elements.labBridgeName.textContent = bridge.name;
  elements.labBridgeType.textContent = bridge.type;
  elements.labBridgeYear.textContent = bridge.year;
  elements.labBridgeSize.textContent = bridge.size;
  elements.labBridgeFamily.textContent = bridge.family;
  elements.bridgeTip.textContent = bridge.tip;
  elements.labObservation.textContent = bridge.observation;
  elements.bridgeScene.innerHTML = buildBridgeScene(bridge);
  renderPartButtons(bridge);
  updatePhysics();
}

function renderPartButtons(bridge) {
  elements.partButtons.innerHTML = bridge.parts
    .map(
      (part) => `
        <button class="part-button" type="button" data-part="${part.id}">
          ${part.label}
        </button>
      `
    )
    .join("");
}

function buildBridgeScene(bridge) {
  const label = partsLabelMap(bridge);
  return `
    <svg
      class="bridge-svg"
      viewBox="0 0 1000 540"
      role="img"
      aria-labelledby="bridge-scene-title bridge-scene-desc"
    >
      <title id="bridge-scene-title">${bridge.name}结构教学示意</title>
      <desc id="bridge-scene-desc">${bridge.family}。可点击结构构件查看说明，拖动可旋转视角。</desc>
      <defs>
        <filter id="bridge-glow" x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      ${sceneBackdrop()}
      ${sceneForModel(bridge, label)}
      ${forceOverlay(bridge)}
    </svg>
  `;
}

function partsLabelMap(bridge) {
  return Object.fromEntries(bridge.parts.map((part) => [part.id, escapeAttribute(part.label)]));
}

function sceneBackdrop() {
  return `
    <g class="scene-backdrop" aria-hidden="true">
      <circle class="scene-sun" cx="795" cy="98" r="36" fill="#f5d28f" opacity=".66" />
      <path d="M0 310 92 239l96 67 91-119 94 86 93-150 113 141 91-92 111 78 119-97v217H0Z" fill="#6a9c91" opacity=".18" />
      <path d="M0 348c79-48 155-38 237-14 89 26 140-2 223-43 104-51 184-5 257 27 82 36 145 5 283-18v180H0Z" fill="#5d938c" opacity=".19" />
      <g class="scene-city" fill="#315f65" opacity=".4">
        <path d="M47 356v-73h20v73M80 356v-111h32v111M125 356v-57h21v57M830 356v-92h28v92M872 356v-128h37v128M922 356v-62h22v62" />
        <g fill="#f7c777" opacity=".85">
          <rect x="86" y="262" width="5" height="8" />
          <rect x="96" y="278" width="5" height="8" />
          <rect x="878" y="258" width="5" height="8" />
          <rect x="891" y="276" width="5" height="8" />
          <rect x="900" y="292" width="5" height="8" />
        </g>
      </g>
      <path d="M0 407c93-22 166 11 264-2 119-15 154-44 255-25 101 18 178 39 259 12 84-28 135-13 222-21v169H0Z" fill="#2a7b84" opacity=".66" />
      <g fill="none" stroke="#d6f0e8" stroke-linecap="round" opacity=".22">
        <path d="M65 452c49-8 78-6 123 3M247 497c68-10 121-8 194 5M509 454c58-10 106-7 172 5M680 510c46-6 98-4 147 3M92 521c44-6 84-5 125 1" />
      </g>
      <path d="M0 407c93-22 166 11 264-2 119-15 154-44 255-25 101 18 178 39 259 12 84-28 135-13 222-21" fill="none" stroke="#b9e0d7" stroke-width="1.2" opacity=".34" />
    </g>
  `;
}

function sceneForModel(bridge, labels) {
  if (bridge.model === "arch") return archScene(bridge, labels);
  if (bridge.model === "continuous") return continuousScene(bridge, labels);
  if (bridge.model === "cable") return cableScene(bridge, labels);
  if (bridge.model === "pavilion") return pavilionScene(bridge, labels);
  return girderScene(bridge, labels);
}

function partAttributes(id, labels) {
  return `class="part" data-part="${id}" tabindex="0" role="button" aria-label="${labels[id]}：查看构件说明"`;
}

function vehicles(x1 = 365, x2 = 595, y = 303) {
  return `
    <g aria-hidden="true">
      <g transform="translate(${x1} ${y})">
        <g class="vehicle">
          <rect width="45" height="17" rx="7" fill="#f6f0e5" />
          <rect x="9" y="-8" width="24" height="10" rx="5" fill="#f6f0e5" />
          <rect x="12" y="-5" width="16" height="6" rx="2" fill="#609295" opacity=".7" />
          <circle cx="11" cy="18" r="4" fill="#163b43" />
          <circle cx="35" cy="18" r="4" fill="#163b43" />
        </g>
      </g>
      <g transform="translate(${x2} ${y}) scale(.86)">
        <g class="vehicle second">
          <rect width="45" height="17" rx="7" fill="${bridgeVehicleAccent()}" />
          <rect x="9" y="-8" width="24" height="10" rx="5" fill="${bridgeVehicleAccent()}" />
          <rect x="12" y="-5" width="16" height="6" rx="2" fill="#f6e5c2" opacity=".6" />
          <circle cx="11" cy="18" r="4" fill="#163b43" />
          <circle cx="35" cy="18" r="4" fill="#163b43" />
        </g>
      </g>
    </g>
  `;
}

let currentVehicleAccent = "#f47c4d";
function bridgeVehicleAccent() {
  return currentVehicleAccent;
}

function girderScene(bridge, labels) {
  currentVehicleAccent = bridge.accent;
  return `
    <g class="model-shadow" aria-hidden="true" opacity=".14">
      <ellipse cx="500" cy="470" rx="350" ry="22" fill="#082d37" />
    </g>
    <g class="deflectable">
      <g ${partAttributes("deck", labels)}>
        <rect x="88" y="308" width="824" height="38" rx="8" fill="#e8dfca" />
        <path d="M110 312h780" stroke="#f7f2e7" stroke-width="7" stroke-linecap="round" />
        <path d="M110 334h780" stroke="#526c6d" stroke-width="3" stroke-linecap="round" />
        <path d="M110 309v13M890 309v13M180 309v13M250 309v13M330 309v13M410 309v13M490 309v13M570 309v13M650 309v13M730 309v13M810 309v13" stroke="#a56d50" stroke-width="2" opacity=".7" />
      </g>
      <g ${partAttributes("girder", labels)}>
        <path d="M129 346h742l-42 35H174Z" fill="${bridge.accent}" opacity=".77" />
        <path d="M198 352h604M230 366h540" stroke="#fff0d4" stroke-width="2" opacity=".42" />
      </g>
      ${vehicles()}
    </g>
    <g ${partAttributes("pier", labels)}>
      <path d="M276 382h46v115h-46zM476 382h48v115h-48zM678 382h46v115h-46z" fill="#415f62" />
      <path d="M265 375h68v18h-68zM464 375h72v18h-72zM666 375h70v18h-70z" fill="#d6c8b3" />
    </g>
    <g ${partAttributes("foundation", labels)}>
      <path d="M235 490h488v36H235z" fill="#294c53" opacity=".8" />
      <path d="M258 498h102M437 498h126M668 498h43" stroke="#88aaa4" stroke-width="4" stroke-linecap="round" opacity=".52" />
    </g>
  `;
}

function archScene(bridge, labels) {
  currentVehicleAccent = bridge.accent;
  const hangerXs = [274, 344, 414, 484, 544, 614, 684, 754];
  const hangers = hangerXs
    .map((x) => {
      const y = archY(x);
      return `<path d="M${x} ${y}v${344 - y}" />`;
    })
    .join("");

  return `
    <g class="model-shadow" aria-hidden="true" opacity=".13">
      <ellipse cx="500" cy="476" rx="330" ry="20" fill="#082d37" />
    </g>
    <g ${partAttributes("abutment", labels)}>
      <path d="M102 365h88v132h-88zM810 365h88v132h-88z" fill="#49676a" />
      <path d="M87 358h116v21H87zM797 358h116v21H797z" fill="#d9cab1" />
    </g>
    <g ${partAttributes("arch", labels)}>
      <path class="stress-line" d="M184 354C235 94 369 78 500 78s265 16 316 276" fill="none" stroke="${bridge.accent}" stroke-width="39" stroke-linecap="round" />
      <path d="M184 354C235 94 369 78 500 78s265 16 316 276" fill="none" stroke="#f4d294" stroke-width="3" opacity=".45" />
      <path class="stress-glow" d="M184 354C235 94 369 78 500 78s265 16 316 276" fill="none" stroke="#ff8054" stroke-width="12" stroke-linecap="round" opacity=".08" />
    </g>
    <g class="hangers" ${partAttributes("hanger", labels)}>
      <g fill="none" stroke="${bridge.accent}" stroke-width="5" opacity=".82">${hangers}</g>
    </g>
    <g class="deflectable">
      <g ${partAttributes("deck", labels)}>
        <rect x="102" y="339" width="796" height="35" rx="7" fill="#e9dfcc" />
        <path d="M128 344h744" stroke="#f7f2e7" stroke-width="6" stroke-linecap="round" />
        <path d="M129 364h744" stroke="#526c6d" stroke-width="3" stroke-linecap="round" />
      </g>
      ${vehicles(370, 598, 333)}
    </g>
  `;
}

function archY(x) {
  const t = Math.max(0, Math.min(1, (x - 184) / 632));
  return 354 - 276 * 4 * t * (1 - t);
}

function continuousScene(bridge, labels) {
  currentVehicleAccent = bridge.accent;
  return `
    <g class="model-shadow" aria-hidden="true" opacity=".13">
      <ellipse cx="500" cy="475" rx="370" ry="20" fill="#082d37" />
    </g>
    <g ${partAttributes("pier", labels)}>
      <path d="M264 372h45v139h-45zM477 372h46v139h-46zM690 372h45v139h-45z" fill="#456568" />
      <path d="M253 366h67v18h-67zM466 366h68v18h-68zM679 366h67v18h-67z" fill="#d7c8b2" />
    </g>
    <g class="deflectable">
      <g ${partAttributes("box-girder", labels)}>
        <path d="M90 320Q288 298 500 306T910 313v39Q684 345 500 338T90 362Z" fill="${bridge.accent}" opacity=".78" />
        <path d="M130 330Q334 313 500 319T870 322" fill="none" stroke="#f8e9cd" stroke-width="4" opacity=".48" />
        <path d="M153 351h701" fill="none" stroke="#284b51" stroke-width="3" opacity=".48" />
      </g>
      <g ${partAttributes("deck", labels)}>
        <path d="M88 304Q288 284 500 291T912 297v25Q685 328 500 321T88 345Z" fill="#ebe2cf" />
        <path d="M111 304Q303 288 501 295T889 300" fill="none" stroke="#fbf7ee" stroke-width="6" stroke-linecap="round" />
      </g>
      ${vehicles(350, 584, 274)}
    </g>
    <g ${partAttributes("bearing", labels)}>
      <path d="M271 352h31v15h-31zM484 352h32v15h-32zM697 352h31v15h-31z" fill="#e1a25c" />
      <path d="M275 357h23M488 357h24M701 357h23" stroke="#70492e" stroke-width="2" opacity=".55" />
    </g>
    <g ${partAttributes("mid-span", labels)}>
      <rect x="420" y="298" width="160" height="112" fill="transparent" />
      <path d="M459 333h102" stroke="#fff0d3" stroke-width="2" stroke-dasharray="5 7" opacity=".65" />
      <circle cx="500" cy="333" r="5" fill="#fff6e8" opacity=".8" />
    </g>
  `;
}

function cableScene(bridge, labels) {
  currentVehicleAccent = bridge.accent;
  const deckY = 357;
  const towerX = 500;
  const cablePaths = [
    [412, 180, 182, deckY - 21],
    [442, 126, 251, deckY - 21],
    [476, 94, 322, deckY - 21],
    [524, 94, 678, deckY - 21],
    [558, 126, 749, deckY - 21],
    [588, 180, 818, deckY - 21]
  ]
    .map(
      ([x1, y1, x2, y2], index) =>
        `<path d="M${x1} ${y1} Q${(x1 + x2) / 2} ${240 + index * 5} ${x2} ${y2}" />`
    )
    .join("");

  return `
    <g class="model-shadow" aria-hidden="true" opacity=".13">
      <ellipse cx="500" cy="477" rx="348" ry="21" fill="#082d37" />
    </g>
    <g ${partAttributes("ring", labels)}>
      <path d="M430 263 397 369M570 263l33 106" fill="none" stroke="${bridge.accent}" stroke-width="21" stroke-linecap="round" />
      <ellipse class="ring-pylon" cx="${towerX}" cy="181" rx="94" ry="106" fill="none" stroke="${bridge.accent}" stroke-width="19" />
      <ellipse cx="${towerX}" cy="181" rx="78" ry="90" fill="none" stroke="#ffe2b2" stroke-width="2" opacity=".38" />
      <path class="stress-glow" d="M500 75a94 106 0 1 1-.1 0" fill="none" stroke="#ff8054" stroke-width="10" opacity=".05" />
    </g>
    <g class="cables" ${partAttributes("cable", labels)}>
      <g fill="none" stroke="${bridge.accent}" stroke-width="3.3" opacity=".83">${cablePaths}</g>
    </g>
    <g class="deflectable">
      <g ${partAttributes("deck", labels)}>
        <path d="M72 344Q254 329 500 333T936 344v30Q689 366 500 362T72 374Z" fill="#eae1ce" />
        <path d="M98 345Q280 333 500 337T908 345" fill="none" stroke="#fff8ee" stroke-width="6" stroke-linecap="round" />
        <path d="M106 366Q300 354 500 357T890 366" fill="none" stroke="#526c6d" stroke-width="3" stroke-linecap="round" />
      </g>
      ${vehicles(334, 574, 313)}
    </g>
    <g ${partAttributes("anchor", labels)}>
      <path d="M73 340h48v38H73zM879 340h48v38h-48z" fill="#49666a" />
      <path d="M82 348h30M888 348h30" stroke="#f5d49a" stroke-width="4" stroke-linecap="round" />
    </g>
  `;
}

function pavilionScene(bridge, labels) {
  currentVehicleAccent = bridge.accent;
  const pavilionXs = [230, 365, 500, 635, 770];
  const pavilions = pavilionXs
    .map(
      (x, index) => `
        <g transform="translate(${x} 0)">
          <path d="M-48 258Q-22 226 0 205 22 226 48 258Z" fill="#8dae83" />
          <path d="M-57 260q18-9 28-2 18 12 29 1 18-12 29 0 18 12 28-1 9-7 28 2" fill="none" stroke="${bridge.accent}" stroke-width="6" stroke-linecap="round" />
          <path d="M-32 260v73M32 260v73M-20 263v66M20 263v66" stroke="#b57f4a" stroke-width="5" />
          <path d="M0 210v-11" stroke="${bridge.accent}" stroke-width="4" />
          <circle cx="0" cy="194" r="4" fill="${bridge.accent}" />
          <path d="M-42 281h84" stroke="#6b5139" stroke-width="3" opacity=".55" />
        </g>
      `
    )
    .join("");

  return `
    <g class="model-shadow" aria-hidden="true" opacity=".13">
      <ellipse cx="500" cy="480" rx="365" ry="19" fill="#082d37" />
    </g>
    <g ${partAttributes("pier", labels)}>
      <path d="M193 390h48v125h-48zM361 390h50v125h-50zM557 390h50v125h-50zM731 390h48v125h-48z" fill="#48676a" />
      <path d="M181 383h72v18h-72zM349 383h74v18h-74zM545 383h74v18h-74zM719 383h72v18h-72z" fill="#d8cab3" />
    </g>
    <g class="deflectable">
      <g ${partAttributes("deck", labels)}>
        <rect x="72" y="350" width="856" height="37" rx="8" fill="#e9dfcd" />
        <path d="M100 355h800" stroke="#fff8ee" stroke-width="7" stroke-linecap="round" />
        <path d="M102 376h798" stroke="#526c6d" stroke-width="3" stroke-linecap="round" />
      </g>
      <g ${partAttributes("pavilion", labels)}>
        ${pavilions}
      </g>
      <g ${partAttributes("gallery", labels)}>
        <path d="M174 285h652" stroke="#7d9f79" stroke-width="10" stroke-linecap="round" />
        <path d="M184 294h633" stroke="#f0bd73" stroke-width="2" opacity=".75" />
        <path d="M204 292v59M305 292v59M458 292v59M543 292v59M696 292v59M797 292v59" stroke="#b1804e" stroke-width="3" opacity=".76" />
      </g>
      ${vehicles(398, 594, 335)}
    </g>
  `;
}

function forceOverlay(bridge) {
  return `
    <g class="force-overlay" aria-hidden="true">
      <g transform="translate(312 91)">
        <g class="stress-arrow">
          <path d="M0 0v60M-9 49l9 12 9-12" fill="none" stroke="#fff4df" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="0" cy="-3" r="5" fill="${bridge.accent}" />
        </g>
      </g>
      <g transform="translate(500 68)">
        <g class="stress-arrow">
          <path d="M0 0v78M-10 65l10 14 10-14" fill="none" stroke="#fff4df" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="0" cy="-3" r="5" fill="${bridge.accent}" />
        </g>
      </g>
      <g transform="translate(688 91)">
        <g class="stress-arrow">
          <path d="M0 0v60M-9 49l9 12 9-12" fill="none" stroke="#fff4df" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
          <circle cx="0" cy="-3" r="5" fill="${bridge.accent}" />
        </g>
      </g>
      <g transform="translate(500 64)">
        <rect x="-31" y="-30" width="62" height="20" rx="10" fill="#0b3540" opacity=".72" />
        <text x="0" y="-16" fill="#f8ead4" font-size="9" text-anchor="middle" font-family="'Microsoft YaHei', sans-serif">车辆荷载</text>
      </g>
    </g>
  `;
}

function selectPartVisual(partId) {
  const bridge = getActiveBridge();
  const index = bridge.parts.findIndex((part) => part.id === partId);
  if (index < 0) return null;
  state.selectedPart = partId;

  elements.bridgeScene.querySelectorAll(".part").forEach((element) => {
    element.classList.toggle("is-selected", element.dataset.part === partId);
  });
  elements.partButtons.querySelectorAll(".part-button").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.part === partId);
  });
  return { part: bridge.parts[index], index };
}

function showPart(partId) {
  if (state.flowActive) closeFlowGuide();
  const selection = selectPartVisual(partId);
  if (!selection) return;
  const bridge = getActiveBridge();
  const { part, index } = selection;

  elements.calloutPart.textContent = `构件 ${String(index + 1).padStart(2, "0")} / ${String(
    bridge.parts.length
  ).padStart(2, "0")}`;
  elements.calloutTitle.textContent = part.label;
  elements.calloutText.textContent = part.description;
  elements.partCallout.hidden = false;
}

function hideCallout() {
  elements.partCallout.hidden = true;
  elements.bridgeScene.querySelectorAll(".part.is-selected").forEach((element) => {
    element.classList.remove("is-selected");
  });
  elements.partButtons.querySelectorAll(".part-button.is-active").forEach((button) => {
    button.classList.remove("is-active");
  });
  state.selectedPart = null;
}

function startFlowGuide() {
  if (state.flowActive) {
    closeFlowGuide();
    return;
  }
  const bridge = getActiveBridge();
  state.flowActive = true;
  state.flowIndex = 0;
  elements.startFlow.classList.add("is-active");
  elements.startFlow.setAttribute("aria-pressed", "true");
  elements.flowPanel.hidden = false;
  elements.flowDots.innerHTML = bridge.parts
    .map(
      (part, index) =>
        `<button type="button" data-flow-step="${index}" aria-label="查看第${index + 1}步：${part.label}">${index + 1}</button>`
    )
    .join("");
  setView("force", { keepFlow: true });
  hideCallout();
  setFlowStep(0);
}

function setFlowStep(index) {
  const bridge = getActiveBridge();
  const nextIndex = clamp(index, 0, bridge.parts.length - 1);
  const part = bridge.parts[nextIndex];
  state.flowIndex = nextIndex;
  selectPartVisual(part.id);
  elements.flowTitle.textContent = part.label;
  elements.flowText.textContent = part.description;
  elements.flowCounter.textContent = `${nextIndex + 1} / ${bridge.parts.length}`;
  elements.flowPrev.disabled = nextIndex === 0;
  elements.flowNext.textContent = nextIndex === bridge.parts.length - 1 ? "完成" : "下一步";
  elements.flowDots.querySelectorAll("[data-flow-step]").forEach((button, buttonIndex) => {
    button.classList.toggle("is-active", buttonIndex === nextIndex);
    button.classList.toggle("is-complete", buttonIndex < nextIndex);
  });
}

function advanceFlowGuide() {
  const bridge = getActiveBridge();
  if (state.flowIndex >= bridge.parts.length - 1) {
    closeFlowGuide();
    showToast("力流观察完成，可以继续调节荷载或进入桥型对比。");
    return;
  }
  setFlowStep(state.flowIndex + 1);
}

function closeFlowGuide() {
  state.flowActive = false;
  state.flowIndex = -1;
  elements.flowPanel.hidden = true;
  elements.startFlow.classList.remove("is-active");
  elements.startFlow.setAttribute("aria-pressed", "false");
  elements.bridgeScene.querySelectorAll(".part.is-selected").forEach((element) => {
    element.classList.remove("is-selected");
  });
  elements.partButtons.querySelectorAll(".part-button.is-active").forEach((button) => {
    button.classList.remove("is-active");
  });
  state.selectedPart = null;
}

function toggleExploded() {
  if (state.flowActive) closeFlowGuide();
  state.exploded = !state.exploded;
  elements.bridgeStage.classList.toggle("is-exploded", state.exploded);
  elements.explodeToggle.classList.toggle("is-active", state.exploded);
  elements.explodeToggle.setAttribute("aria-pressed", String(state.exploded));
  hideCallout();
  updateUrlState();
  showToast(state.exploded ? "已进入结构拆解视图。" : "已回到完整结构视图。");
}

function setView(view, options = {}) {
  if (state.flowActive && !options.keepFlow) closeFlowGuide();
  state.view = view;
  elements.bridgeStage.classList.remove("view-structure", "view-force", "view-night");
  elements.bridgeStage.classList.add(`view-${view}`);
  document.querySelectorAll(".view-button").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-pressed", String(active));
  });
  updatePhysics();
  if (options.updateUrl !== false) updateUrlState();
}

function updatePhysics() {
  const bridge = getActiveBridge();
  const load = state.load;
  const deflection = ((bridge.deflectionBase * load) / 100).toFixed(1);
  const response = Math.round(load * 0.86);

  elements.loadOutput.textContent = `${load}%`;
  elements.deflectionMeter.style.width = `${Math.max(8, response)}%`;
  elements.deflectionMeter.style.background =
    load > 74 ? "var(--orange)" : load > 42 ? "var(--gold)" : "var(--teal)";

  elements.pathStatus.textContent = load < 30 ? "轻载" : load < 72 ? "清晰" : "高载";
  elements.deflectionStatus.textContent = load < 40 ? "平稳" : load < 76 ? "明显" : "增大";

  const signal = elements.pathStatus.closest(".response-item")?.querySelector(".signal");
  if (signal) signal.classList.toggle("is-high", load > 72);

  const deflectable = elements.bridgeScene.querySelector(".deflectable");
  if (deflectable) {
    deflectable.style.transform = `translateY(${deflection}px)`;
  }

  elements.bridgeScene.querySelectorAll(".stress-glow").forEach((element) => {
    element.style.opacity = String(0.04 + (load / 100) * 0.68);
  });
  elements.bridgeScene.querySelectorAll(".force-overlay").forEach((element) => {
    element.style.opacity = state.view === "force" ? String(0.18 + (load / 100) * 0.82) : "";
  });
}

function startSceneDrag(event) {
  if (event.button !== undefined && event.button !== 0) return;
  state.isDragging = true;
  state.dragStart = {
    x: event.clientX,
    y: event.clientY,
    rotationX: state.rotation.x,
    rotationY: state.rotation.y
  };
  elements.bridgeStage.classList.add("is-dragging");
  elements.bridgeStage.setPointerCapture?.(event.pointerId);
}

function moveSceneDrag(event) {
  if (!state.isDragging || !state.dragStart) return;
  const dx = event.clientX - state.dragStart.x;
  const dy = event.clientY - state.dragStart.y;
  if (Math.abs(dx) + Math.abs(dy) > 5) state.suppressClick = true;
  state.rotation.y = clamp(state.dragStart.rotationY + dx * 0.035, -15, 15);
  state.rotation.x = clamp(state.dragStart.rotationX - dy * 0.028, -10, 10);
  applySceneRotation();
}

function endSceneDrag(event) {
  if (!state.isDragging) return;
  state.isDragging = false;
  state.dragStart = null;
  elements.bridgeStage.classList.remove("is-dragging");
  elements.bridgeStage.releasePointerCapture?.(event.pointerId);
  window.setTimeout(() => {
    state.suppressClick = false;
  }, 30);
}

function applySceneRotation() {
  elements.bridgeStage.style.setProperty("--scene-rotate-x", `${state.rotation.x}deg`);
  elements.bridgeStage.style.setProperty("--scene-rotate-y", `${state.rotation.y}deg`);
}

function resetSceneRotation() {
  state.rotation = { x: 0, y: 0 };
  applySceneRotation();
}

function nudgeSceneRotation(deltaY) {
  state.rotation.y = clamp(state.rotation.y + deltaY, -15, 15);
  applySceneRotation();
}

function resetSceneRotationIfNarrow() {
  if (window.innerWidth < 700) resetSceneRotation();
}

function renderQuiz() {
  state.quizAnswered = false;
  const question = quizQuestions[state.quizIndex];
  elements.quizLiveScore.textContent = state.quizScore;
  elements.quizProgressBar.style.width = `${(state.quizIndex / quizQuestions.length) * 100}%`;
  elements.quizContent.innerHTML = `
    <div class="quiz-question-block">
      <div class="quiz-question-meta">
        <span>QUESTION ${String(state.quizIndex + 1).padStart(2, "0")} / ${String(
          quizQuestions.length
        ).padStart(2, "0")}</span>
        <i></i>
      </div>
      <h3 class="quiz-question">${question.question}</h3>
      <div class="quiz-options" role="group" aria-label="答案选项">
        ${question.options
          .map(
            (option, index) => `
              <button class="quiz-option" type="button" data-answer="${index}">
                <span class="option-letter">${String.fromCharCode(65 + index)}</span>
                <span class="option-text">${option}</span>
              </button>
            `
          )
          .join("")}
      </div>
      <div id="quizFeedback"></div>
    </div>
  `;
}

function handleQuizClick(event) {
  const optionButton = event.target.closest(".quiz-option");
  if (optionButton && !state.quizAnswered) {
    answerQuiz(Number(optionButton.dataset.answer));
    return;
  }

  const nextButton = event.target.closest("[data-quiz-next]");
  if (nextButton) {
    state.quizIndex += 1;
    if (state.quizIndex >= quizQuestions.length) {
      renderQuizResult();
    } else {
      renderQuiz();
    }
    return;
  }

  const restartButton = event.target.closest("[data-quiz-restart]");
  if (restartButton) {
    state.quizIndex = 0;
    state.quizScore = 0;
    state.quizAnswers = [];
    renderQuiz();
    elements.quizContent.closest(".quiz-card")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }
}

function answerQuiz(selected) {
  state.quizAnswered = true;
  const question = quizQuestions[state.quizIndex];
  const correct = selected === question.answer;
  state.quizAnswers[state.quizIndex] = selected;
  if (correct) state.quizScore += 1;
  elements.quizLiveScore.textContent = state.quizScore;
  elements.quizProgressBar.style.width = `${((state.quizIndex + 1) / quizQuestions.length) * 100}%`;

  elements.quizContent.querySelectorAll(".quiz-option").forEach((button) => {
    const answer = Number(button.dataset.answer);
    button.disabled = true;
    button.classList.toggle("is-correct", answer === question.answer);
    if (answer === selected && !correct) button.classList.add("is-wrong");
  });

  const feedback = document.getElementById("quizFeedback");
  feedback.innerHTML = `
    <div class="quiz-feedback">
      <p>
        <strong>${correct ? "回答正确" : "再想一步"} · ${question.explanation}</strong>
        结构知识来自对构件和传力路径的持续观察。
      </p>
      <button class="quiz-next" type="button" data-quiz-next>
        ${state.quizIndex === quizQuestions.length - 1 ? "查看结果" : "下一题"}
      </button>
    </div>
  `;
}

function renderQuizResult() {
  const score = state.quizScore;
  const total = quizQuestions.length;
  const wrongAnswers = quizQuestions
    .map((question, index) => ({
      question,
      selected: state.quizAnswers[index]
    }))
    .filter(({ question, selected }) => selected !== question.answer);
  const title =
    score >= 5 ? "结构观察员" : score >= 3 ? "桥梁探索者" : "江畔新手";
  const copy =
    score >= 5
      ? "你已经能从桥面看到隐藏的传力路径，继续回到结构实验室尝试不同荷载吧。"
      : score >= 3
        ? "你已掌握主要桥型与构件，再观察一遍斜拉索、拱肋和连续梁，会有新的发现。"
        : "桥梁的故事刚刚开始。回到互动地图与结构实验室，再看一遍构件说明。";

  elements.quizProgressBar.style.width = "100%";
  elements.quizContent.innerHTML = `
    <div class="quiz-result">
      <div>
        <div class="result-seal"><span>${score}<small> / ${total}</small></span></div>
        <h3>${title}</h3>
        <p>${copy}</p>
        <div class="result-review">
          <strong>${wrongAnswers.length ? "错题回顾" : "全部答对"}</strong>
          ${
            wrongAnswers.length
              ? `<ul>${wrongAnswers
                  .slice(0, 3)
                  .map(
                    ({ question }) =>
                      `<li><span>${question.question}</span><b>${question.options[question.answer]}</b></li>`
                  )
                  .join("")}</ul>`
              : "<p>你已经能区分五种桥型的主要传力方式，可以回到实验室继续做荷载实验。</p>"
          }
        </div>
        <div class="result-actions">
          <button class="button button-primary" type="button" data-quiz-restart>
            再挑战一次
            <svg viewBox="0 0 18 18" aria-hidden="true"><path d="M3 9h11M10 4l5 5-5 5" /></svg>
          </button>
          <a class="button button-ghost" href="#compare">查看桥型对比</a>
        </div>
      </div>
    </div>
  `;
  showToast(`本轮得分 ${score}/${total}：${title}`);
}

function updateVisitedUI() {
  elements.headerVisitedCount.textContent = state.visited.size;
  document.querySelectorAll(".map-marker").forEach((marker) => {
    marker.classList.toggle("is-visited", state.visited.has(marker.dataset.bridgeId));
  });
}

function updateHeaderState() {
  elements.header.classList.toggle("is-compact", window.scrollY > 50);
}

function setupRevealAnimations() {
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const revealItems = document.querySelectorAll(".reveal");

  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealItems.forEach((item) => item.classList.add("is-visible"));
    return;
  }

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px" }
  );

  revealItems.forEach((item) => observer.observe(item));
  window.setTimeout(() => {
    document.querySelectorAll(".hero .reveal").forEach((item) => item.classList.add("is-visible"));
  }, 80);
}

function showToast(message) {
  window.clearTimeout(state.toastTimer);
  elements.toast.textContent = message;
  elements.toast.classList.add("is-visible");
  state.toastTimer = window.setTimeout(() => {
    elements.toast.classList.remove("is-visible");
  }, 3200);
}

function getActiveBridge() {
  return bridges.find((bridge) => bridge.id === state.activeBridgeId) || bridges[0];
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function debounce(fn, delay) {
  let timer;
  return (...args) => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => fn(...args), delay);
  };
}
