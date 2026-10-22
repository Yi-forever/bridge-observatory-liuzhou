/**
 * 场景几何自检（可在 Node 中直接运行，不需要浏览器）。
 *
 *   node tests/atlas.test.mjs
 *
 * 覆盖：真实地理数据完整性、桥梁落位与朝向、建筑在陆地、包围盒合理、状态切换稳定。
 */

import * as THREE from "../vendor/three/three.module.min.js";
import { buildAtlas } from "../app3d/atlas.mjs";
import { GEO } from "../app3d/geo.mjs";
import { TERRAIN } from "../app3d/terrain.mjs";
import { BRIDGES } from "../app3d/data.mjs";

let failures = 0;

function check(label, actual, expected) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    failures += 1;
    console.log("FAIL", label, "got", JSON.stringify(actual), "want", JSON.stringify(expected));
  }
}

function checkTrue(label, condition, detail) {
  if (!condition) {
    failures += 1;
    console.log("FAIL", label, detail === undefined ? "" : detail);
  }
}

function distanceToPolyline(px, pz, line) {
  let best = Infinity;
  for (let i = 1; i < line.length; i += 1) {
    const [ax, az] = line[i - 1];
    const [bx, bz] = line[i];
    const dx = bx - ax;
    const dz = bz - az;
    const lengthSq = dx * dx + dz * dz;
    let t = lengthSq === 0 ? 0 : ((px - ax) * dx + (pz - az) * dz) / lengthSq;
    t = Math.max(0, Math.min(1, t));
    best = Math.min(best, Math.hypot(px - (ax + t * dx), pz - (az + t * dz)));
  }
  return best;
}

function distanceToRivers(px, pz) {
  return Math.min(...GEO.rivers.map((line) => distanceToPolyline(px, pz, line)));
}

/* ---------------- 数据层 ---------------- */

checkTrue("geo has source", GEO.source === "OpenStreetMap contributors");
checkTrue("geo license", GEO.license === "ODbL-1.0");
checkTrue("geo scale", GEO.metersPerUnit === 100);
checkTrue("geo rivers present", GEO.rivers.length >= 1);
checkTrue(
  "geo river points",
  GEO.rivers.every((line) => line.length >= 4),
  `points=${GEO.rivers.map((line) => line.length).join(",")}`
);
check("geo bridge count", GEO.bridges.length, 5);
checkTrue("geo window sane", GEO.window.maxX > GEO.window.minX && GEO.window.maxZ > GEO.window.minZ);

// 河道必须是一条连续的折线：多段说明有汇流/河中岛把主河道切断，
// 画面上就会出现悬空的一截短河。
check("geo river is one continuous polyline", GEO.rivers.length, 1);

if (GEO.rivers.length === 1) {
  const line = GEO.rivers[0];
  checkTrue("geo river has enough points", line.length >= 32, `points=${line.length}`);
  const xs = line.map(([x]) => x);
  const zs = line.map(([, z]) => z);
  checkTrue(
    "geo river spans the window",
    Math.min(...xs) < GEO.window.minX && Math.max(...xs) > GEO.window.maxX,
    `x ${Math.min(...xs)}..${Math.max(...xs)}`
  );

  // 端点不能落在相机默认可见范围（窗口外约 80 单位）内，否则会露出断口
  const reach = 80;
  for (const [label, point] of [
    ["head", line[0]],
    ["tail", line[line.length - 1]]
  ]) {
    const inside =
      point[0] > GEO.window.minX - reach &&
      point[0] < GEO.window.maxX + reach &&
      point[1] > GEO.window.minZ - reach &&
      point[1] < GEO.window.maxZ + reach;
    checkTrue(`geo river ${label} outside view`, !inside, `at (${point[0]}, ${point[1]})`);
  }
}

for (const bridge of GEO.bridges) {
  checkTrue(`geo ${bridge.id} finite`, ["x", "z", "angle", "length", "width"].every((key) => Number.isFinite(bridge[key])));
  checkTrue(`geo ${bridge.id} has osm id`, typeof bridge.osmId === "string" && bridge.osmId.startsWith("way/"));
  checkTrue(`geo ${bridge.id} length plausible`, bridge.length > 1.5 && bridge.length < 20, `length=${bridge.length}`);
  checkTrue(`geo ${bridge.id} width plausible`, bridge.width > 0.1 && bridge.width < 2, `width=${bridge.width}`);
  // 桥应当架在河上：到河道中心线的距离不得超过河宽
  const distance = distanceToRivers(bridge.x, bridge.z);
  checkTrue(`geo ${bridge.id} on river`, distance <= GEO.riverHalfWidth * 1.2, `distance=${distance.toFixed(2)}`);
}

/* ---------------- 场景层 ---------------- */

const atlas = buildAtlas();

check("bridge count", atlas.bridges.size, 5);
check("building count", atlas.buildings.size, 2);
check("pickables", atlas.pickables.length, 7);
check("label count", atlas.labels.length, 7);

