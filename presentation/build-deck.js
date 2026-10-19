"use strict";

const path = require("node:path");
const fs = require("node:fs");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const deckPath = path.join(root, "桥见柳州-项目路演.pptx");
const previewDir = path.join(root, "docs", "previews");

const C = {
  dark: "0C2935",
  dark2: "103B48",
  paper: "F4F0E6",
  white: "FFFDF8",
  ink: "102D38",
  inkSoft: "38555C",
  teal: "63B7B2",
  tealSoft: "D7EBE4",
  orange: "F47C4D",
  gold: "EFB861",
  sage: "A8C5A0",
  mutedOnDark: "9CB5B2",
  mutedOnLight: "74847F",
  lineOnLight: "D8D1C3",
  lineOnDark: "31525A"
};

const FONT = "Microsoft YaHei";
const ops = [];
let slideNo = 0;

function addSlide(background) {
  slideNo += 1;
  ops.push({
    command: "add",
    parent: "/",
    type: "slide",
    props: { layout: "blank", background }
  });
  return slideNo;
}

function addShape(slide, name, text, x, y, width, height, options = {}) {
  const props = {
    name,
    text,
    x,
    y,
    width,
    height,
    font: FONT,
    size: String(options.size ?? 18),
    color: options.color ?? C.ink,
    bold: String(options.bold ?? false),
    align: options.align ?? "left",
    valign: options.valign ?? "top",
    fill: options.fill ?? "none",
    line: options.line ?? "none",
    margin: options.margin ?? "0.04cm",
    lineSpacing: options.lineSpacing ?? "1.15x",
    autoFit: options.autoFit ?? "normal"
  };

  if (options.preset) props.preset = options.preset;
  if (options.opacity !== undefined) props.opacity = String(options.opacity);
  if (options.italic !== undefined) props.italic = String(options.italic);
  if (options.rotation !== undefined) props.rotation = String(options.rotation);
  if (options.tailEnd) props.tailEnd = options.tailEnd;
  if (options.headEnd) props.headEnd = options.headEnd;
  if (options.spacing !== undefined) props.spacing = String(options.spacing);
  if (options.animation) props.animation = options.animation;

  ops.push({
    command: "add",
    parent: `/slide[${slide}]`,
    type: "shape",
    props
  });
}

function addPicture(slide, name, filename, x, y, width, height, alt) {
  ops.push({
    command: "add",
    parent: `/slide[${slide}]`,
    type: "picture",
    props: {
      name,
      src: path.join(previewDir, filename).replaceAll("\\", "/"),
      x,
      y,
      width,
      height,
      alt
    }
  });
}

function addNotes(slide, text) {
  ops.push({
    command: "add",
    parent: `/slide[${slide}]`,
    type: "notes",
    props: { text }
  });
}

function addSlideFrame(slide, dark, indexLabel) {
  addShape(slide, `AccentRail${slide}`, "", "0cm", "0cm", "0.13cm", "19.05cm", {
    fill: C.orange
  });
  addShape(
    slide,
    `Brand${slide}`,
    "桥见柳州  /  BRIDGE OBSERVATORY",
    "1.55cm",
    "18.05cm",
    "9.2cm",
    "0.45cm",
    {
      size: 10,
      color: dark ? C.mutedOnDark : C.mutedOnLight,
      spacing: 0.4,
      valign: "middle"
    }
  );
  addShape(
    slide,
    `PageNumber${slide}`,
    String(indexLabel).padStart(2, "0"),
    "31.25cm",
    "18.02cm",
    "1.15cm",
    "0.48cm",
    {
      size: 10,
      color: C.orange,
      bold: true,
      align: "right",
      valign: "middle"
    }
  );
}

function addKicker(slide, text, dark = false) {
  addShape(slide, `Kicker${slide}`, text, "1.6cm", "0.62cm", "18.5cm", "0.48cm", {
    size: 10,
    bold: true,
    color: dark ? C.teal : C.mutedOnLight,
    spacing: 0.8,
    valign: "middle"
  });
}

function addTitle(slide, text, dark = false, height = "2.05cm") {
  addShape(slide, `Title${slide}`, text, "1.6cm", "1.15cm", "30.4cm", height, {
    size: 36,
    bold: true,
    color: dark ? C.white : C.ink,
    valign: "middle",
    lineSpacing: "1.02x"
  });
}

function addSmallLabel(slide, name, text, x, y, width, dark = false, color = null) {
  addShape(slide, name, text, x, y, width, "0.48cm", {
    size: 10,
    bold: true,
    color: color || (dark ? C.teal : C.mutedOnLight),
    spacing: 0.7,
    valign: "middle"
  });
}

// ---------------------------------------------------------------------------
// 01. Cover
// ---------------------------------------------------------------------------

