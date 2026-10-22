/**
 * 场景配色与光照参数。
 *
 * 约定：
 * - 这里只放**纯数据**（颜色字符串、数值），不创建 three 对象，
 *   这样 `atlas.mjs` 可以在 Node 测试里被导入，不需要 DOM 或 WebGL。
 * - day 与 night 都已生效：scene.applyTheme() 会按这里的取值换天色、雾、三盏灯，
 *   并按材质 name 重上色（concrete / deck / water / frame / lab / archive / terrain）。
 *   新增材质时记得给它一个 name，否则夜景不会跟着变色。
 */

export const THEMES = {
  day: {
    id: "day",
    label: "晴日午后",
    ready: true,
    sky: {
      zenith: "#6ea8cd",
      horizon: "#dfeef4",
      ground: "#8d9488"
    },
    fog: { color: "#dbeaf1", near: 320, far: 1300 },
    lights: {
      hemiSky: "#d6e8f2",
      hemiGround: "#6f6a58",
      hemiIntensity: 0.55,
      sunColor: "#fff3dc",
      sunIntensity: 1.65,
      sunPosition: { x: 120, y: 190, z: 90 },
      fillColor: "#9fc4d8",
      fillIntensity: 0.22,
      fillPosition: { x: -110, y: 70, z: -90 }
    },
    water: { metalness: 0.06, roughness: 0.13 },
    materials: {
      ground: "#7d8677",
      water: "#35707f",
      concrete: "#cfccc4",
      deck: "#9aa0a6",
      blockA: "#98a3ab",
      blockB: "#aab2b8",
      lab: "#8fb6bd",
      archive: "#c0a7b2",
      glow: "#ffd9a8"
    },


    /**
     * 地形配色。柳州是喀斯特孤峰平原：盆底平坦成城，孤峰拔地而起。
     * 按"高度 + 坡度"两个维度上色——只按高度会让缓坡也变成灰岩，
     * 只按坡度会让平坦的峰顶变成草绿，两者叠加才像喀斯特。
     */
    terrain: {
      basin: "#8c917f",
      slope: "#6d8760",
      rock: "#9a9384",
      ridge: "#55704f",
      /**
       * 竖向夸张。真实比例下鱼峰山相对盆底只有 1.6 单位，
       * 在 5.4×9.6 km 的取景里只是个小土包；×3 后 4.8 单位，
       * 与桥（0.3–0.7 单位）形成 10:1 的沙盘主从关系。
       * 结构件的 2.2 倍夸张不受影响——两层各自内部一致即可。
       */
      exaggeration: 3
    }
  },

  night: {
    id: "night",
    label: "柳江夜色",
    ready: true,
    sky: {
      zenith: "#0b1a2b",
      horizon: "#1d3b52",
      ground: "#0a1418"
    },
    fog: { color: "#13293d", near: 220, far: 1100 },
    lights: {
      hemiSky: "#2b4a63",
      hemiGround: "#0a1418",
      hemiIntensity: 0.5,
      sunColor: "#9fc0e0",
      sunIntensity: 0.35,
      sunPosition: { x: -90, y: 160, z: 40 },
      fillColor: "#3f6f86",
      fillIntensity: 0.3,
      fillPosition: { x: 110, y: 60, z: -80 }
    },
    water: { metalness: 0.35, roughness: 0.12 },
    materials: {
      ground: "#121a1d",
      water: "#0f2b36",
      concrete: "#3a4a50",
      deck: "#455a63",
      blockA: "#1b2b34",
      blockB: "#233640",
      lab: "#2f5d64",
      archive: "#4a4258",
      glow: "#ffcf9a"
    },
    terrain: {
      basin: "#1a2320",
      slope: "#26301f",
      rock: "#2b2b28",
      ridge: "#1b2419",
      exaggeration: 3
    },


  }
};

/** 默认主题：进场景是白天，夜景由状态里的 mode=night 触发。 */
export const DEFAULT_THEME = "day";

export function getTheme(id = DEFAULT_THEME) {
  return THEMES[id] || THEMES[DEFAULT_THEME];
}