for (const bridge of GEO.bridges) {
  const entry = atlas.bridges.get(bridge.id);
  checkTrue(`scene ${bridge.id} exists`, Boolean(entry));
  if (!entry) continue;

  const position = entry.group.position;
  checkTrue(
    `scene ${bridge.id} at geo position`,
    Math.hypot(position.x - bridge.x, position.z - bridge.z) < 1e-6,
    `group=(${position.x.toFixed(2)},${position.z.toFixed(2)}) geo=(${bridge.x},${bridge.z})`
  );
  checkTrue(
    `scene ${bridge.id} rotation matches axis`,
    Math.abs(entry.group.rotation.y - bridge.angle) < 1e-6
  );
  checkTrue(`scene ${bridge.id} has structure`, entry.group.children.length >= 2);
  checkTrue(`scene ${bridge.id} height`, entry.top > 0.2, `top=${entry.top}`);
}

for (const [id, entry] of atlas.buildings) {
  const { x, z } = entry.group.position;
  checkTrue(`building ${id} finite`, Number.isFinite(x) && Number.isFinite(z));
  const distance = distanceToRivers(x, z);
  checkTrue(`building ${id} on land`, distance > GEO.riverHalfWidth, `distance=${distance.toFixed(2)}`);
  for (const bridge of GEO.bridges) {
    checkTrue(
      `building ${id} clear of ${bridge.id}`,
      Math.hypot(bridge.x - x, bridge.z - z) > 2.5,
      `distance=${Math.hypot(bridge.x - x, bridge.z - z).toFixed(2)}`
    );
  }
}

/* ---------------- 文惠桥：中承式钢管混凝土拱桥 ---------------- */

/**
 * 文惠桥是五孔连拱、双肋、中承式：拱肋从桥墩顶起拱、穿过桥面再升到桥面上方。
 * 三条断言分别守住"两条肋""拱高过桥面""边跨拱压在桥面下"——
 * 这几条一旦退回"中间一根管 + 一道拱"，说明又被打回简模了。
 */
{
  const entry = atlas.bridges.get("wenhui");
  const model = entry.group.children.find((child) => child.isGroup);

  const byMaterial = new Map();
  model.traverse((object) => {
    if (!object.isMesh) return;
    const position = object.geometry.attributes.position;
    if (!byMaterial.has(object.material)) byMaterial.set(object.material, []);
    const bucket = byMaterial.get(object.material);
    for (let i = 0; i < position.count; i += 1) {
      bucket.push([position.getX(i), position.getY(i), position.getZ(i)]);
    }
  });

  // 钢构件（拱肋 + 吊杆 + 横撑）是中国红；用"红得有多纯"来挑，
  // 不能用 r>g&&r>b——混凝土的 0xcfccc4 也满足，会挑错材质。
  let steel = [];
  let steelColour = null;
  let reddest = -1;
  for (const [material, points] of byMaterial) {
    if (!material.color) continue;
    const redness = material.color.r - Math.max(material.color.g, material.color.b);
    if (redness > reddest) {
      reddest = redness;
      steel = points;
      steelColour = material.color;
    }
  }

  let maxY = -Infinity;
  let nearCentre = 0;
  let leftRib = 0;
  let rightRib = 0;
  for (const [, y, z] of steel) {
    if (y > maxY) maxY = y;
    if (Math.abs(z) < 0.04) nearCentre += 1;
    if (z > 0.1) rightRib += 1;
    if (z < -0.1) leftRib += 1;
  }

  checkTrue("wenhui arch steel is painted red", steelColour !== null && reddest > 0.3 && steel.length > 2000, `verts=${steel.length} redness=${reddest.toFixed(2)}`);
  checkTrue("wenhui has two ribs on both deck edges", leftRib > 500 && rightRib > 500, `left=${leftRib} right=${rightRib}`);
  checkTrue("wenhui ribs are not a single centreline", nearCentre * 2 < steel.length, `centre=${nearCentre}/${steel.length}`);
  checkTrue("wenhui main arch rises above the deck", maxY > 0.55 && maxY < 1.2, `archTop=${maxY.toFixed(2)}`);
}

/* ---------------- 凤凰岭大桥：五亭两廊 ---------------- */

