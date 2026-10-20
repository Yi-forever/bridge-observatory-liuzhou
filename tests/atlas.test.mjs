/**
 * 场景几何自检（可在 Node 中直接运行，不需要浏览器）。
 *
 *   node tests/atlas.test.mjs
 *
 * 覆盖：桥梁落位与曲线贴合、桥型区分、建筑避让、包围盒合理性、状态切换稳定性。
 */

import * as THREE from "../vendor/three/three.module.min.js";
import { buildAtlas } from "../app3d/atlas.mjs";
import { riverCurveFromPoints, nearestT } from "../app3d/geometry.mjs";
import { BRIDGES, ATLAS_SPAN } from "../app3d/data.mjs";

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

function mapToWorld(map) {
  return {
    x: ((map.x - 50) / 50) * ATLAS_SPAN.width,
    z: ((map.y - 50) / 50) * ATLAS_SPAN.depth
  };
}

const atlas = buildAtlas();

check("bridge count", atlas.bridges.size, 5);
check("building count", atlas.buildings.size, 2);
check("pickables", atlas.pickables.length, 7);
check("label count", atlas.labels.length, 7);

for (const bridge of BRIDGES) {
  const entry = atlas.bridges.get(bridge.id);
  checkTrue(`bridge ${bridge.id} exists`, Boolean(entry));
  if (!entry) continue;

  const position = entry.group.position;
  checkTrue(`bridge ${bridge.id} position finite`, Number.isFinite(position.x) && Number.isFinite(position.z));
  checkTrue(`bridge ${bridge.id} has children`, entry.group.children.length > 0);
  checkTrue(`bridge ${bridge.id} structure height`, entry.top > 2.5, `top=${entry.top}`);

  const anchor = entry.labelAnchor;
  checkTrue(
    `bridge ${bridge.id} anchor finite`,
    Number.isFinite(anchor.x) && Number.isFinite(anchor.y) && Number.isFinite(anchor.z)
  );

  const target = mapToWorld(bridge.map);
  const offset = Math.hypot(position.x - target.x, position.z - target.z);
  checkTrue(`bridge ${bridge.id} near mapped point`, offset < 3, `offset=${offset.toFixed(2)}`);
}

const points = BRIDGES.map((bridge) => mapToWorld(bridge.map));
const curve = riverCurveFromPoints(points, 30);
for (const [index, point] of points.entries()) {
  const nearest = curve.getPointAt(nearestT(curve, point));
  const distance = Math.hypot(nearest.x - point.x, nearest.z - point.z);
  checkTrue(`curve passes bridge ${index + 1}`, distance < 2.5, `distance=${distance.toFixed(2)}`);
}

const childCounts = BRIDGES.map((bridge) => {
  const entry = atlas.bridges.get(bridge.id);
  return entry ? entry.group.children[0].children.length : 0;
});
checkTrue("bridge models differ", new Set(childCounts).size > 1, `counts=${childCounts.join(",")}`);
checkTrue("bridge models non-empty", childCounts.every((count) => count > 2), `counts=${childCounts.join(",")}`);

for (const [id, entry] of atlas.buildings) {
  checkTrue(
    `building ${id} finite`,
    Number.isFinite(entry.group.position.x) && Number.isFinite(entry.group.position.z)
  );
  for (const bridge of BRIDGES) {
    const bridgeEntry = atlas.bridges.get(bridge.id);
    if (!bridgeEntry) continue;
    const distance = entry.group.position.distanceTo(bridgeEntry.group.position);
    checkTrue(`building ${id} clear of ${bridge.id}`, distance > 6, `distance=${distance.toFixed(2)}`);
  }
}

checkTrue("city blocks placed", atlas.cityBlocks >= 10, `placed=${atlas.cityBlocks}`);

const box = new THREE.Box3().setFromObject(atlas.root);
checkTrue(
  "bounding box finite",
  ["min", "max"].every(
    (key) =>
      Number.isFinite(box[key].x) && Number.isFinite(box[key].y) && Number.isFinite(box[key].z)
  )
);
checkTrue("bounding box width", box.max.x - box.min.x > 40, `width=${(box.max.x - box.min.x).toFixed(1)}`);
checkTrue("bounding box height", box.max.y > 6, `maxY=${box.max.y.toFixed(1)}`);

// 状态切换不应抛错
atlas.setSelection({ view: "bridge", bridgeId: "wenhui" });
atlas.setHover("bridge:wenhui");
atlas.setHover("building:lab");
atlas.setHover(null);
atlas.setSelection({ view: "atlas", bridgeId: null });

checkTrue("three revision", Boolean(THREE.REVISION));

console.log(failures === 0 ? "ALL PASS" : `${failures} FAILED`);
process.exit(failures === 0 ? 0 : 1);