let slide = addSlide(C.dark);
addShape(slide, "CoverGlow", "", "19.2cm", "3.0cm", "13.6cm", "12.0cm", {
  fill: C.dark2,
  preset: "roundRect",
  opacity: 0.72
});
addPicture(
  slide,
  "CoverScreenshot",
  "01-首页.png",
  "19.8cm",
  "3.75cm",
  "12.2cm",
  "10.17cm",
  "桥见柳州项目首页，包含品牌标题、桥梁插画和项目数据"
);
addShape(
  slide,
  "CoverKicker",
  "2026  ·  第十四届全国大学生数字媒体科技作品及创意竞赛",
  "1.65cm",
  "1.55cm",
  "16.6cm",
  "0.7cm",
  {
    size: 11,
    bold: true,
    color: C.teal,
    spacing: 0.6,
    valign: "middle"
  }
);
addShape(slide, "CoverTitle", "桥见柳州", "1.55cm", "3.2cm", "16.3cm", "3.2cm", {
  size: 54,
  bold: true,
  color: C.white,
  valign: "middle"
});
addShape(slide, "CoverSubtitle", "让结构，被看见。", "1.6cm", "6.7cm", "15.8cm", "1.7cm", {
  size: 30,
  bold: true,
  color: C.gold,
  valign: "middle"
});
addShape(
  slide,
  "CoverDescription",
  "面向青少年的城市桥梁数字漫游与结构科普平台",
  "1.62cm",
  "9.1cm",
  "15.9cm",
  "1.4cm",
  {
    size: 20,
    color: "D9E6E1",
    valign: "middle"
  }
);
addShape(
  slide,
  "CoverCategory",
  "智慧教育与科普创作类赛项",
  "1.62cm",
  "14.0cm",
  "8.3cm",
  "0.78cm",
  {
    size: 13,
    bold: true,
    color: C.dark,
    fill: C.gold,
    align: "center",
    valign: "middle",
    preset: "roundRect"
  }
);
addShape(
  slide,
  "CoverTeam",
  "2026.10  ·  数字媒体科技作品及创意竞赛",
  "1.62cm",
  "15.25cm",
  "16.4cm",
  "0.72cm",
  {
    size: 13,
    color: C.mutedOnDark,
    valign: "middle"
  }
);
addNotes(
  slide,
  "开场用一句话定位：桥见柳州不是桥梁百科，而是让用户通过点击、旋转和荷载实验理解桥梁如何传力。作品面向智慧教育与科普创作，服务中学生、教师和城市访客。"
);

// ---------------------------------------------------------------------------
// 02. Problem
// ---------------------------------------------------------------------------

slide = addSlide(C.paper);
addKicker(slide, "01 / 问题洞察");
addTitle(slide, "桥梁就在身边，\n结构却藏在日常背后", false, "3.1cm");
addShape(slide, "ProblemPanel", "", "1.6cm", "5.2cm", "16.2cm", "10.7cm", {
  fill: C.dark,
  preset: "roundRect"
});
[
  ["01", "看得见地标", "能记住桥名、外观和位置，却很少追问桥面之下发生了什么。"],
  ["02", "说不清结构", "不知道车辆荷载经过哪些构件，也不清楚不同桥型为何采用不同结构。"],
  ["03", "缺少可验证体验", "阅读完介绍后，仍然无法用一次操作来验证自己的理解。"]
].forEach(([index, heading, body], i) => {
  const y = 6.0 + i * 3.15;
  addShape(slide, `ProblemIndex${i + 1}`, index, "2.15cm", `${y}cm`, "1.05cm", "0.7cm", {
    size: 13,
    bold: true,
    color: C.orange,
    valign: "middle"
  });
  addShape(slide, `ProblemHeading${i + 1}`, heading, "3.35cm", `${y}cm`, "13.3cm", "0.7cm", {
    size: 20,
    bold: true,
    color: C.white,
    valign: "middle"
  });
  addShape(slide, `ProblemBody${i + 1}`, body, "3.35cm", `${y + 0.82}cm`, "13.1cm", "1.5cm", {
    size: 18,
    color: "C8D9D5",
    valign: "top"
  });
});
addPicture(
  slide,
  "ProblemModelOverview",
  "08-五种桥型教学模型.png",
  "19.0cm",
  "5.25cm",
  "13.2cm",
  "5.62cm",
  "五种桥梁结构教学模型总览"
);
addShape(
  slide,
  "ProblemTakeaway",
  "把“认识一座桥”，\n变成“解释一座桥”。",
  "19.0cm",
  "11.9cm",
  "13.2cm",
  "3.5cm",
  {
    size: 22,
    bold: true,
    color: C.ink,
    fill: C.white,
    line: `${C.lineOnLight}:1pt`,
    preset: "roundRect",
    valign: "middle",
    margin: "0.45cm"
  }
);
addSlideFrame(slide, false, 2);
addNotes(
  slide,
  "评委最容易看到的痛点是：桥梁是熟悉的城市地标，但多数科普停在名称和外观。我们把问题收束为三个层次：看得见、说不清、无法验证，由此引出可操作的传力学习。"
);

// ---------------------------------------------------------------------------
// 03. Positioning
// ---------------------------------------------------------------------------

