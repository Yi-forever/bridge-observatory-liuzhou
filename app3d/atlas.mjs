/**
 * 城市总览场景（真实地理版）。
 *
 * 几何全部来自 app3d/geo.mjs（由 tools/build-geo.mjs 从 OpenStreetMap 生成）：
 *   - 河道：真实中心线折线（1 世界单位 = 100 米）
 *   - 桥梁：真实中心点、真实轴向角、真实桥长/桥宽
 *
 * 两条刻意的取舍，写在明处：
 *   1) 竖向夸张 2.2 倍——真实桥在 10 km 视野里薄如纸片，抬高结构件只为可读；
 *      平面尺寸（长度、宽度、位置、朝向）不做夸张。
 *   2) 最小尺寸地板——桥面宽度不足 34 m 的按 34 m 画，否则在总览里根本看不见。
 */

import * as THREE from "../vendor/three/three.module.min.js";
import { BRIDGES } from "./data.mjs";
import { GEO } from "./geo.mjs";
import {
  bandAlongCurve,
  riverSurface,
  archCurve,
  pyramidRoof,
  curveFromPolyline
} from "./geometry.mjs";

const VERTICAL = 2.2;
const BANK_WIDTH = 9;
const GROUND_MARGIN = 80;
const CITY_BLOCKS = 46;

const MIN_BRIDGE_LENGTH = 2.2;
const MIN_BRIDGE_WIDTH = 0.34;

const COLOR = {
  ground: 0x0b2129,
  bank: 0x123039,
  bankEdge: 0x1b4550,
  water: 0x145f70,
  concrete: 0x2b3f46,
  deck: 0x39505a,
  blockA: 0x16323c,
  blockB: 0x1a3a44,
  lab: 0x2f5d64,
  archive: 0x4a4258,
  glow: 0xffd9a8
};

/* ------------------------------------------------------------------ *
 * 小工具
 * ------------------------------------------------------------------ */

function box(width, height, depth, material, x = 0, y = 0, z = 0) {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(width, height, depth), material);
  mesh.position.set(x, y, z);
  return mesh;
}

function cylinder(radius, height, material, x = 0, y = 0, z = 0, segments = 8) {
  const mesh = new THREE.Mesh(new THREE.CylinderGeometry(radius, radius, height, segments), material);
  mesh.position.set(x, y, z);
  return mesh;
}

function rodBetween(start, end, radius, material) {
  const direction = new THREE.Vector3().subVectors(end, start);
  const geometry = new THREE.CylinderGeometry(radius, radius, direction.length(), 5);
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.copy(start).addScaledVector(direction, 0.5);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), direction.clone().normalize());
  return mesh;
}

/** 确定性伪随机，保证每次构建布局一致。 */
function createRandom(seed = 20261020) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 0xffffffff;
  };
}

/** 点到折线的最短距离（世界单位）。 */
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
    const distance = Math.hypot(px - (ax + t * dx), pz - (az + t * dz));
    if (distance < best) best = distance;
  }
  return best;
}

function distanceToRivers(px, pz, rivers) {
  let best = Infinity;
  for (const line of rivers) {
    const distance = distanceToPolyline(px, pz, line);
    if (distance < best) best = distance;
  }
  return best;
}

/* ------------------------------------------------------------------ *
 * 五座桥：按真实长宽建模（平面真实，竖向夸张）
 * ------------------------------------------------------------------ */

function metrics(bridge) {
  const L = Math.max(bridge.length, MIN_BRIDGE_LENGTH);
  const W = Math.max(bridge.width, MIN_BRIDGE_WIDTH);
  const deckY = 0.1 + L * 0.035;
  const deckT = 0.05 + L * 0.016;
  return { L, W, deckY, deckT };
}

function addParapets(group, L, W, deckY, deckT, material) {
  const railHeight = 0.05 + L * 0.004;
  for (const sign of [-1, 1]) {
    group.add(box(L, railHeight, 0.03, material, 0, deckY + deckT / 2 + railHeight / 2, (sign * W) / 2));
  }
}