/**
 * 真实结构：96+124+3×130+90 = 700 m 等高连续组合梁，桥面全宽 46.6 m；
 * 横断面 = 机动车道 | **中间 9 m 预留轨道空间（兼观景台）** | 机动车道；
 * 五座桥亭就立在中间这条观景带上（歇山亭在两端、六角亭次之、八角亭居中最高），
 * 两侧各一条长廊压在人行道上——**亭柱不在桥的两边，在观景带的两边**。
 *
 * 断言全部从 userData 取数：桥面标高、分隔带宽、长廊位置、亭子位置与高度都由建模函数
 * 自己登记，测试不再写死坐标——以后调比例不会让断言变成假报警。
 */
{
  const inner = atlas.bridges.get("fenghuangling").group.children.find((child) => child.isGroup);
  const data = inner.userData;
  const { deckTop, medianHalf, corridor, pavilions, spans } = data;

  checkTrue("fenghuangling exposes deckTop", typeof deckTop === "number", `deckTop=${deckTop}`);
  checkTrue("fenghuangling keeps the 9 m median", medianHalf === 0.045, `medianHalf=${medianHalf}`);
  checkTrue("fenghuangling exposes the corridor", Boolean(corridor), JSON.stringify(corridor));
  checkTrue(
    "fenghuangling has five pavilions",
    Array.isArray(pavilions) && pavilions.length === 5,
    `count=${pavilions && pavilions.length}`
  );

  // 长廊贯通：两侧各一条，位于分隔带外侧
  let corridorVerts = 0;
  inner.traverse((object) => {
    if (!object.isMesh) return;
    const position = object.geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const y = position.getY(i);
      if (y <= deckTop) continue;
      const az = Math.abs(position.getZ(i));
      if (az < corridor.z - corridor.half * 1.5 || az > corridor.z + corridor.half * 1.5) continue;
      corridorVerts += 1;
    }
  });
  checkTrue("fenghuangling has a covered corridor on both sides", corridorVerts > 500, `verts=${corridorVerts}`);

  // 三档亭高必须对得上实测值（八角 49.45 m / 六角 43.9 m / 歇山 34.2 m）
  const heights = new Map();
  for (const pavilion of pavilions) heights.set(pavilion.kind, pavilion.heightAboveDeck);
  const expected = { oct: 49.45, hex: 43.9, hip: 34.2 };
  for (const [kind, meters] of Object.entries(expected)) {
    const actual = heights.get(kind);
    checkTrue(
      `fenghuangling ${kind} pavilion height matches the real ${meters} m`,
      typeof actual === "number" && Math.abs(actual * 100 - meters) < 4,
      `actual=${typeof actual === "number" ? (actual * 100).toFixed(1) : "?"} m`
    );
  }

  // 八角亭居中、且比两端的歇山亭高
  const centre = pavilions.find((p) => p.kind === "oct");
  const ends = pavilions.filter((p) => p.kind === "hip");
  checkTrue(
    "fenghuangling centre octagonal tower is the tallest",
    Boolean(centre) && ends.length === 2 && ends.every((p) => centre.top > p.top + 0.1),
    centre ? `centre=${centre.top.toFixed(2)} ends=${ends.map((p) => p.top.toFixed(2)).join("/")}` : "no centre"
  );

  // 跨径布置：真实 96 + 124 + 3×130 + 90 = 700 m，模型按桥长等比缩放
  if (spans && spans.pattern) {
    const joints = [spans.startX, ...spans.piers, spans.endX];
    const totalModel = spans.endX - spans.startX;
    const measured = [];
    for (let i = 1; i < joints.length; i += 1) {
      measured.push(((joints[i] - joints[i - 1]) / totalModel) * 700);
    }
    const worst = Math.max(...spans.pattern.map((real, index) => Math.abs(measured[index] - real)));
    checkTrue(
      "fenghuangling span pattern is 96+124+3x130+90",
      measured.length === spans.pattern.length && worst < 2,
      `measured=${measured.map((value) => value.toFixed(0)).join("+")} worst=${worst.toFixed(1)}`
    );
  }
}

/**
 * 屋面颜色必须来自 accent 材质，而不是在 Color 构造里被吞掉后回落成纯白。
 * 材质全白的屋面在远景里就是一片灰，等于把铜瓦做没了。
 */
{
  const entry = atlas.bridges.get("fenghuangling");
  let roofColor = null;
  entry.group.traverse((object) => {
    if (!object.isMesh || !object.material.color) return;
    if (object.material.metalness !== 0.16) return; // 只有屋面用了 0.16
    roofColor = object.material.color;
  });

  checkTrue("fenghuangling roof material exists", roofColor !== null);
  if (roofColor) {
    const max = Math.max(roofColor.r, roofColor.g, roofColor.b);
    const min = Math.min(roofColor.r, roofColor.g, roofColor.b);
    checkTrue("fenghuangling roof is not washed-out white", max < 0.55, `max=${max.toFixed(2)}`);
    checkTrue("fenghuangling roof keeps a hue", max - min > 0.03, `chroma=${(max - min).toFixed(3)}`);
  }
}

/* ---------------- 凤凰岭：桥亭横跨整座桥面 ---------------- */