slide = addSlide(C.paper);
addKicker(slide, "02 / 项目定位");
addTitle(slide, "一套面向课堂与城市漫游的结构科普工具");
const audienceCards = [
  {
    title: "中学生",
    body: "用预测、操作和反馈连接物理知识，让“力与结构”不再停留在公式里。",
    color: C.tealSoft,
    ink: C.ink
  },
  {
    title: "教师",
    body: "用现成的城市桥梁案例组织课堂演示、研学和课后挑战。",
    color: "F0E2CF",
    ink: C.ink
  },
  {
    title: "城市访客",
    body: "沿柳江认识桥梁年代、桥型与城市文化，形成一条可漫游的观察路线。",
    color: "E5E8D5",
    ink: C.ink
  }
];
audienceCards.forEach((card, i) => {
  const x = 1.6 + i * 10.35;
  addShape(slide, `AudienceCard${i + 1}`, "", `${x}cm`, "4.35cm", "9.55cm", "6.35cm", {
    fill: card.color,
    preset: "roundRect"
  });
  addShape(slide, `AudienceNumber${i + 1}`, `0${i + 1}`, `${x + 0.5}cm`, "4.85cm", "1.2cm", "0.55cm", {
    size: 12,
    bold: true,
    color: C.orange,
    valign: "middle"
  });
  addShape(slide, `AudienceTitle${i + 1}`, card.title, `${x + 0.5}cm`, "5.65cm", "8.5cm", "0.8cm", {
    size: 22,
    bold: true,
    color: card.ink,
    valign: "middle"
  });
  addShape(slide, `AudienceBody${i + 1}`, card.body, `${x + 0.5}cm`, "6.65cm", "8.45cm", "3.1cm", {
    size: 18,
    color: C.inkSoft,
    valign: "top"
  });
});
addShape(slide, "PositionBand", "", "1.6cm", "12.3cm", "30.5cm", "4.25cm", {
  fill: C.dark,
  preset: "roundRect"
});
[
  ["5", "座代表性桥梁"],
  ["5", "类结构教学模型"],
  ["6", "道即时反馈题目"]
].forEach(([value, label], i) => {
  const x = 3.2 + i * 10.0;
  addShape(slide, `PositionValue${i + 1}`, value, `${x}cm`, "12.85cm", "2.1cm", "1.3cm", {
    size: 44,
    bold: true,
    color: C.gold,
    align: "center",
    valign: "middle"
  });
  addShape(slide, `PositionLabel${i + 1}`, label, `${x + 2.0}cm`, "13.15cm", "5.7cm", "0.6cm", {
    size: 15,
    color: "D2E1DD",
    valign: "middle"
  });
});
addSlideFrame(slide, false, 3);
addNotes(
  slide,
  "项目并不是只面向竞赛展示。中学生可以自主学习，教师可以把它嵌入课堂或研学任务，城市访客可以沿柳江认识桥梁。底部三个数字概括当前可交付的内容规模。"
);

// ---------------------------------------------------------------------------
// 04. Interactive map
// ---------------------------------------------------------------------------

slide = addSlide(C.white);
addKicker(slide, "03 / 产品体验");
addTitle(slide, "沿柳江，建立一条桥梁探索路线");
addShape(slide, "MapImageFrame", "", "1.45cm", "3.55cm", "17.3cm", "14.35cm", {
  fill: C.paper,
  preset: "roundRect"
});
addPicture(
  slide,
  "MapScreenshot",
  "02-桥梁互动地图.png",
  "1.7cm",
  "3.8cm",
  "16.8cm",
  "14.0cm",
  "沿江识桥互动地图和柳江大桥桥梁档案"
);
addShape(slide, "MapSideHeading", "五座桥，五个观察入口", "20.4cm", "4.2cm", "12.0cm", "0.8cm", {
  size: 22,
  bold: true,
  color: C.ink,
  valign: "middle"
});
const bridgeRows = [
  ["1968", "柳江大桥", "梁桥"],
  ["1994", "文惠桥", "拱桥"],
  ["2005", "文昌大桥", "连续梁桥"],
  ["2018", "白沙大桥", "斜拉桥"],
  ["2021", "凤凰岭大桥", "风雨桥"]
];
bridgeRows.forEach(([year, name, type], i) => {
  const y = 5.65 + i * 1.68;
  addShape(slide, `MapBridgeYear${i + 1}`, year, "20.45cm", `${y}cm`, "2.2cm", "0.5cm", {
    size: 12,
    bold: true,
    color: C.orange,
    valign: "middle"
  });
  addShape(slide, `MapBridgeName${i + 1}`, name, "23.1cm", `${y}cm`, "5.4cm", "0.55cm", {
    size: 18,
    bold: true,
    color: C.ink,
    valign: "middle"
  });
  addShape(slide, `MapBridgeType${i + 1}`, type, "28.8cm", `${y}cm`, "3.3cm", "0.55cm", {
    size: 13,
    color: C.mutedOnLight,
    valign: "middle",
    align: "right"
  });
});
addShape(slide, "MapHint", "", "20.4cm", "14.45cm", "12.1cm", "2.55cm", {
  fill: C.tealSoft,
  preset: "roundRect"
});
addShape(
  slide,
  "MapHintText",
  "点击桥梁，年代、结构档案与实验模型同步切换；探索进度保存在本地浏览器中。",
  "20.9cm",
  "14.85cm",
  "11.1cm",
  "1.75cm",
  {
    size: 18,
    color: C.ink,
    valign: "middle"
  }
);
addSlideFrame(slide, false, 4);
addNotes(
  slide,
  "这一页展示真实产品界面。左侧是沿江桥梁地图，右侧切换桥梁档案。用户从最早的城市跨江公路桥出发，沿时间与结构两条线索浏览五座桥。"
);

