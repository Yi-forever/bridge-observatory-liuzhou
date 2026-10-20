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

checkTrue("city blocks placed", atlas.cityBlocks >= 20, `placed=${atlas.cityBlocks}`);

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