function addPiers(group, L, W, deckY, concrete, count, spread) {
  for (let i = 0; i < count; i += 1) {
    const ratio = count === 1 ? 0 : (i / (count - 1) - 0.5) * 2 * spread;
    const x = ratio * (L / 2);
    const pierWidth = 0.1 + L * 0.012;
    group.add(box(pierWidth, deckY, W * 1.6, concrete, x, deckY / 2, 0));
    group.add(box(pierWidth * 2.4, 0.05, W * 2.4, concrete, x, 0.025, 0));
  }
}

function buildGirder(bridge, accent, concrete, deckMaterial) {
  const { L, W, deckY, deckT } = metrics(bridge);
  const group = new THREE.Group();
  group.add(box(L, deckT, W, deckMaterial, 0, deckY, 0));
  group.add(box(L * 0.95, deckT * 1.5, W * 0.8, concrete, 0, deckY - deckT * 1.2, 0));
  addParapets(group, L, W, deckY, deckT, accent);
  addPiers(group, L, W, deckY, concrete, 2, 0.56);
  return { group, top: deckY + 0.35 };
}

function buildArch(bridge, accent, concrete, deckMaterial) {
  const { L, W, deckY, deckT } = metrics(bridge);
  const group = new THREE.Group();
  const span = L * 0.92;
  const rise = L * 0.22 * VERTICAL;

  group.add(box(L, deckT, W, deckMaterial, 0, deckY, 0));
  addParapets(group, L, W, deckY, deckT, accent);

  const ribCurve = archCurve(span, deckY + deckT / 2, rise, 28);
  const tube = 0.028 + L * 0.008;
  group.add(new THREE.Mesh(new THREE.TubeGeometry(ribCurve, 44, tube, 7, false), accent));

  const hangers = 9;
  for (let i = 1; i < hangers; i += 1) {
    const x = -span / 2 + (span * i) / hangers;
    const ratio = (2 * x) / span;
    const topY = deckY + deckT / 2 + rise * (1 - ratio * ratio);
    group.add(
      rodBetween(
        new THREE.Vector3(x, deckY + deckT / 2, 0),
        new THREE.Vector3(x, topY, 0),
        0.012 + L * 0.002,
        concrete
      )
    );
  }

  for (const sign of [-1, 1]) {
    group.add(box(0.34, deckY * 1.6, W * 1.3, concrete, (sign * span) / 2, (deckY * 1.6) / 2, 0));
    group.add(box(0.5, 0.05, W * 2.2, concrete, (sign * span) / 2, 0.025, 0));
  }

  return { group, top: deckY + rise + 0.4 };
}

function buildContinuous(bridge, accent, concrete, deckMaterial) {
  const { L, W, deckY, deckT } = metrics(bridge);
  const group = new THREE.Group();
  const girderT = deckT * 1.6;

  group.add(box(L, girderT, W, deckMaterial, 0, deckY, 0));
  addParapets(group, L, W, deckY, girderT, accent);
  addPiers(group, L, W, deckY - girderT * 0.6, concrete, 3, 0.62);

  for (const ratio of [-0.62, 0, 0.62]) {
    group.add(box(L * 0.16, girderT * 0.8, W * 0.9, concrete, ratio * (L / 2), deckY - girderT * 0.75, 0));
  }

  return { group, top: deckY + 0.4 };
}