// ---------------------------------------------------------------------------
// 05. Force path
// ---------------------------------------------------------------------------

slide = addSlide(C.dark);
addKicker(slide, "04 / 核心方法", true);
addTitle(slide, "点击一处构件，追踪力的去向", true);
addShape(
  slide,
  "ForceLead",
  "不同桥型，用不同构件承担同一条传力任务。",
  "1.65cm",
  "3.7cm",
  "30.6cm",
  "0.8cm",
  {
    size: 20,
    color: "D8E5E1",
    valign: "middle"
  }
);
const forceSteps = [
  ["01", "桥面承接", "车辆与行人荷载先作用在桥面"],
  ["02", "构件分担", "主梁受弯、拱肋受压、拉索受拉"],
  ["03", "桥墩传递", "上部结构把荷载交给支承体系"],
  ["04", "基础分散", "力量最终进入河床与地基"]
];
forceSteps.forEach(([num, heading, body], i) => {
  const x = 1.65 + i * 8.1;
  addShape(slide, `ForceStep${i + 1}`, "", `${x}cm`, "6.15cm", "6.7cm", "4.35cm", {
    fill: i === 0 ? "173E4A" : "12343F",
    line: `${C.lineOnDark}:1pt`,
    preset: "roundRect"
  });
  addShape(slide, `ForceNum${i + 1}`, num, `${x + 0.45}cm`, "6.55cm", "1.1cm", "0.55cm", {
    size: 12,
    bold: true,
    color: C.orange,
    valign: "middle"
  });
  addShape(slide, `ForceHeading${i + 1}`, heading, `${x + 0.45}cm`, "7.4cm", "5.7cm", "0.75cm", {
    size: 20,
    bold: true,
    color: C.white,
    valign: "middle"
  });
  addShape(slide, `ForceBody${i + 1}`, body, `${x + 0.45}cm`, "8.35cm", "5.75cm", "1.55cm", {
    size: 18,
    color: "B7CFCA",
    valign: "top"
  });
  if (i < 3) {
    addShape(slide, `ForceArrow${i + 1}`, "", `${x + 6.75}cm`, "7.65cm", "1.15cm", "0.72cm", {
      preset: "rightArrow",
      fill: C.orange,
      line: "none"
    });
  }
});
addShape(slide, "ForceComparisonTitle", "同一问题，不同结构给出不同答案", "1.65cm", "11.65cm", "15.6cm", "0.65cm", {
  size: 18,
  bold: true,
  color: C.white,
  valign: "middle"
});
[
  ["梁桥", "主梁承担弯曲", C.gold],
  ["拱桥", "拱肋主要受压", C.teal],
  ["斜拉桥", "斜拉索主要受拉", C.orange]
].forEach(([name, text, color], i) => {
  const x = 1.65 + i * 10.15;
  addShape(slide, `ForceType${i + 1}`, "", `${x}cm`, "13.1cm", "9.3cm", "2.4cm", {
    fill: "12343F",
    line: `${color}:1pt`,
    preset: "roundRect",
    opacity: 0.72
  });
  addShape(slide, `ForceTypeName${i + 1}`, name, `${x + 0.55}cm`, "13.45cm", "2.7cm", "0.55cm", {
    size: 18,
    bold: true,
    color,
    valign: "middle"
  });
  addShape(slide, `ForceTypeText${i + 1}`, text, `${x + 3.15}cm`, "13.45cm", "5.6cm", "0.55cm", {
    size: 18,
    color: "D8E5E1",
    valign: "middle"
  });
});
addShape(
  slide,
  "ForceDisclaimer",
  "结构动画为教学简化模型，用于解释传力概念，不用于工程计算。",
  "1.65cm",
  "16.25cm",
  "30.4cm",
  "0.55cm",
  {
    size: 12,
    color: C.mutedOnDark,
    valign: "middle"
  }
);
addSlideFrame(slide, true, 5);
addNotes(
  slide,
  "这一页是全项目的教学主线：无论哪种桥型，都从桥面荷载出发，经过承重构件、桥墩，最终传到基础。页面将梁桥、拱桥和斜拉桥的核心受力方式并列，帮助用户形成比较。"
);

// ---------------------------------------------------------------------------
// 06. Five bridge models
// ---------------------------------------------------------------------------