/**
 * 按用户要求，五座桥亭改成横跨桥面、支柱落在桥面两侧的"门式"亭
 * （真实桥是立在中间 9 m 观景带上的，这里是刻意的艺术处理）。
 * 要守住两件事：
 *   1. 柱子确实落在桥面两侧——否则又变回"桥中间一根杆子"；
 *   2. 桥面正中的行车道没有被亭子挡住——门式亭的意义就是把柱子让到边上。
 */
{
  const inner = atlas.bridges.get("fenghuangling").group.children.find((child) => child.isGroup);
  const { deckTop, pavilions, corridor } = inner.userData;

  // 桥面半宽：直接从桥面板量
  let deckHalf = 0;
  inner.traverse((object) => {
    if (!object.isMesh) return;
    if (object.material.color.getHexString() !== "9aa0a6") return;
    const position = object.geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      deckHalf = Math.max(deckHalf, Math.abs(position.getZ(i)));
    }
  });

  checkTrue("fenghuangling deck width is measurable", deckHalf > 0.2, `deckHalf=${deckHalf}`);

  let columnsAtEdge = 0;
  let columnsInMiddle = 0;
  inner.traverse((object) => {
    if (!object.isMesh) return;
    const isTimber = object.material.color.getHexString() === "7d5f45";
    if (!isTimber) return;
    const position = object.geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const y = position.getY(i);
      if (y < deckTop || y > deckTop + 0.06) continue; // 只看底层柱
      const az = Math.abs(position.getZ(i));
      if (az > deckHalf - 0.028) columnsAtEdge += 1;
      if (az < 0.03) columnsInMiddle += 1;
    }
  });

  checkTrue(
    "fenghuangling pavilion columns stand at both deck edges",
    columnsAtEdge > 60,
    `verts=${columnsAtEdge}`
  );
  checkTrue(
    "fenghuangling pavilions leave the deck centreline clear",
    columnsInMiddle === 0,
    `verts=${columnsInMiddle}`
  );

  for (const pavilion of pavilions) {
    checkTrue(
      `fenghuangling ${pavilion.kind} pavilion spans the deck`,
      pavilion.halfZ > deckHalf - 0.04,
      `halfZ=${pavilion.halfZ.toFixed(3)} deckHalf=${deckHalf.toFixed(3)}`
    );
  }

  // 门式亭还要真的罩住桥面：屋面必须在两侧都超过桥面半宽
  let roofBeyondEdge = 0;
  inner.traverse((object) => {
    if (!object.isMesh) return;
    if (object.material.metalness !== 0.16) return; // 屋面材质
    const position = object.geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      if (Math.abs(position.getZ(i)) > deckHalf + 0.002) roofBeyondEdge += 1;
    }
  });
  checkTrue("fenghuangling pavilion roofs overhang the deck edges", roofBeyondEdge > 20, `verts=${roofBeyondEdge}`);
  checkTrue("fenghuangling corridor is kept", Boolean(corridor), JSON.stringify(corridor));
}

/* ---------------- 凤凰岭：车道必须能通 ---------------- */

/**
 * 五座亭子立在中间 9 m 观景带上，两侧是双向六车道。所以：
 *   - 观景带自己的边缘（medianHalf）以外，桥面往上 8 m 内不许有任何构件；
 *   - 亭子外挑的檐可以出这条带，但必须高于 8 m 净空。
 * 上一版把亭子摆在桥面中线、给 58 m 的实心台基，等于把整座桥的路堵死。
 */
{
  const inner = atlas.bridges.get("fenghuangling").group.children.find((child) => child.isGroup);
  const { deckTop, medianHalf, corridor } = inner.userData;

  const roadInner = medianHalf * 1.05;                          // 观景带外沿
  const roadOuter = corridor.z - corridor.half * 1.5;            // 人行道内侧（长廊立柱以内）
  const clearance = 0.08;                                        // 桥面以上 8 m 的净空带

  let obstacles = 0;
  let lowest = Infinity;
  let roadVerts = 0;

  inner.traverse((object) => {
    if (!object.isMesh) return;
    const position = object.geometry.attributes.position;
    for (let i = 0; i < position.count; i += 1) {
      const y = position.getY(i);
      const az = Math.abs(position.getZ(i));
      if (az <= roadInner || az >= roadOuter) continue;
      if (y <= deckTop) continue;
      roadVerts += 1;
      if (y < deckTop + clearance) {
        obstacles += 1;
        if (y < lowest) lowest = y;
      }
    }
  });

  checkTrue("fenghuangling roadway has geometry above it", roadVerts > 0, `verts=${roadVerts}`);
  check("fenghuangling roadway clearance is not blocked", obstacles, 0);
  if (obstacles > 0) {
    console.log(`    最低障碍高度 ${lowest.toFixed(3)}（桥面 ${deckTop.toFixed(3)}）`);
  }
}

/* ---------------- 白沙大桥：柳州之门 ---------------- */

