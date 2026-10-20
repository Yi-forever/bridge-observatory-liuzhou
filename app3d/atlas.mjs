/**
 * 城市总览场景（M1）。
 *
 * 目标：让五座桥"可辨认"——拱桥有拱肋与吊杆，斜拉桥有环形主塔与索，风雨桥有廊亭，
 * 连续梁桥有多跨与支座，梁桥有明确的梁＋墩。此阶段仍属 L1–L2 占位：
 * 低模、纯色材质、无贴图，细部交给 M2/M3。
 */

import * as THREE from "../vendor/three/three.module.min.js";
import { BRIDGES, ATLAS_SPAN } from "./data.mjs";
import {
  riverCurveFromPoints,
  nearestT,
  sideVectorAt,
  bandAlongCurve,
  riverSurface,
  archCurve,
  pyramidRoof
} from "./geometry.mjs";

const CFG = {
  riverHalfWidth: 8,
  bankWidth: 17,
  deckLength: 22,
  deckWidth: 4.4,
  deckY: 1.7,
  cityBlockCount: 16
};

const COLOR = {
  ground: 0x0b2129,
  bank: 0x123039,
  bankEdge: 0x1b4550,
  river: 0x145f70,
  concrete: 0x2b3f46,
  deck: 0x39505a,
  blockA: 0x16323c,
  blockB: 0x1a3a44,
  lab: 0x2f5d64,
  archive: 0x4a4258,
  glow: 0xffd9a8
};

function worldFromMap(map) {
  return {
    x: ((map.x - 50) / 50) * ATLAS_SPAN.width,
    z: ((map.y - 50) / 50) * ATLAS_SPAN.depth
  };
}

/** 简单的确定性伪随机，保证每次构建的城市块布局一致。 */
function createRandom(seed = 20261020) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

function box(width, height, depth, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  return mesh;
}

function cylinder(radiusTop, radiusBottom, height, segments, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(
    new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments),
    material
  );
  mesh.position.set(x, y, z);
  return mesh;
}

function rodBetween(start, end, radius, material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const length = direction.length();
  const geometry = new THREE.CylinderGeometry(radius, radius, length, 6);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(start).addScaledVector(direction, 0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.clone().normalize()
  );
  return mesh;
}

/* ------------------------------------------------------------------ *
 * 五座桥的可辨认低模
 * ------------------------------------------------------------------ */

function buildGirderBridge(accent, concrete, deckMaterial) {
  const group = new THREE.Group();
  const { deckLength, deckWidth, deckY } = CFG;
  const half = deckLength / 2;

  group.add(box(deckLength, 0.55, deckWidth, deckMaterial, 0, deckY, 0));
  group.add(box(deckLength - 1, 0.75, deckWidth - 0.8, concrete, 0, deckY - 0.65, 0));

  for (const z of [-deckWidth / 2 + 0.16, deckWidth / 2 - 0.16]) {
    group.add(box(deckLength, 0.42, 0.18, accent, 0, deckY + 0.45, z));
  }

  for (const x of [-half * 0.56, half * 0.56]) {
    group.add(box(1.15, deckY + 0.2, 1.7, concrete, x, deckY / 2 - 0.15, 0));
    group.add(box(2.6, 0.55, 2.6, concrete, x, 0.28, 0));
  }

  return { group, top: deckY + 1.1 };
}

function buildArchBridge(accent, concrete, deckMaterial) {
  const group = new THREE.Group();
  const { deckLength, deckWidth, deckY } = CFG;
  const span = deckLength - 2;
  const half = span / 2;

  group.add(box(deckLength, 0.5, deckWidth - 0.4, deckMaterial, 0, deckY, 0));
  for (const z of [-deckWidth / 2 + 0.25, deckWidth / 2 - 0.25]) {
    group.add(box(deckLength, 0.38, 0.16, accent, 0, deckY + 0.42, z));
  }

  const rise = 6.6;
  const ribCurve = archCurve(span, deckY + 0.25, rise, 28);
  const rib = new THREE.Mesh(new THREE.TubeGeometry(ribCurve, 44, 0.4, 8, false), accent);
  group.add(rib);

  // 吊杆：从拱肋垂到桥面
  const hangerCount = 9;
  for (let i = 1; i < hangerCount; i += 1) {
    const x = -half + (span * i) / hangerCount;
    const ratio = (2 * x) / span;
    const topY = deckY + 0.25 + rise * (1 - ratio * ratio);
    group.add(rodBetween(
      new THREE.Vector3(x, deckY + 0.3, 0),
      new THREE.Vector3(x, topY, 0),
      0.075,
      concrete
    ));
  }

  // 拱座
  for (const x of [-half, half]) {
    group.add(box(2.4, 1.5, deckWidth - 0.2, concrete, x, deckY - 0.55, 0));
    group.add(box(3.0, 0.5, deckWidth + 0.4, concrete, x, 0.26, 0));
  }

  return { group, top: deckY + rise + 1.0 };
}