slide = addSlide(C.paper);
addKicker(slide, "05 / 桥型谱系");
addTitle(slide, "五种桥型，共用一套观察方法");
addPicture(
  slide,
  "FiveModels",
  "08-五种桥型教学模型.png",
  "1.55cm",
  "4.05cm",
  "30.55cm",
  "13.0cm",
  "柳江大桥、文惠桥、文昌大桥、白沙大桥和凤凰岭大桥的五种教学模型"
);
addShape(
  slide,
  "FiveModelsCaption",
  "从梁桥、拱桥、连续梁、斜拉桥到风雨桥造型，建立可横向比较的结构认识。",
  "1.65cm",
  "17.35cm",
  "30.4cm",
  "0.55cm",
  {
    size: 14,
    color: C.mutedOnLight,
    valign: "middle"
  }
);
addSlideFrame(slide, false, 6);
addNotes(
  slide,
  "五座桥不是五个孤立页面，而是五种结构样本。用户可以观察同一构件在不同桥型里的不同职责，例如桥梁都承接荷载，但主要承重方式可能是受弯、受压或受拉。"
);

// ---------------------------------------------------------------------------
// 07. Load experiment
// ---------------------------------------------------------------------------

slide = addSlide(C.dark);
addKicker(slide, "06 / 实验交互", true);
addTitle(slide, "改变荷载，让桥面响应被看见", true);
addPicture(
  slide,
  "LabInteractionScreenshot",
  "11-跟随力流.png",
  "1.75cm",
  "3.9cm",
  "16.5cm",
  "13.75cm",
  "文惠桥结构实验室，跟随力流模式下的构件说明和受力演示"
);
addShape(slide, "LoadBigNumber", "35%  →  82%", "20.25cm", "4.35cm", "11.6cm", "1.35cm", {
  size: 34,
  bold: true,
  color: C.gold,
  valign: "middle",
  align: "center"
});
addShape(slide, "LoadCaption", "相对教学荷载", "20.25cm", "5.75cm", "11.6cm", "0.55cm", {
  size: 12,
  color: C.mutedOnDark,
  align: "center",
  valign: "middle"
});
addShape(
  slide,
  "LoadDescription",
  "只改变一个变量，观察桥面挠度、传力状态和响应等级。",
  "20.25cm",
  "7.0cm",
  "11.6cm",
  "2.2cm",
  {
    size: 18,
    color: "D8E5E1",
    valign: "top",
    align: "center"
  }
);
[
  ["拖动", "旋转观察桥梁视角"],
  ["点击", "查看构件受力职责"],
  ["切换", "比较结构、受力与夜景"]
].forEach(([label, text], i) => {
  const y = 9.65 + i * 1.55;
  addShape(slide, `LoadAction${i + 1}`, "", "20.3cm", `${y}cm`, "11.5cm", "1.2cm", {
    fill: "12343F",
    line: `${C.lineOnDark}:0.8pt`,
    preset: "roundRect"
  });
  addShape(slide, `LoadActionLabel${i + 1}`, label, "20.7cm", `${y + 0.12}cm`, "1.65cm", "0.48cm", {
    size: 13,
    bold: true,
    color: C.orange,
    valign: "middle"
  });
  addShape(slide, `LoadActionText${i + 1}`, text, "22.45cm", `${y + 0.12}cm`, "8.85cm", "0.48cm", {
    size: 18,
    color: C.white,
    valign: "middle"
  });
});
addShape(
  slide,
  "LoadScaleNote",
  "100%为演示尺度，不代表真实载重。",
  "20.3cm",
  "14.95cm",
  "11.5cm",
  "0.55cm",
  {
    size: 12,
    color: C.mutedOnDark,
    align: "center",
    valign: "middle"
  }
);
addSlideFrame(slide, true, 7);
addNotes(
  slide,
  "实验页不把动画包装成真实工程计算。用户只改变相对教学荷载，系统用挠度、传力状态和响应等级给出直观反馈。这样的范围更适合课堂解释，也避免误导。"
);

// ---------------------------------------------------------------------------
// 08. Learning loop
// ---------------------------------------------------------------------------