/**
 * 真实结构：单塔双索面钢箱梁斜拉桥，主桥 400 m 一跨而过，只有中间一座主塔；
 * 主塔由空间曲线扭曲而成（两根钢塔在空中拧成麻花），塔高 106 m，形似门；
 * 全桥 60 根斜拉索。
 *
 * 旧模型是一个 178 m 半径的圆环、还绕 y 轴转了 90°——环平面横跨桥宽，
 * 既没有门洞也没有索面。这里守住三件事：塔是闭合的环、环在桥面高度处让开桥面、
 * 斜拉索数量对得上。
 */
{
  const inner = atlas.bridges.get("baisha").group.children.find((child) => child.isGroup);
  const deckTop = inner.userData.deckTop;
  const deckHalf = 0.22;

  let towerPosition = null;
  let stayTriangles = 0;

  inner.traverse((object) => {
    if (!object.isMesh) return;
    const hex = object.material.color.getHexString();
    if (hex === "d9dee2") towerPosition = object.geometry.attributes.position;
    if (hex === "e6e8e6") {
      const count = object.geometry.index
        ? object.geometry.index.count
        : object.geometry.attributes.position.count;
      stayTriangles += count / 3;
    }
  });

  checkTrue("baisha tower exists", towerPosition !== null);
  checkTrue("baisha exposes deckTop", typeof deckTop === "number", `deckTop=${deckTop}`);

  if (towerPosition) {
    let topY = -Infinity;
    let minX = Infinity;
    let maxX = -Infinity;
    let deckLevelMinZ = Infinity;

    for (let i = 0; i < towerPosition.count; i += 1) {
      const x = towerPosition.getX(i);
      const y = towerPosition.getY(i);
      const z = Math.abs(towerPosition.getZ(i));
      if (y > topY) topY = y;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      // 桥面高度处，塔必须让开桥面，否则环是穿过桥面的
      if (y > deckTop - 0.02 && y < deckTop + 0.02 && z < deckLevelMinZ) deckLevelMinZ = z;
    }

    checkTrue(
      "baisha tower rises above the deck",
      topY > deckTop + 0.7,
      `top=${topY.toFixed(2)} deck=${deckTop.toFixed(2)}`
    );
    checkTrue(
      "baisha tower is a loop wider than tall/2",
      maxX - minX > 0.8,
      `width=${(maxX - minX).toFixed(2)}`
    );
    checkTrue(
      "baisha tower clears the deck at deck level",
      deckLevelMinZ > deckHalf,
      `minZ=${Number.isFinite(deckLevelMinZ) ? deckLevelMinZ.toFixed(3) : "none"} deckHalf=${deckHalf}`
    );
  }

  // 每根索是 radial=4 的圆柱 → 16 个三角；真实 60 根索
  const cables = Math.round(stayTriangles / 16);
  checkTrue("baisha has about 60 stay cables", cables >= 58 && cables <= 62, `cables=${cables}`);
}

/* ---------------- 端部支撑：不穿桥面、不悬空 ---------------- */

/**
 * 桥台/引桥墩最容易犯两个错，v3.5 的白沙与凤凰岭各犯了一次：
 *   1) 台顶一直顶到桥面标高——与桥面板共面，既 z-fighting，又在桥面上露出方块；
 *   2) 台底停在水面以上十几米——整块悬在空中。
 *
 * 光看"最低点/最高点"抓不住第 2 条：承台本来就在水下，会把悬空的柱脚遮掉。
 * 所以建模函数把每个端部支撑的真实上下界记进 userData.supports，
 * 测试再拿几何复核一遍——台顶不许出现在桥面结构深度的最后 0.05 内。
 */
{
  const concreteHex = "cfccc4";

  for (const id of ["baisha", "fenghuangling", "liujiang", "wenchang"]) {
    const inner = atlas.bridges.get(id).group.children.find((child) => child.isGroup);
    const deckTop = inner.userData.deckTop;
    const supports = inner.userData.supports || [];
    if (typeof deckTop !== "number") continue;

    checkTrue(`${id} records its end supports`, supports.length >= 2, `count=${supports.length}`);

    for (const support of supports) {
      checkTrue(
        `${id} support at x=${support.x.toFixed(2)} reaches the water/ground`,
        support.bottom <= 0.004,
        `bottom=${support.bottom.toFixed(3)}`
      );
      checkTrue(
        `${id} support at x=${support.x.toFixed(2)} stops below the deck`,
        support.top <= deckTop - 0.05,
        `top=${support.top.toFixed(3)} deckTop=${deckTop.toFixed(3)}`
      );
    }

    // 几何复核：端部一带的混凝土不得出现在桥面顶部以下的 0.02 窗口里（薄桥面板的梁顶在 0.026 以下，不算侵入）
    let maxAbsX = 0;
    inner.traverse((object) => {
      if (!object.isMesh) return;
      const position = object.geometry.attributes.position;
      for (let i = 0; i < position.count; i += 1) {
        maxAbsX = Math.max(maxAbsX, Math.abs(position.getX(i)));
      }
    });
    const band = maxAbsX - 0.15;
    const intruders = [];

    inner.traverse((object) => {
      if (!object.isMesh) return;
      if (object.material.color.getHexString() !== concreteHex) return;
      const position = object.geometry.attributes.position;
      for (let i = 0; i < position.count; i += 1) {
        if (Math.abs(position.getX(i)) < band) continue;
        const y = position.getY(i);
        if (y < deckTop - 0.02 || y >= deckTop - 1e-4) continue;
        intruders.push(y);
      }
    });

    checkTrue(
      `${id} has no concrete intruding into the deck depth`,
      intruders.length === 0,
      `${intruders.length} verts up to ${intruders.length ? Math.max(...intruders).toFixed(3) : "-"}`
    );
  }
}