function buildCable(bridge, accent, concrete, deckMaterial) {
  const { L, W, deckY, deckT } = metrics(bridge);
  const group = new THREE.Group();
  group.add(box(L, deckT, W, deckMaterial, 0, deckY, 0));
  addParapets(group, L, W, deckY, deckT, accent);

  // 环形主塔：真实桥是"柳州之门"，圆环平面垂直于行车方向
  const radius = 0.9 + L * 0.22;
  const centerY = deckY + radius + 0.05;
  const ring = new THREE.Mesh(
    new THREE.TorusGeometry(radius, 0.05 + L * 0.012, 8, 32),
    accent
  );
  ring.position.set(0, centerY, 0);
  ring.rotation.y = Math.PI / 2;
  group.add(ring);

  const targets = [-0.86, -0.66, -0.46, -0.24, 0.24, 0.46, 0.66, 0.86];
  targets.forEach((ratio, index) => {
    const angle = Math.PI * 0.3 + (index / targets.length) * Math.PI * 0.42;
    for (const side of [-1, 1]) {
      const ringPoint = new THREE.Vector3(
        0,
        centerY + Math.sin(angle) * radius * 0.94,
        side * Math.cos(angle) * radius * 0.94
      );
      const deckPoint = new THREE.Vector3(ratio * (L / 2), deckY + deckT / 2, side * (W / 2 - 0.02));
      group.add(rodBetween(ringPoint, deckPoint, 0.012 + L * 0.002, accent));
    }
  });

  addPiers(group, L, W, deckY, concrete, 2, 0.72);
  return { group, top: centerY + radius + 0.4 };
}

function buildPavilion(bridge, accent, concrete, deckMaterial) {
  const { L, W, deckY, deckT } = metrics(bridge);
  const group = new THREE.Group();
  group.add(box(L, deckT, W, deckMaterial, 0, deckY, 0));

  const pavilionHeight = 0.28 + L * 0.03;
  const roofWidth = Math.max(W * 1.9, 0.7);
  for (let i = 0; i < 5; i += 1) {
    const x = (i / 4 - 0.5) * L * 0.78;
    for (const dx of [-roofWidth * 0.3, roofWidth * 0.3]) {
      for (const dz of [-W * 0.34, W * 0.34]) {
        group.add(box(0.025, pavilionHeight, 0.025, concrete, x + dx, deckY + pavilionHeight / 2, dz));
      }
    }
    const roof = new THREE.Mesh(pyramidRoof(roofWidth, 0.2 + L * 0.012, roofWidth * 1.08), accent);
    roof.position.set(x, deckY + pavilionHeight + (0.2 + L * 0.012) / 2 - 0.02, 0);
    group.add(roof);
  }

  for (const sign of [-1, 1]) {
    group.add(box(0.04, deckY, W * 1.4, concrete, (sign * L) / 2, deckY / 2, 0));
  }
  addPiers(group, L, W, deckY, concrete, 2, 0.5);
  return { group, top: deckY + pavilionHeight + 0.5 };
}

const BUILDERS = {
  girder: buildGirder,
  arch: buildArch,
  continuous: buildContinuous,
  cable: buildCable,
  pavilion: buildPavilion
};

/* ------------------------------------------------------------------ *
 * 建筑
 * ------------------------------------------------------------------ */

function buildLabBuilding() {
  const group = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: COLOR.lab, roughness: 0.7 });
  const glow = new THREE.MeshStandardMaterial({
    color: COLOR.glow,
    emissive: new THREE.Color(COLOR.glow),
    emissiveIntensity: 0.85,
    roughness: 0.4
  });
  const trim = new THREE.MeshStandardMaterial({ color: 0x9fd8e0, roughness: 0.5, metalness: 0.3 });

  group.add(box(1.8, 0.95, 1.4, body, 0, 0.475, 0));
  const roof = new THREE.Mesh(pyramidRoof(2.0, 0.55, 1.6), trim);
  roof.position.set(0, 1.22, 0);
  group.add(roof);

  for (const z of [-0.71, 0.71]) {
    for (const x of [-0.52, 0, 0.52]) {
      group.add(box(0.3, 0.2, 0.03, glow, x, 0.68, z));
    }
  }
  group.add(box(0.4, 0.52, 0.04, glow, 0, 0.26, 0.71));

  return { group, top: 1.8 };
}