function buildContinuousBridge(accent, concrete, deckMaterial) {
  const group = new THREE.Group();
  const { deckWidth, deckY } = CFG;
  const deckLength = 24;
  const half = deckLength / 2;

  group.add(box(deckLength, 0.9, deckWidth, deckMaterial, 0, deckY, 0));
  for (const z of [-deckWidth / 2 + 0.16, deckWidth / 2 - 0.16]) {
    group.add(box(deckLength, 0.4, 0.16, accent, 0, deckY + 0.62, z));
  }

  // 支座附近的梁高变化（箱梁加腋的简化）
  for (const x of [-half * 0.62, 0, half * 0.62]) {
    group.add(box(3.4, 1.15, deckWidth - 0.5, concrete, x, deckY - 0.85, 0));
  }

  for (const x of [-half * 0.62, 0, half * 0.62]) {
    group.add(box(1.2, deckY - 0.1, 1.9, concrete, x, deckY / 2 - 0.6, 0));
    group.add(box(2.5, 0.4, 2.5, concrete, x, 0.2, 0));
  }

  return { group, top: deckY + 1.4 };
}

function buildCableBridge(accent, concrete, deckMaterial) {
  const group = new THREE.Group();
  const { deckLength, deckWidth, deckY } = CFG;
  const half = deckLength / 2;

  group.add(box(deckLength, 0.5, deckWidth, deckMaterial, 0, deckY, 0));
  for (const z of [-deckWidth / 2 + 0.16, deckWidth / 2 - 0.16]) {
    group.add(box(deckLength, 0.4, 0.16, accent, 0, deckY + 0.42, z));
  }

  // 环形主塔（“柳州之门”）：圆环立于桥轴上，平面垂直于桥面走向
  const ringRadius = 4.8;
  const centerY = deckY + ringRadius + 0.1;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(ringRadius, 0.42, 10, 40),
    accent
  );
  ring.position.set(0, centerY, 0);
  ring.rotation.y = Math.PI / 2;
  group.add(ring);

  // 斜拉索呈扇形，从环上弦拉向两侧桥面
  const cableTargets = [-half * 0.78, -half * 0.5, -half * 0.24, half * 0.24, half * 0.5, half * 0.78];
  cableTargets.forEach((x, index) => {
    const angle = Math.PI * 0.42 + (index / cableTargets.length) * Math.PI * 0.34;
    for (const side of [-1, 1]) {
      const ringPoint = new THREE.Vector3(
        0,
        centerY + Math.sin(angle) * ringRadius * 0.92,
        side * Math.cos(angle) * ringRadius * 0.92
      );
      const deckPoint = new THREE.Vector3(x, deckY + 0.25, side * (deckWidth / 2 - 0.4));
      group.add(rodBetween(ringPoint, deckPoint, 0.065, accent));
    }
  });

  for (const x of [-half * 0.72, half * 0.72]) {
    group.add(box(1.3, deckY, 2.0, concrete, x, deckY / 2 - 0.1, 0));
    group.add(box(2.8, 0.45, 2.8, concrete, x, 0.22, 0));
  }

  return { group, top: centerY + ringRadius + 1.0 };
}