/* ---------------- 柳江大桥 / 文昌大桥的结构特征 ---------------- */

/**
 * 柳江大桥是 3 个 T 构 + 挂梁：悬臂根深、端浅，墩顶梁高必须明显大于挂梁。
 * 文昌大桥是**变截面**连续箱梁：墩顶深、跨中浅，这是它唯一能远看认出来的特征。
 * 两条都靠几何验证——量梁底标高，不靠建模函数自报。
 */
{
  /** 在某段 x 窗口内取某材质所有顶点的最低点。 */
  const lowestOf = (inner, hex, from, to) => {
    let lowest = Infinity;
    inner.traverse((object) => {
      if (!object.isMesh) return;
      if (object.material.color.getHexString() !== hex) return;
      const position = object.geometry.attributes.position;
      for (let i = 0; i < position.count; i += 1) {
        const x = position.getX(i);
        if (x < from || x > to) continue;
        const y = position.getY(i);
        if (y < lowest) lowest = y;
      }
    });
    return lowest;
  };

  /* ---- 柳江大桥：T 构 ---------------- */
  {
    const inner = atlas.bridges.get("liujiang").group.children.find((child) => child.isGroup);
    const deckTop = inner.userData.deckTop;
    const supports = inner.userData.supports || [];
    const concreteHex = "cfccc4";
    const piers = supports.map((s) => s.x).sort((a, b) => a - b).slice(1, -1);

    checkTrue("liujiang is a T-frame bridge with 3 piers", piers.length === 3, `piers=${piers.length}`);
    checkTrue("liujiang records 2 abutments too", supports.length === 5, `supports=${supports.length}`);

    if (piers.length === 3) {
      const middle = piers[1];
      const girder = inner.userData.girder || {};
      const rootBottom = lowestOf(inner, concreteHex, middle - 0.02, middle + 0.02);
      // 挂梁是一整个盒子，跨中处没有顶点；要到悬臂端（墩位 + 悬臂长）才量得到梁底
      const tipX = middle + (girder.cantilever || 0);
      const dropBottom = lowestOf(inner, concreteHex, tipX - 0.02, tipX + 0.02);

      checkTrue(
        "liujiang records its girder depths",
        girder.rootDepth > 0 && girder.dropDepth > 0 && girder.cantilever > 0,
        JSON.stringify({ root: girder.rootDepth, drop: girder.dropDepth })
      );
      checkTrue(
        "liujiang root is at least twice the drop-in depth",
        girder.rootDepth >= girder.dropDepth * 2,
        `root=${girder.rootDepth} drop=${girder.dropDepth}`
      );

      checkTrue(
        "liujiang cantilever root is deeper than the drop-in span",
        Number.isFinite(rootBottom) && Number.isFinite(dropBottom) && rootBottom < dropBottom - 0.03,
        `root=${rootBottom.toFixed(3)} drop=${dropBottom.toFixed(3)}`
      );
      checkTrue(
        "liujiang girder stays below the deck",
        Number.isFinite(rootBottom) && rootBottom <= deckTop - 0.05,
        `root=${rootBottom.toFixed(3)} deckTop=${deckTop.toFixed(3)}`
      );
    }
  }

  /* ---- 文昌大桥：变截面连续箱梁 ---------------- */
  {
    const inner = atlas.bridges.get("wenchang").group.children.find((child) => child.isGroup);
    const deckTop = inner.userData.deckTop;
    const supports = inner.userData.supports || [];
    const piers = supports.map((s) => s.x).sort((a, b) => a - b).slice(1, -1);

    // 通体浅蓝：涂装材质的蓝分量必须压过红分量
    let paintColor = null;
    inner.traverse((object) => {
      if (!object.isMesh) return;
      const hex = object.material.color.getHexString();
      if (hex === "cfdede") paintColor = object.material.color;
    });

    checkTrue("wenchang has a continuous girder painted blue", paintColor !== null);
    if (paintColor) {
      checkTrue(
        "wenchang paint is light blue",
        paintColor.b > paintColor.r + 0.02,
        `r=${paintColor.r.toFixed(2)} b=${paintColor.b.toFixed(2)}`
      );
    }

    checkTrue("wenchang spans are continuous (>=5 piers)", piers.length >= 5, `piers=${piers.length}`);

    if (piers.length >= 2) {
      const pierX = piers[1];
      const spanMid = (piers[1] + piers[2]) / 2;
      const atPier = lowestOf(inner, "cfdede", pierX - 0.02, pierX + 0.02);
      const atMid = lowestOf(inner, "cfdede", spanMid - 0.02, spanMid + 0.02);

      checkTrue(
        "wenchang records its girder depths",
        inner.userData.girder && inner.userData.girder.rootDepth > inner.userData.girder.midDepth * 2,
        JSON.stringify(inner.userData.girder && { root: inner.userData.girder.rootDepth, mid: inner.userData.girder.midDepth })
      );
      checkTrue(
        "wenchang girder is deeper at the pier than at midspan",
        Number.isFinite(atPier) && Number.isFinite(atMid) && atPier < atMid - 0.035,
        `pier=${atPier.toFixed(3)} mid=${atMid.toFixed(3)}`
      );
      checkTrue(
        "wenchang girder stays below the deck",
        Number.isFinite(atPier) && atPier <= deckTop - 0.05,
        `girder=${atPier.toFixed(3)} deckTop=${deckTop.toFixed(3)}`
      );
    }
  }
}