slide = addSlide(C.paper);
addKicker(slide, "07 / 学习闭环");
addTitle(slide, "从观察到测评，形成完整学习循环");
const learningSteps = [
  ["01", "观察", "选择桥梁与结构构件"],
  ["02", "实验", "调整荷载，比较响应"],
  ["03", "解释", "理解传力路径与桥型差异"],
  ["04", "测评", "通过即时反馈检查理解"]
];
learningSteps.forEach(([num, title, body], i) => {
  const y = 4.45 + i * 3.0;
  addShape(slide, `LearningCard${i + 1}`, "", "1.6cm", `${y}cm`, "13.7cm", "2.15cm", {
    fill: i === 0 ? C.dark : C.white,
    line: `${C.lineOnLight}:1pt`,
    preset: "roundRect"
  });
  addShape(slide, `LearningNum${i + 1}`, num, "2.05cm", `${y + 0.35}cm`, "1.0cm", "0.5cm", {
    size: 12,
    bold: true,
    color: C.orange,
    valign: "middle"
  });
  addShape(slide, `LearningTitle${i + 1}`, title, "3.15cm", `${y + 0.25}cm`, "2.2cm", "0.62cm", {
    size: 20,
    bold: true,
    color: i === 0 ? C.white : C.ink,
    valign: "middle"
  });
  addShape(slide, `LearningBody${i + 1}`, body, "5.35cm", `${y + 0.25}cm`, "9.1cm", "0.62cm", {
    size: 18,
    color: i === 0 ? "C8D9D5" : C.inkSoft,
    valign: "middle"
  });
});
addShape(slide, "QuizScreenshotCard", "", "16.0cm", "3.75cm", "15.6cm", "13.5cm", {
  fill: C.white,
  line: `${C.lineOnLight}:1pt`,
  preset: "roundRect"
});
addPicture(
  slide,
  "QuizScreenshot",
  "05-知识挑战.png",
  "16.35cm",
  "4.05cm",
  "14.9cm",
  "12.42cm",
  "桥梁观察挑战页面和即时答题反馈"
);
addShape(
  slide,
  "QuizResultTag",
  "6道题生成“结构观察员”结果页",
  "17.1cm",
  "16.05cm",
  "10.1cm",
  "0.62cm",
  {
    size: 12,
    bold: true,
    color: C.white,
    fill: C.orange,
    align: "center",
    valign: "middle",
    preset: "roundRect"
  }
);
addSlideFrame(slide, false, 8);
addNotes(
  slide,
  "学习闭环由四个步骤组成：先观察桥梁与构件，再改变荷载做实验，随后通过构件说明形成解释，最后用即时反馈的题目检查理解。题目和结果页让浏览行为具有可检查的学习结果。"
);

// ---------------------------------------------------------------------------
// 09. Technical implementation
// ---------------------------------------------------------------------------

slide = addSlide(C.dark);
addKicker(slide, "08 / 技术实现", true);
addTitle(slide, "轻量前端架构，保证现场稳定打开", true);
addShape(
  slide,
  "TechLead",
  "原生Web与自绘SVG构成全部交互，运行时不需要网络和第三方库。",
  "1.65cm",
  "3.7cm",
  "22.1cm",
  "0.78cm",
  {
    size: 20,
    color: "D8E5E1",
    valign: "middle"
  }
);
const techCards = [
  ["01", "数据层", "桥梁档案、构件说明与题库集中在本地数据文件中。"],
  ["02", "交互层", "切换、点选、拖拽和荷载滑杆都由原生事件驱动。"],
  ["03", "表现层", "SVG结构模型与CSS 3D透视构成立体观察体验。"],
  ["04", "记录层", "localStorage保存探索进度，答题结果即时反馈。"]
];
techCards.forEach(([num, title, body], i) => {
  const col = i % 2;
  const row = Math.floor(i / 2);
  const x = 1.65 + col * 10.15;
  const y = 5.1 + row * 4.35;
  addShape(slide, `TechCard${i + 1}`, "", `${x}cm`, `${y}cm`, "9.35cm", "3.65cm", {
    fill: "12343F",
    line: `${C.lineOnDark}:1pt`,
    preset: "roundRect"
  });
  addShape(slide, `TechNum${i + 1}`, num, `${x + 0.45}cm`, `${y + 0.35}cm`, "1.0cm", "0.5cm", {
    size: 12,
    bold: true,
    color: C.orange,
    valign: "middle"
  });
  addShape(slide, `TechTitle${i + 1}`, title, `${x + 1.55}cm`, `${y + 0.3}cm`, "7.2cm", "0.6cm", {
    size: 20,
    bold: true,
    color: C.white,
    valign: "middle"
  });
  addShape(slide, `TechBody${i + 1}`, body, `${x + 0.48}cm`, `${y + 1.15}cm`, "8.25cm", "1.75cm", {
    size: 18,
    color: "BDD2CE",
    valign: "top"
  });
});
addShape(slide, "TechPhoneCard", "", "23.55cm", "4.6cm", "8.5cm", "12.4cm", {
  fill: "12343F",
  line: `${C.lineOnDark}:1pt`,
  preset: "roundRect"
});
addPicture(
  slide,
  "MobileScreenshot",
  "07-移动端首页.png",
  "25.45cm",
  "5.2cm",
  "4.65cm",
  "10.06cm",
  "桥见柳州移动端首页"
);
addShape(slide, "TechPhoneLabel", "360—1440 px 响应式验证", "23.95cm", "15.7cm", "7.7cm", "0.55cm", {
  size: 12,
  color: C.mutedOnDark,
  align: "center",
  valign: "middle"
});
addShape(
  slide,
  "TechStackLine",
  "HTML  ·  CSS  ·  JavaScript  ·  SVG  ·  localStorage",
  "1.65cm",
  "15.4cm",
  "20.1cm",
  "0.62cm",
  {
    size: 13,
    color: C.teal,
    bold: true,
    spacing: 0.4,
    valign: "middle"
  }
);
addSlideFrame(slide, true, 9);
addNotes(
  slide,
  "技术方案采用原生前端，避免评审现场因网络、依赖安装或第三方服务失效。结构模型由SVG绘制，拖动旋转通过CSS 3D透视实现。移动端宽度的实机页面也在右侧展示。"
);