function buildArchiveBuilding() {
  const group = new THREE.Group();
  const body = new THREE.MeshStandardMaterial({ color: COLOR.archive, roughness: 0.75 });
  const trim = new THREE.MeshStandardMaterial({ color: 0xcbbfe0, roughness: 0.55 });
  const glow = new THREE.MeshStandardMaterial({
    color: COLOR.glow,
    emissive: new THREE.Color(COLOR.glow),
    emissiveIntensity: 0.7,
    roughness: 0.45
  });

  group.add(box(1.45, 0.8, 1.45, body, 0, 0.4, 0));
  const roof = new THREE.Mesh(pyramidRoof(1.75, 0.72, 1.75), trim);
  roof.position.set(0, 1.16, 0);
  group.add(roof);

  for (const dx of [-0.58, 0.58]) {
    for (const dz of [-0.7, 0.7]) {
      group.add(cylinder(0.055, 0.8, trim, dx, 0.4, dz, 10));
    }
  }
  group.add(box(1.56, 0.09, 0.08, trim, 0, 0.82, 0.7));
  group.add(box(0.35, 0.48, 0.04, glow, 0, 0.24, 0.73));

  return { group, top: 1.9 };
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

  const viewWindow = GEO.window;
  const centerX = (viewWindow.minX + viewWindow.maxX) / 2;
  const centerZ = (viewWindow.minZ + viewWindow.maxZ) / 2;
  const width = viewWindow.maxX - viewWindow.minX;
  const depth = viewWindow.maxZ - viewWindow.minZ;

  const concrete = new THREE.MeshStandardMaterial({ color: COLOR.concrete, roughness: 0.9 });
  const deckMaterial = new THREE.MeshStandardMaterial({ color: COLOR.deck, roughness: 0.8 });

  // 地面（比取景窗口大一圈，配合雾气把边缘藏起来）
  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(width + GROUND_MARGIN * 2, depth + GROUND_MARGIN * 2),
    new THREE.MeshStandardMaterial({ color: COLOR.ground, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.set(centerX, -0.06, centerZ);
  root.add(ground);

  // 河道：真实折线 → 平滑曲线 → 水面与江岸
  const halfWidth = GEO.riverHalfWidth;
  const curves = GEO.rivers.map((line) => curveFromPolyline(line));

  const waterMaterial = new THREE.MeshStandardMaterial({
    color: COLOR.water,
    roughness: 0.22,
    metalness: 0.4,
    side: THREE.DoubleSide
  });
  const bankMaterial = new THREE.MeshStandardMaterial({
    color: COLOR.bank,
    roughness: 0.95,
    side: THREE.DoubleSide
  });
  const edgeMaterial = new THREE.MeshStandardMaterial({
    color: COLOR.bankEdge,
    roughness: 0.85,
    side: THREE.DoubleSide
  });

  for (const curve of curves) {
    const segments = Math.max(120, Math.round(curve.getLength() * 6));
    root.add(new THREE.Mesh(riverSurface(curve, halfWidth, 0.04, segments), waterMaterial));
    for (const side of [1, -1]) {
      // 两岸分层抬高一点点：壶城发卡弯内侧两条岸带会重叠，共面会闪（z-fighting）
      const lift = side > 0 ? 0 : 0.002;
      root.add(
        new THREE.Mesh(
          bandAlongCurve(curve, side * halfWidth, side * (halfWidth + BANK_WIDTH), 0.02 + lift, segments),
          bankMaterial
        )
      );
      root.add(
        new THREE.Mesh(
          bandAlongCurve(curve, side * halfWidth, side * (halfWidth + 1.1), 0.05 + lift, segments),
          edgeMaterial
        )
      );
    }
  }

  // 五座桥：真实位置与朝向
  for (const geoBridge of GEO.bridges) {
    const meta = BRIDGES.find((item) => item.id === geoBridge.id);
    if (!meta) continue;

    const accent = new THREE.MeshStandardMaterial({
      color: new THREE.Color(meta.accent),
      emissive: new THREE.Color(meta.accent),
      emissiveIntensity: 0.12,
      roughness: 0.55,
      metalness: 0.12
    });

    const build = BUILDERS[meta.model] || buildGirder;
    const model = build(geoBridge, accent, concrete, deckMaterial);

    const group = new THREE.Group();
    group.add(model.group);
    group.position.set(geoBridge.x, 0, geoBridge.z);
    group.rotation.y = geoBridge.angle;
    group.userData.pick = { type: "bridge", id: meta.id };

    // 拾取代理：让 3 单位的桥在总览里也能被点中
    const proxy = new THREE.Mesh(
      new THREE.BoxGeometry(Math.max(geoBridge.length, 3) + 2, 3.2, Math.max(geoBridge.width, 1.2) + 2),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    proxy.position.y = 1.2;
    group.add(proxy);

    // 光标记：总览里指示桥梁位置
    const markerSize = 0.55 + geoBridge.length * 0.06;
    const marker = new THREE.Mesh(
      new THREE.RingGeometry(markerSize, markerSize * 1.18, 40),
      new THREE.MeshBasicMaterial({
        color: new THREE.Color(meta.accent),
        transparent: true,
        opacity: 0.32,
        side: THREE.DoubleSide,
        depthWrite: false
      })
    );
    marker.rotation.x = -Math.PI / 2;
    marker.position.y = 0.06;
    group.add(marker);

    root.add(group);
    pickables.push(group);
    bridges.set(meta.id, {
      group,
      accent,
      marker,
      top: model.top,
      labelAnchor: new THREE.Vector3(geoBridge.x, model.top + 0.5, geoBridge.z)
    });

    labelItems.push({
      key: `bridge:${meta.id}`,
      type: "bridge",
      id: meta.id,
      text: meta.name,
      sub: `${geoBridge.length}×${geoBridge.width} 单位`,
      accent: meta.accent,
      position: new THREE.Vector3(geoBridge.x, model.top + 0.8, geoBridge.z)
    });
  }
  // 标签副标题改用更友好的说法
  for (const item of labelItems) {
    if (item.type !== "bridge") continue;
    const meta = BRIDGES.find((entry) => entry.id === item.id);
    if (meta) item.sub = `${meta.year} · ${meta.type}`;
  }

  // 两栋建筑：落在江湾内的陆地上
  const buildingSpecs = [
    {
      id: "lab",
      builder: buildLabBuilding,
      name: "桥梁结构实验室",
      sub: "力流 · 拆解 · 荷载",
      accent: "#9fd8e0",
      preferred: [
        [-13, 4],
        [-16, -2],
        [-10, 8],
        [-18, 10]
      ]
    },
    {
      id: "archive",
      builder: buildArchiveBuilding,
      name: "桥梁档案馆",
      sub: "档案 · 知识挑战",
      accent: "#cbbfe0",
      preferred: [
        [-9, 24],
        [-12, 28],
        [-6, 20],
        [-15, 20]
      ]
    }
  ];

  for (const spec of buildingSpecs) {
    const usable = spec.preferred.filter(
      ([x, z]) =>
        x > viewWindow.minX + 3 &&
        x < viewWindow.maxX - 3 &&
        z > viewWindow.minZ + 3 &&
        z < viewWindow.maxZ - 3 &&
        distanceToRivers(x, z, GEO.rivers) > halfWidth + BANK_WIDTH * 0.55 &&
        GEO.bridges.every((bridge) => Math.hypot(bridge.x - x, bridge.z - z) > 2.5)
    );
    const spot = usable[0] || spec.preferred[0];

    const model = spec.builder();
    const group = new THREE.Group();
    group.add(model.group);
    group.position.set(spot[0], 0, spot[1]);
    group.rotation.y = Math.atan2(-spec.preferred[0][1], spec.preferred[0][0]) * 0;
    group.userData.pick = { type: "building", id: spec.id };

    const proxy = new THREE.Mesh(
      new THREE.BoxGeometry(3.4, 3.2, 3.4),
      new THREE.MeshBasicMaterial({ visible: false })
    );
    proxy.position.y = 1.4;
    group.add(proxy);

    root.add(group);
    pickables.push(group);
    buildings.set(spec.id, { group, top: model.top });

    labelItems.push({
      key: `building:${spec.id}`,
      type: "building",
      id: spec.id,
      text: spec.name,
      sub: spec.sub,
      accent: spec.accent,
      position: new THREE.Vector3(spot[0], model.top + 0.7, spot[1])
    });
  }

  // 城市街区：只在陆地上生长，避让河道、桥梁与建筑
  const random = createRandom();
  const blockMaterials = [
    new THREE.MeshStandardMaterial({ color: COLOR.blockA, roughness: 0.9 }),
    new THREE.MeshStandardMaterial({ color: COLOR.blockB, roughness: 0.9 })
  ];

  let placed = 0;
  let attempts = 0;
  while (placed < CITY_BLOCKS && attempts < CITY_BLOCKS * 30) {
    attempts += 1;
    const x = viewWindow.minX + 1 + random() * (width - 2);
    const z = viewWindow.minZ + 1 + random() * (depth - 2);
    if (distanceToRivers(x, z, GEO.rivers) < halfWidth + 2.4) continue;

    let blocked = false;
    for (const bridge of GEO.bridges) {
      if (Math.hypot(bridge.x - x, bridge.z - z) < Math.max(bridge.length, 3) * 0.6 + 1.6) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;
    for (const entry of buildings.values()) {
      if (Math.hypot(entry.group.position.x - x, entry.group.position.z - z) < 3.4) {
        blocked = true;
        break;
      }
    }
    if (blocked) continue;

    const blockWidth = 0.8 + random() * 1.8;
    const blockDepth = 0.8 + random() * 1.7;
    const height = 0.15 + random() * 0.75;
    const block = box(
      blockWidth,
      height,
      blockDepth,
      blockMaterials[placed % 2],
      x,
      height / 2 + 0.02,
      z
    );
    block.rotation.y = random() * Math.PI;
    root.add(block);
    placed += 1;
  }

  /* 选中与悬停 */

  let selection = { view: "atlas", bridgeId: null };
  let hoveredKey = null;

  function emphasisFor(id) {
    const key = `bridge:${id}`;
    const selected = selection.view === "bridge" && selection.bridgeId === id;
    const dimmed = selection.view === "bridge" && selection.bridgeId !== id;
    if (selected) return { scale: 1.16, lift: 0.12, glow: 0.85, ring: 0.95 };
    if (hoveredKey === key) return { scale: 1.08, lift: 0.05, glow: 0.6, ring: 0.7 };
    if (dimmed) return { scale: 1, lift: 0, glow: 0.02, ring: 0.08 };
    return { scale: 1, lift: 0, glow: 0.12, ring: 0.32 };
  }

  function apply() {
    for (const [id, entry] of bridges) {
      const emphasis = emphasisFor(id);
      entry.group.scale.setScalar(emphasis.scale);
      entry.group.position.y = emphasis.lift;
      entry.accent.emissiveIntensity = emphasis.glow;
      entry.marker.material.opacity = emphasis.ring;
    }
    for (const [id, entry] of buildings) {
      const active = hoveredKey === `building:${id}`;
      entry.group.scale.setScalar(active ? 1.1 : 1);
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
    curves,
    cityBlocks: placed,
    center: { x: centerX, z: centerZ },
    window: viewWindow,
    setSelection,
    setHover,
    get hovered() {
      return hoveredKey;
    }
  };
}