/* ---------------- 合并几何体必须有法线 ---------------- */

/**
 * 桥梁的零件是按材质合并成大网格的。合并时若漏掉法线属性，
 * 着色器拿到的是缺省 (0,0,0)，normalize 之后是 NaN —— 整座桥会渲成纯黑。
 * v3.1 就踩过这个坑（判断条件写成 normals.length*3 === positions.length，
 * 等价于要求顶点数为零），所以这里逐网格守住法线。
 */
{
  let merged = 0;
  let missing = 0;
  let nonUnit = 0;
  let flipped = 0;

  for (const entry of atlas.bridges.values()) {
    entry.group.traverse((object) => {
      if (!object.isMesh || object.material.transparent) return;
      if (object.material.visible === false) return;
      const geometry = object.geometry;
      const position = geometry.attributes.position;
      const normal = geometry.attributes.normal;
      merged += 1;
      if (!normal) {
        missing += 1;
        return;
      }

      const index = geometry.index;
      const count = index ? index.count : position.count;
      const a = new THREE.Vector3();
      const b = new THREE.Vector3();
      const c = new THREE.Vector3();
      const na = new THREE.Vector3();
      const nb = new THREE.Vector3();
      const nc = new THREE.Vector3();
      const geometric = new THREE.Vector3();
      const mean = new THREE.Vector3();
      const ab = new THREE.Vector3();
      const ac = new THREE.Vector3();

      for (let i = 0; i < count; i += 3) {
        const ia = index ? index.getX(i) : i;
        const ib = index ? index.getX(i + 1) : i + 1;
        const ic = index ? index.getX(i + 2) : i + 2;
        a.fromBufferAttribute(position, ia);
        b.fromBufferAttribute(position, ib);
        c.fromBufferAttribute(position, ic);
        na.fromBufferAttribute(normal, ia);
        nb.fromBufferAttribute(normal, ib);
        nc.fromBufferAttribute(normal, ic);
        if (Math.abs(na.length() - 1) > 0.01) nonUnit += 1;

        ab.subVectors(b, a);
        ac.subVectors(c, a);
        geometric.crossVectors(ab, ac);
        if (geometric.length() < 1e-12) continue;
        mean.copy(na).add(nb).add(nc).normalize();
        if (geometric.dot(mean) < 0) flipped += 1;
      }
    });
  }

  check("bridge meshes carry normals", missing, 0);
  checkTrue("bridge normals are unit length", nonUnit === 0, `nonUnit=${nonUnit}`);
  checkTrue("bridge normals agree with winding", flipped === 0, `flipped=${flipped}`);
  checkTrue("every bridge has merged meshes", merged > 20, `meshes=${merged}`);
}

/* ---------------- 地形采样 ---------------- */

// 三角面采样器本身必须与网格三角化一致（双线性在陡坡上与真实面能差 0.2 单位）
{
  let surfaceWorst = 0;
  for (let i = 0; i < 300; i += 1) {
    const x = TERRAIN.minX + Math.random() * (TERRAIN.maxX - TERRAIN.minX);
    const z = TERRAIN.minZ + Math.random() * (TERRAIN.maxZ - TERRAIN.minZ);
    const fx = (x - TERRAIN.minX) / TERRAIN.step;
    const fz = (z - TERRAIN.minZ) / TERRAIN.step;
    const c0 = Math.min(TERRAIN.cols - 2, Math.max(0, Math.floor(fx)));
    const r0 = Math.min(TERRAIN.rows - 2, Math.max(0, Math.floor(fz)));
    const u = Math.min(1, Math.max(0, fx - c0));
    const v = Math.min(1, Math.max(0, fz - r0));
    const nodeHeight = (c, r) =>
      atlas.heightAt(TERRAIN.minX + c * TERRAIN.step, TERRAIN.minZ + r * TERRAIN.step);
    const h00 = nodeHeight(c0, r0);
    const h10 = nodeHeight(c0 + 1, r0);
    const h01 = nodeHeight(c0, r0 + 1);
    const h11 = nodeHeight(c0 + 1, r0 + 1);
    const expected =
      u + v <= 1
        ? h00 + u * (h10 - h00) + v * (h01 - h00)
        : h11 + (1 - u) * (h01 - h11) + (1 - v) * (h10 - h11);
    const actual = atlas.surfaceHeightAt(x, z);
    if (!Number.isFinite(actual)) surfaceWorst = Infinity;
    else if (Math.abs(actual - expected) > surfaceWorst) surfaceWorst = Math.abs(actual - expected);
  }
  checkTrue(
    "terrain surface sampler matches triangulation",
    surfaceWorst < 1e-6,
    `worst=${surfaceWorst.toExponential(1)}`
  );
}

