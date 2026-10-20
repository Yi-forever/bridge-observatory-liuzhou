/**
 * 场景编排（M1）：渲染器、受约束的镜头、拾取、标签、聚焦。
 *
 * 镜头刻意做成"受限轨道"而不是自由飞行：
 *   方位角 ±36°、俯角 31°–59°、距离 50–108，禁止平移。
 * 目的是让用户始终看得懂"我在城市的哪一侧"，并随时可一键复位。
 */

import * as THREE from "../vendor/three/three.module.min.js";
import { buildAtlas } from "./atlas.mjs";
import { createLabels } from "./labels.mjs";

const HOME = {
  azimuth: 0,
  polar: 0.6,
  distance: 150
};

const LIMITS = {
  azimuth: 0.8,
  polarMin: 0.34,
  polarMax: 1.05,
  distanceMin: 60,
  distanceMax: 320
};

/** 聚焦距离：真实桥只有 3–7 个单位长，必须拉近才看得清结构。 */
const FOCUS = {
  bridge: 9,
  building: 14
};

const CLICK_THRESHOLD = 6;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export async function createScene({ canvas, labelLayer, onPick }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x071a22);
  scene.fog = new THREE.Fog(0x071a22, 210, 640);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.05, 2600);

  scene.add(new THREE.HemisphereLight(0x9fd8e0, 0x08161c, 0.9));
  const sun = new THREE.DirectionalLight(0xffd9b0, 1.15);
  sun.position.set(120, 190, 90);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0x5f9fb0, 0.35);
  fill.position.set(-110, 70, -90);
  scene.add(fill);

  const atlas = buildAtlas();
  scene.add(atlas.root);

  const homeTarget = new THREE.Vector3(atlas.center.x, 0, atlas.center.z);

  const labels = labelLayer
    ? createLabels(labelLayer, atlas.labels, {
        onSelect: (pick) => onPick && onPick(pick)
      })
    : null;

  const controls = {
    azimuth: HOME.azimuth,
    polar: HOME.polar,
    distance: HOME.distance,
    goalAzimuth: HOME.azimuth,
    goalPolar: HOME.polar,
    goalDistance: HOME.distance,
    target: homeTarget.clone(),
    goalTarget: homeTarget.clone()
  };

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  let pointerInside = false;
  let pointerDirty = false;

  let dragging = false;
  let dragDistance = 0;
  let lastX = 0;
  let lastY = 0;

  /* ---------------- 镜头 ---------------- */

  function applyCamera() {
    const sinPolar = Math.sin(controls.polar);
    camera.position.set(
      controls.target.x + controls.distance * sinPolar * Math.sin(controls.azimuth),
      controls.target.y + controls.distance * Math.cos(controls.polar),
      controls.target.z + controls.distance * sinPolar * Math.cos(controls.azimuth)
    );
    camera.lookAt(controls.target);
  }

  function updateCamera(damping = 0.14) {
    controls.azimuth += (controls.goalAzimuth - controls.azimuth) * damping;
    controls.polar += (controls.goalPolar - controls.polar) * damping;
    controls.distance += (controls.goalDistance - controls.distance) * damping;
    controls.target.lerp(controls.goalTarget, damping);
    applyCamera();
  }

  function focusOn(point, distance) {
    controls.goalTarget.set(point.x, point.y || 0, point.z);
    controls.goalDistance = clamp(distance, LIMITS.distanceMin, LIMITS.distanceMax);
  }

  function resetView() {
    controls.goalAzimuth = HOME.azimuth;
    controls.goalPolar = HOME.polar;
    controls.goalDistance = HOME.distance;
    controls.goalTarget.copy(homeTarget);
  }

  /* ---------------- 拾取 ---------------- */

  function pickAt(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    pointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    pointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(pointer, camera);
    const hits = raycaster.intersectObjects(atlas.pickables, true);
    for (const hit of hits) {
      let node = hit.object;
      while (node) {
        if (node.userData && node.userData.pick) return node.userData.pick;
        node = node.parent;
      }
    }
    return null;
  }

  function updateHover() {
    if (!pointerDirty || dragging) return;
    pointerDirty = false;
    if (!pointerInside) {
      atlas.setHover(null);
      canvas.style.cursor = "grab";
      return;
    }
    const hit = pickAt(lastX, lastY);
    const key = hit ? `${hit.type}:${hit.id}` : null;
    atlas.setHover(key);
    canvas.style.cursor = key ? "pointer" : "grab";
  }

  /* ---------------- 指针事件 ---------------- */

  function onPointerDown(event) {
    dragging = true;
    dragDistance = 0;
    lastX = event.clientX;
    lastY = event.clientY;
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      /* 忽略：部分浏览器在合成事件上不支持捕获 */
    }
    canvas.style.cursor = "grabbing";
  }

  function onPointerMove(event) {
    if (dragging) {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      dragDistance += Math.abs(dx) + Math.abs(dy);
      controls.goalAzimuth = clamp(
        controls.goalAzimuth - dx * 0.0045,
        -LIMITS.azimuth,
        LIMITS.azimuth
      );
      controls.goalPolar = clamp(
        controls.goalPolar + dy * 0.0035,
        LIMITS.polarMin,
        LIMITS.polarMax
      );
      return;
    }
    lastX = event.clientX;
    lastY = event.clientY;
    pointerInside = true;
    pointerDirty = true;
  }

  function onPointerUp(event) {
    const wasDragging = dragging;
    dragging = false;
    try {
      canvas.releasePointerCapture(event.pointerId);
    } catch {
      /* 忽略 */
    }
    canvas.style.cursor = atlas.hovered ? "pointer" : "grab";
    if (!wasDragging || dragDistance < CLICK_THRESHOLD) {
      const hit = pickAt(event.clientX, event.clientY);
      if (hit && onPick) onPick(hit);
    }
  }

  function onPointerLeave() {
    pointerInside = false;
    pointerDirty = true;
    if (dragging) return;
    atlas.setHover(null);
    canvas.style.cursor = "grab";
  }

  function onWheel(event) {
    event.preventDefault();
    controls.goalDistance = clamp(
      controls.goalDistance + event.deltaY * 0.045,
      LIMITS.distanceMin,
      LIMITS.distanceMax
    );
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.style.cursor = "grab";

  /* ---------------- 状态 ---------------- */

  function setState(state) {
    atlas.setSelection({ view: state.view, bridgeId: state.bridgeId });

    if (state.view === "bridge" && state.bridgeId) {
      const entry = atlas.bridges.get(state.bridgeId);
      if (entry) {
        const anchor = entry.labelAnchor;
        focusOn({ x: anchor.x, y: 0.35, z: anchor.z }, FOCUS.bridge);
      }
      labels?.setActive(`bridge:${state.bridgeId}`);
      return;
    }

    if (state.view === "lab" || state.view === "archive") {
      const entry = atlas.buildings.get(state.view);
      if (entry) {
        focusOn(
          { x: entry.group.position.x, y: 0.6, z: entry.group.position.z },
          FOCUS.building
        );
      }
      labels?.setActive(null);
      return;
    }

    labels?.setActive(null);
    resetView();
  }

  /* ---------------- 渲染循环 ---------------- */

  function resize() {
    const width = canvas.clientWidth || canvas.parentElement?.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || canvas.parentElement?.clientHeight || window.innerHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  let frameHandle = null;
  let running = false;

  function frame() {
    updateCamera();
    updateHover();
    renderer.render(scene, camera);
    if (labels) {
      labels.update(camera, renderer.domElement.clientWidth, renderer.domElement.clientHeight);
    }
    frameHandle = window.requestAnimationFrame(frame);
  }

  function start() {
    if (running) return;
    running = true;
    resize();
    updateCamera(1);
    frame();
  }

  function stop() {
    running = false;
    if (frameHandle !== null) {
      window.cancelAnimationFrame(frameHandle);
      frameHandle = null;
    }
  }

  function dispose() {
    stop();
    window.removeEventListener("resize", resize);
    canvas.removeEventListener("pointerdown", onPointerDown);
    canvas.removeEventListener("pointermove", onPointerMove);
    canvas.removeEventListener("pointerup", onPointerUp);
    canvas.removeEventListener("pointercancel", onPointerUp);
    canvas.removeEventListener("pointerleave", onPointerLeave);
    canvas.removeEventListener("wheel", onWheel);
    labels?.dispose();
    renderer.dispose();
  }

  window.addEventListener("resize", resize);

  return {
    setState,
    start,
    stop,
    resize,
    dispose,
    resetView,
    revision: String(THREE.REVISION)
  };
}