// ---------------------------------------------------------------------------
// 10. Scoring alignment
// ---------------------------------------------------------------------------

slide = addSlide(C.paper);
addKicker(slide, "09 / 评分对应");
addTitle(slide, "70分核心区间，对应四项可见证据");
const scoreRows = [
  ["选题价值", 10],
  ["创新与原创", 25],
  ["技术实现", 25],
  ["完成度", 20],
  ["应用传播", 10],
  ["展示答辩", 10]
];
scoreRows.forEach(([label, score], i) => {
  const y = 4.35 + i * 1.92;
  addShape(slide, `ScoreLabel${i + 1}`, label, "1.65cm", `${y}cm`, "4.7cm", "0.55cm", {
    size: 18,
    bold: i === 1 || i === 2 || i === 3,
    color: C.ink,
    valign: "middle"
  });
  addShape(slide, `ScoreTrack${i + 1}`, "", "6.65cm", `${y + 0.03}cm`, "9.85cm", "0.48cm", {
    fill: "DDD7CA",
    preset: "roundRect"
  });
  addShape(slide, `ScoreFill${i + 1}`, "", "6.65cm", `${y + 0.03}cm`, `${(score / 25) * 9.85}cm`, "0.48cm", {
    fill: i === 1 || i === 2 || i === 3 ? C.orange : C.teal,
    preset: "roundRect"
  });
  addShape(slide, `ScoreValue${i + 1}`, String(score), "16.95cm", `${y}cm`, "1.15cm", "0.55cm", {
    size: 18,
    bold: true,
    color: i === 1 || i === 2 || i === 3 ? C.orange : C.inkSoft,
    align: "right",
    valign: "middle"
  });
});
addShape(slide, "ScoreCallout", "", "19.0cm", "4.3cm", "13.0cm", "11.9cm", {
  fill: C.dark,
  preset: "roundRect"
});
addShape(slide, "ScoreBigNumber", "70", "19.6cm", "5.1cm", "3.4cm", "1.75cm", {
  size: 54,
  bold: true,
  color: C.gold,
  valign: "middle"
});
addShape(slide, "ScoreOutOf", "/ 100", "23.0cm", "5.65cm", "3.9cm", "0.75cm", {
  size: 18,
  color: C.mutedOnDark,
  valign: "middle"
});
addShape(slide, "ScoreCalloutTitle", "创新、实现、完成度", "19.6cm", "7.35cm", "11.4cm", "0.72cm", {
  size: 18,
  bold: true,
  color: C.white,
  valign: "middle"
});
addShape(
  slide,
  "ScoreCalloutBody",
  "主要工程量投入在五种桥型差异、构件讲解、荷载反馈与完整运行链上。",
  "19.6cm",
  "8.45cm",
  "11.45cm",
  "3.2cm",
  {
    size: 18,
    color: "C8D9D5",
    valign: "top"
  }
);
addShape(
  slide,
  "ScoreRubric",
  "评分依据：2026年竞赛《评分标准及奖项设置》",
  "19.6cm",
  "14.45cm",
  "11.45cm",
  "0.55cm",
  {
    size: 12,
    color: C.teal,
    valign: "middle"
  }
);
addSlideFrame(slide, false, 10);
addNotes(
  slide,
  "按照竞赛统一评分表，创新性、技术实现和完成度合计70分。我们没有用后端或复杂框架堆砌技术，而是把工程量放在五种桥型、可操作构件、荷载反馈和完整产品流程上。"
);

// ---------------------------------------------------------------------------
// 11. Iteration roadmap
// ---------------------------------------------------------------------------