/* ---------------- 地形（喀斯特孤峰） ---------------- */

let terrainMesh = null;
atlas.root.traverse((object) => {
  if (object.isMesh && object.material && object.material.vertexColors) terrainMesh = object;
});
checkTrue("terrain mesh exists", Boolean(terrainMesh));

if (terrainMesh) {
  const position = terrainMesh.geometry.attributes.position;
  const worldX = (i) => position.getX(i) + terrainMesh.position.x;
  const worldZ = (i) => position.getZ(i) + terrainMesh.position.z;

  check("terrain grid size", position.count, TERRAIN.cols * TERRAIN.rows);

  // 1) 河道上方必须压平到 0，否则水面贴花（y=0.004）会被地形戳穿
  let riverMax = 0;
  for (let i = 0; i < position.count; i += 1) {
    if (distanceToRivers(worldX(i), worldZ(i)) < GEO.riverHalfWidth + 0.1) {
      riverMax = Math.max(riverMax, position.getY(i));
    }
  }
  checkTrue("terrain flattened under river", riverMax < 0.004, `max=${riverMax.toFixed(4)}`);

  // 2) 边界必须精确归零，才能与外接平地裙边无缝衔接
  let boundaryMax = 0;
  for (let i = 0; i < position.count; i += 1) {
    const x = worldX(i);
    const z = worldZ(i);
    if (
      Math.abs(x - TERRAIN.minX) < 0.01 ||
      Math.abs(x - TERRAIN.maxX) < 0.01 ||
      Math.abs(z - TERRAIN.minZ) < 0.01 ||
      Math.abs(z - TERRAIN.maxZ) < 0.01
    ) {
      boundaryMax = Math.max(boundaryMax, Math.abs(position.getY(i)));
    }
  }
  checkTrue("terrain boundary returns to zero", boundaryMax < 1e-6, `max=${boundaryMax}`);

  // 3) 九峰要有高度。50 m 网格采样会削低窄峰顶（鱼峰山实测 255 m → 网格 234 m），
  //    所以阈值留了余量，只断言"确实立起来了"。
  const peakAt = (x, z) => {
    const c = Math.round((x - TERRAIN.minX) / TERRAIN.step);
    const r = Math.round((z - TERRAIN.minZ) / TERRAIN.step);
    let best = 0;
    for (let dr = -2; dr <= 2; dr += 1) {
      for (let dc = -2; dc <= 2; dc += 1) {
        const i = (r + dr) * TERRAIN.cols + (c + dc);
        if (i >= 0 && i < position.count) best = Math.max(best, position.getY(i));
      }
    }
    return best;
  };
  checkTrue("peak yufeng shan stands", peakAt(-10.3, 43.4) > 3.5, `h=${peakAt(-10.3, 43.4).toFixed(2)}`);
  checkTrue("peak panlong shan stands", peakAt(2.2, 30.1) > 1.8, `h=${peakAt(2.2, 30.1).toFixed(2)}`);
  checkTrue("peak henan stands", peakAt(-4.1, 37.3) > 1.5, `h=${peakAt(-4.1, 37.3).toFixed(2)}`);

  const triangles = terrainMesh.geometry.index.count / 3;
  checkTrue("terrain triangle budget", triangles <= 90000, `tris=${triangles}`);
}

const box = new THREE.Box3().setFromObject(atlas.root);
checkTrue(
  "bounding box finite",
  ["min", "max"].every((key) => ["x", "y", "z"].every((axis) => Number.isFinite(box[key][axis])))
);
const windowWidth = GEO.window.maxX - GEO.window.minX;
const windowDepth = GEO.window.maxZ - GEO.window.minZ;
checkTrue("bounding box covers window", box.max.x - box.min.x > windowWidth, `width=${(box.max.x - box.min.x).toFixed(1)}`);
checkTrue("bounding box height", box.max.y > 0.5, `maxY=${box.max.y.toFixed(1)}`);

/* ---------------- 状态切换 ---------------- */

atlas.setSelection({ view: "bridge", bridgeId: "wenhui" });
atlas.setHover("bridge:wenhui");
atlas.setHover("building:lab");
atlas.setHover(null);
atlas.setSelection({ view: "atlas", bridgeId: null });

/* ---------------- 元数据一致性 ---------------- */

for (const meta of BRIDGES) {
  checkTrue(`meta ${meta.id} has geo`, GEO.bridges.some((bridge) => bridge.id === meta.id));
}

checkTrue("three revision", Boolean(THREE.REVISION));

console.log(failures === 0 ? "ALL PASS" : `${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);