function buildPavilionBridge(accent, concrete, deckMaterial) {
  const group = new THREE.Group();
  const { deckLength, deckWidth, deckY } = CFG;
  const half = deckLength / 2;

  group.add(box(deckLength, 0.5, deckWidth, deckMaterial, 0, deckY, 0));
  for (const z of [-deckWidth / 2 + 0.16, deckWidth / 2 - 0.16]) {
    group.add(box(deckLength, 0.36, 0.16, concrete, 0, deckY + 0.4, z));
  }

  // 五座风雨亭：立柱 + 四棱锥顶
  const pavilionX = [-8.4, -4.2, 0, 4.2, 8.4];
  for (const x of pavilionX) {
    const pillarHeight = 1.9;
    for (const dx of [-1.15, 1.15]) {
      for (const dz of [-1.25, 1.25]) {
        group.add(box(0.16, pillarHeight, 0.16, concrete, x + dx, deckY + pillarHeight / 2 + 0.25, dz));
      }
    }
    const roof = new THREE.Mesh(pyramidRoof(3.4, 1.35, 3.6), accent);
    roof.position.set(x, deckY + pillarHeight + 1.1, 0);
    group.add(roof);
  }

  for (const x of [-half * 0.62, half * 0.62]) {
    group.add(box(1.2, deckY, 1.8, concrete, x, deckY / 2 - 0.1, 0));
    group.add(box(2.6, 0.45, 2.6, concrete, x, 0.22, 0));
  }

  return { group, top: deckY + 4.6 };
}

const BRIDGE_BUILDERS = {
  girder: buildGirderBridge,
  arch: buildArchBridge,
  continuous: buildContinuousBridge,
  cable: buildCableBridge,
  pavilion: buildPavilionBridge
};

/* ------------------------------------------------------------------ *
 * 建筑
 * ------------------------------------------------------------------ */

function buildLabBuilding() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: COLOR.lab, roughness: 0.7 });
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: COLOR.glow,
    emissive: new THREE.Color(COLOR.glow),
    emissiveIntensity: 0.85,
    roughness: 0.4
  });
  const structureMaterial = new THREE.MeshStandardMaterial({
    color: 0x9fd8e0,
    roughness: 0.5,
    metalness: 0.3
  });

  group.add(box(6.6, 3.4, 5.2, bodyMaterial, 0, 1.7, 0));
  const roof = new THREE.Mesh(pyramidRoof(7.2, 1.9, 5.8), structureMaterial);
  roof.position.set(0, 4.35, 0);
  group.add(roof);

  // 窗带与门：表示"可进入的实验室"
  for (const z of [-2.62, 2.62]) {
    for (const x of [-1.9, 0, 1.9]) {
      group.add(box(1.1, 0.75, 0.1, glowMaterial, x, 2.45, z));
    }
  }
  group.add(box(1.5, 1.9, 0.14, glowMaterial, 0, 0.95, 2.62));

  return { group, top: 6.4 };
}

function buildArchiveBuilding() {
  const group = new THREE.Group();
  const bodyMaterial = new THREE.MeshStandardMaterial({ color: COLOR.archive, roughness: 0.75 });
  const trimMaterial = new THREE.MeshStandardMaterial({ color: 0xcbbfe0, roughness: 0.55 });
  const glowMaterial = new THREE.MeshStandardMaterial({
    color: COLOR.glow,
    emissive: new THREE.Color(COLOR.glow),
    emissiveIntensity: 0.7,
    roughness: 0.45
  });

  group.add(box(5.4, 3.0, 5.4, bodyMaterial, 0, 1.5, 0));
  const roof = new THREE.Mesh(pyramidRoof(6.2, 2.4, 6.2), trimMaterial);
  roof.position.set(0, 4.2, 0);
  group.add(roof);

  // 四根柱廊
  for (const dx of [-2.2, 2.2]) {
    for (const dz of [-2.6, 2.6]) {
      group.add(cylinder(0.18, 0.18, 3.0, 10, trimMaterial, dx, 1.5, dz));
    }
  }
  group.add(box(5.8, 0.32, 0.3, trimMaterial, 0, 3.05, 2.6));
  group.add(box(1.3, 1.8, 0.12, glowMaterial, 0, 0.9, 2.74));

  return { group, top: 6.6 };
}

/* ------------------------------------------------------------------ *
 * 场景装配
 * ------------------------------------------------------------------ */

