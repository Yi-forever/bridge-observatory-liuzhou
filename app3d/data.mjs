/**
 * 3D 场景使用的桥梁数据（M0 占位副本）。
 *
 * TODO(M1): app.js 中的 `bridges` 才是权威数据（含 parts / description / observation 等）。
 * M1 阶段应把权威数据抽到 data/bridges.json，由 app.js 与 3D 场景共同加载，
 * 届时删除这份最小副本，避免两处维护。
 */

export const BRIDGES = [
  {
    id: "liujiang",
    order: "01",
    name: "柳江大桥",
    year: "1968",
    type: "梁桥",
    accent: "#f47c4d",
    model: "girder",
    map: { x: 35, y: 65 }
  },
  {
    id: "wenhui",
    order: "02",
    name: "文惠桥",
    year: "1994",
    type: "拱桥",
    accent: "#efb861",
    model: "arch",
    map: { x: 43, y: 59 }
  },
  {
    id: "wenchang",
    order: "03",
    name: "文昌大桥",
    year: "2005",
    type: "连续梁桥",
    accent: "#6fa9ab",
    model: "continuous",
    map: { x: 52, y: 52 }
  },
  {
    id: "baisha",
    order: "04",
    name: "白沙大桥",
    year: "2018",
    type: "斜拉桥",
    accent: "#eaa45b",
    model: "cable",
    map: { x: 62, y: 43 }
  },
  {
    id: "fenghuangling",
    order: "05",
    name: "凤凰岭大桥",
    year: "2021",
    type: "风雨桥",
    accent: "#8bb391",
    model: "pavilion",
    map: { x: 73, y: 34 }
  }
];

export const BRIDGE_BY_ID = new Map(BRIDGES.map((bridge) => [bridge.id, bridge]));

export const BRIDGE_IDS = BRIDGES.map((bridge) => bridge.id);

/** 总览平面上桥梁坐标的映射范围（世界单位）。 */
export const ATLAS_SPAN = { width: 46, depth: 30 };

/** 柳江河道相对正东方向的旋转角（弧度），由五座桥坐标的趋势拟合而来。 */
export const RIVER_ANGLE = 0.487;