slide = addSlide(C.dark);
addKicker(slide, "10 / 迭代路线", true);
addTitle(slide, "按提交节点收敛范围，按赛后节奏继续迭代", true);
addShape(
  slide,
  "RoadmapLead",
  "当前版本已经具备完整演示链路；后续功能围绕课堂使用和真实场景继续展开。",
  "1.65cm",
  "3.75cm",
  "30.3cm",
  "0.75cm",
  {
    size: 20,
    color: "D8E5E1",
    valign: "middle"
  }
);
const roadmap = [
  ["当前", "稳定提交版本", "五桥地图、力流引导、结构拆解与桥型对比", C.orange, C.white],
  ["校赛后", "课堂任务", "增加教师任务单、学习记录和用户测试", "173E4A", C.white],
  ["赛区后", "城市桥梁谱系", "扩充实景地理、更多桥型和资料来源", "173E4A", C.white],
  ["长期", "开放教学工具", "完善教师端、课堂数据与跨校应用", "173E4A", C.white]
];
roadmap.forEach(([phase, title, body, fill, color], i) => {
  const x = 1.6 + i * 7.85;
  addShape(slide, `RoadmapCard${i + 1}`, "", `${x}cm`, "6.15cm", "6.65cm", "5.15cm", {
    fill,
    line: i === 0 ? "none" : `${C.lineOnDark}:1pt`,
    preset: "roundRect"
  });
  addShape(slide, `RoadmapPhase${i + 1}`, phase, `${x + 0.45}cm`, "6.55cm", "2.2cm", "0.5cm", {
    size: 12,
    bold: true,
    color: i === 0 ? C.dark : C.teal,
    valign: "middle"
  });
  addShape(slide, `RoadmapTitle${i + 1}`, title, `${x + 0.45}cm`, "7.25cm", "5.7cm", "0.7cm", {
    size: 20,
    bold: true,
    color,
    valign: "middle"
  });
  addShape(slide, `RoadmapBody${i + 1}`, body, `${x + 0.45}cm`, "8.2cm", "5.75cm", "2.35cm", {
    size: 18,
    color: i === 0 ? "FFF2E7" : "BBD0CC",
    valign: "top"
  });
  if (i < 3) {
    addShape(slide, `RoadmapArrow${i + 1}`, "", `${x + 6.78}cm`, "8.1cm", "0.92cm", "0.65cm", {
      preset: "rightArrow",
      fill: C.teal,
      line: "none"
    });
  }
});
addShape(
  slide,
  "RoadmapPriority",
  "当前优先级：完成官网报名、作品包、演示视频、原创与AI使用说明。",
  "1.65cm",
  "13.2cm",
  "30.4cm",
  "1.05cm",
  {
    size: 18,
    bold: true,
    color: C.white,
    fill: "12343F",
    line: `${C.lineOnDark}:1pt`,
    preset: "roundRect",
    align: "center",
    valign: "middle"
  }
);
addSlideFrame(slide, true, 11);
addNotes(
  slide,
  "当前版本已经补齐自动力流引导、结构拆解和桥型对比，能够形成完整演示链路。赛后优先补教师任务单和学习记录，再扩真实地理位置、更多桥型与用户测试。路线按使用价值推进，不额外扩张无关功能。"
);

// ---------------------------------------------------------------------------
// 12. Closing
// ---------------------------------------------------------------------------

slide = addSlide(C.dark);
addShape(slide, "ClosingGlow", "", "22.0cm", "3.2cm", "10.6cm", "12.8cm", {
  fill: C.dark2,
  preset: "roundRect",
  opacity: 0.7
});
addPicture(
  slide,
  "ClosingMobile",
  "07-移动端首页.png",
  "25.05cm",
  "5.0cm",
  "4.55cm",
  "9.85cm",
  "桥见柳州移动端项目首页"
);
addShape(slide, "ClosingKicker", "桥见柳州  ·  2026", "1.65cm", "2.45cm", "14.0cm", "0.55cm", {
  size: 12,
  bold: true,
  color: C.teal,
  spacing: 0.7,
  valign: "middle"
});
addShape(slide, "ClosingTitle", "让下一座桥，\n从理解开始。", "1.6cm", "4.05cm", "18.2cm", "5.0cm", {
  size: 44,
  bold: true,
  color: C.white,
  valign: "top",
  lineSpacing: "1.08x"
});
addShape(slide, "ClosingSubtitle", "让结构，被看见。", "1.65cm", "10.35cm", "15.7cm", "0.95cm", {
  size: 24,
  bold: true,
  color: C.gold,
  valign: "middle"
});
addShape(
  slide,
  "ClosingMeta",
  "智慧教育与科普创作类赛项\n2026 数字媒体科技作品及创意竞赛",
  "1.65cm",
  "12.15cm",
  "15.3cm",
  "1.65cm",
  {
    size: 16,
    color: "BCD0CC",
    valign: "top"
  }
);
addShape(slide, "ClosingSignature", "BRIDGE OBSERVATORY / LIUZHOU", "1.65cm", "16.35cm", "10.3cm", "0.45cm", {
  size: 10,
  color: C.mutedOnDark,
  spacing: 0.7,
  valign: "middle"
});
addSlideFrame(slide, true, 12);
addNotes(
  slide,
  "收尾回到项目主张：让城市桥梁从被观看的地标，变成可以被理解、操作和讲述的工程对象。桥见柳州希望让学生在看桥的过程中建立结构思维。"
);

// ---------------------------------------------------------------------------
// Build
// ---------------------------------------------------------------------------

function runOfficeCli(args, input = null) {
  const result = spawnSync("officecli", args, {
    input,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    process.stderr.write(result.stdout || "");
    process.stderr.write(result.stderr || "");
    throw new Error(`officecli ${args.join(" ")} failed with code ${result.status}`);
  }
  return result.stdout;
}

try {
  runOfficeCli(["close", deckPath]);
} catch {
  // The deck may not have an active resident.
}
if (fs.existsSync(deckPath)) fs.unlinkSync(deckPath);
runOfficeCli(["create", deckPath]);
let batchOutput = "";
try {
  runOfficeCli(["open", deckPath]);
  batchOutput = runOfficeCli(["batch", deckPath, "--json"], JSON.stringify(ops));
} finally {
  try {
    runOfficeCli(["close", deckPath]);
  } catch {
    // Preserve the original build error if the resident was never opened.
  }
}

console.log(batchOutput);
console.log(`Created ${deckPath} with ${slideNo} slides and ${ops.length} operations.`);