export function buildAtlas() {
  const root = new THREE.Group();
  const pickables = [];
  const bridges = new Map();
  const buildings = new Map();
  const labelItems = [];

  const concrete = new THREE.MeshStandardMaterial({ color: COLOR.concrete, roughness: 0.9 });
  const deckMaterial = new THREE.MeshStandardMaterial({ color: COLOR.deck, roughness: 0.8 });

  // 地面
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(280, 280),
    new THREE.MeshStandardMaterial({ color: COLOR.ground, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.06;
  root.add(ground);

  // 河道曲线：穿过五座桥，两端延伸出画
  const bridgePoints = BRIDGES.map((bridge) => worldFromMap(bridge.map));
  const curve = riverCurveFromPoints(bridgePoints, 30);

  // 江岸与河面
  const bankOuter = CFG.riverHalfWidth + CFG.bankWidth;
  const bankMaterial = new THREE.MeshStandardMaterial({
    color: COLOR.bank,
    roughness: 0.95,
    side: THREE.DoubleSide
  });

  for (const [inner, outer] of [
    [CFG.riverHalfWidth, bankOuter],
    [-CFG.riverHalfWidth, -bankOuter]
  ]) {
    const band = new THREE.Mesh(bandAlongCurve(curve, inner, outer, 0.02), bankMaterial);
    root.add(band);
  }
  // 岸线（略亮的窄带，强化河道轮廓）
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: COLOR.bankEdge,
    roughness: 0.8,
    side: THREE.DoubleSide
  });
  for (const side of [1, -1]) {
    const edge = new THREE.Mesh(
      bandAlongCurve(curve, side * CFG.riverHalfWidth, side * (CFG.riverHalfWidth + 1.1), 0.05),
      edgeMaterial
    );
    root.add(edge);
  }

  // 河面
  const river = new THREE.Mesh(
    riverSurface(curve, CFG.riverHalfWidth, 0.04),
    new THREE.MeshStandardMaterial({
      color: COLOR.river,
      roughness: 0.25,
      metalness: 0.35,
      side: THREE.DoubleSide
    })
  );
  root.add(river);

  // 五座桥
  for (const bridge of BRIDGES) {
    const point = worldFromMap(bridge.map);
    const t = nearestT(curve, point);
    const anchor = curve.getPointAt(t);
    const side = sideVectorAt(curve, t);
    const rotationY = Math.atan2(-side.z, side.x);

    const accent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bridge.accent),
      emissive: new THREE.Color(bridge.accent),
      emissiveIntensity: 0.08,
      roughness: 0.55,
      metalness: 0.12
    });
    const accentDark = new THREE.MeshStandardMaterial({
      color: new THREE.Color(bridge.accent).multiplyScalar(0.55),
      roughness: 0.7
    });

    const builder = BRIDGE_BUILDERS[bridge.model] || buildGirderBridge;
    const model = builder(accent, concrete, deckMaterial);

    const group = new THREE.Group();
    group.add(model.group);
    group.position.set(anchor.x, 0, anchor.z);
    group.rotation.y = rotationY;
    group.userData.pick = { type: "bridge", id: bridge.id };

    root.add(group);
    pickables.push(group);
    bridges.set(bridge.id, {
      group,
      accent,
      accentDark,
      baseY: 0,
      top: model.top,
      labelAnchor: new THREE.Vector3(anchor.x, model.top + 0.6, anchor.z)
    });

    labelItems.push({
      key: `bridge:${bridge.id}`,
      type: "bridge",
      id: bridge.id,
      text: bridge.name,
      sub: `${bridge.year} · ${bridge.type}`,
      accent: bridge.accent,
      position: new THREE.Vector3(anchor.x, model.top + 0.9, anchor.z)
    });
  }

  // 两栋建筑（先落位，便于街区避让）
  const buildingSpecs = [
    { id: "lab", t: 0.42, sideSign: 1, offset: 15.5, builder: buildLabBuilding, name: "桥梁结构实验室", sub: "力流 · 拆解 · 荷载" },
    { id: "archive", t: 0.64, sideSign: -1, offset: 15.5, builder: buildArchiveBuilding, name: "桥梁档案馆", sub: "档案 · 知识挑战" }
  ];
  const buildingPositions = [];

  for (const spec of buildingSpecs) {
    const point = curve.getPointAt(spec.t);
    const side = sideVectorAt(curve, spec.t);
    const model = spec.builder();
    const group = new THREE.Group();
    group.add(model.group);
    group.position.set(
      point.x + side.x * spec.offset * spec.sideSign,
      0,
      point.z + side.z * spec.offset * spec.sideSign
    );
    group.rotation.y = Math.atan2(-side.z, side.x) + (spec.sideSign > 0 ? 0 : Math.PI);
    group.userData.pick = { type: "building", id: spec.id };

    root.add(group);
    pickables.push(group);
    buildings.set(spec.id, { group, top: model.top });
    buildingPositions.push({ x: group.position.x, z: group.position.z });

    labelItems.push({
      key: `building:${spec.id}`,
      type: "building",
      id: spec.id,
      text: spec.name,
      sub: spec.sub,
      accent: spec.id === "lab" ? "#9fd8e0" : "#cbbfe0",
      position: new THREE.Vector3(
        group.position.x,
        model.top + 0.8,
        group.position.z
      )
    });
  }

  // 城市街区（两岸低模体块，避让建筑与桥端）
  const random = createRandom();
  const blockMaterials = [
    new THREE.MeshStandardMaterial({ color: COLOR.blockA, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: COLOR.blockB, roughness: 0.9 })
  ];

  let placed = 0;
  let attempts = 0;
  while (placed < CFG.cityBlockCount && attempts < CFG.cityBlockCount * 14) {
    attempts += 1;
    const t = 0.04 + random() * 0.92;
    const point = curve.getPointAt(t);
    const side = sideVectorAt(curve, t);
    const sideSign = placed % 2 === 0 ? 1 : -1;
    const offset = CFG.riverHalfWidth + 6 + random() * (CFG.bankWidth - 7);
    const centerX = point.x + side.x * offset * sideSign;
    const centerZ = point.z + side.z * offset * sideSign;

    const nearBuilding = buildingPositions.some(
      (bp) => Math.hypot(bp.x - centerX, bp.z - centerZ) < 8
    );
    if (nearBuilding) continue;

    const width = 1.8 + random() * 2.6;
    const depth = 1.8 + random() * 2.4;
    const height = 0.7 + random() * 2.6;

    const block = box(
      width,
      height,
      depth,
      blockMaterials[placed % 2],
      centerX,
      height / 2 + 0.03,
      centerZ
    );
    block.rotation.y = random() * Math.PI;
    root.add(block);
    placed += 1;
  }

  /* 选中与悬停 */

  let selection = { view: "atlas", bridgeId: null };
  let hoveredKey = null;

  function emphasisFor(key) {
    const isBridge = key.startsWith("bridge:");
    if (!isBridge) return { scale: 1, lift: 0, glow: 0.2 };
    const id = key.slice("bridge:".length);
    const selected = selection.view === "bridge" && selection.bridgeId === id;
    const dimmed = selection.view === "bridge" && selection.bridgeId !== id;
    if (selected) return { scale: 1.06, lift: 0.5, glow: 0.55 };
    if (hoveredKey === key) return { scale: 1.035, lift: 0.2, glow: 0.35 };
    if (dimmed) return { scale: 1, lift: 0, glow: 0.01 };
    return { scale: 1, lift: 0, glow: 0.08 };
  }

  function apply() {
    for (const [id, entry] of bridges) {
      const emphasis = emphasisFor(`bridge:${id}`);
      entry.group.scale.setScalar(emphasis.scale);
      entry.group.position.y = entry.baseY + emphasis.lift;
      entry.accent.emissiveIntensity = emphasis.glow;
      entry.accentDark.emissiveIntensity = 0;
    }
    for (const [id, entry] of buildings) {
      const key = `building:${id}`;
      const active = hoveredKey === key;
      entry.group.scale.setScalar(active ? 1.035 : 1);
      entry.group.position.y = active ? 0.18 : 0;
    }
  }

  function setSelection(next) {
    selection = { view: next.view, bridgeId: next.bridgeId };
    apply();
  }

  function setHover(key) {
    if (hoveredKey === key) return;
    hoveredKey = key;
    apply();
  }

  apply();

  return {
    root,
    pickables,
    bridges,
    buildings,
    labels: labelItems,
    curve,
    cityBlocks: placed,
    setSelection,
    setHover,
    get hovered() {
      return hoveredKey;
    }
  };
}
