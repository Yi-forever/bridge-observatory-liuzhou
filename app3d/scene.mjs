/**
 * 场景编排（M1）：渲染器、轨道镜头、拾取、标签、聚焦。
 *
 * 镜头是"自由轨道"：
 *   - 方位角：**无限**（可以绕一圈转到任何一侧，指针拖多远转多远）
 *   - 俯仰角：8.6°～86.6° 仰角（限制在水平面以上，见下）
 *   - 距离：4～420（足够近看单桥构件，也足够远看整条江湾）
 *   - 缩放：**以光标下的世界点为不动点**，不是绕屏幕中心（见 onWheel）
 * 不做平移（不用右键/中键拖），避免把场景拖出屏幕。
 *
 * 为什么俯角有下限：相机降到与地面持平以下会钻到地形底部——
 * 地面是单面平面，从下面看会直接看穿，露出镜像的场景，视觉上就是坏的。
 * 所以下限定在水平面以上 8.6°，这已经是很低的地平线视角了。
 */

import * as THREE from "../vendor/three/three.module.min.js";
import { buildAtlas } from "./atlas.mjs";
import { createLabels } from "./labels.mjs";
import { getTheme } from "./theme.mjs";

const TAU = Math.PI * 2;

/** 阴影贴图边长。4096 在取景窗口上约 4 米/纹素；低端机可降到 2048。 */
const SHADOW_MAP_SIZE = 4096;

/** 阴影相机覆盖半径（世界单位）：足够罩住 54×96 的取景窗口，又不至于让纹素变粗。 */
const SHADOW_SPAN = 84;

/** 取景窗口中心的近似值，阴影相机与太阳目标都朝这里对齐。 */
const SCENE_FOCUS = { x: -7, z: -4 };

const HOME = {
  azimuth: 0,
  polar: 0.6,
  distance: 150
};

const LIMITS = {
  polarMin: 0.06,
  polarMax: 1.42,
  distanceMin: 4,
  distanceMax: 420
};

/** 聚焦距离：真实桥只有 3–7 个单位长，必须拉近才看得清结构。 */
const FOCUS = {
  bridge: 9,
  /** 实验室：比单桥资料卡再近一点，构件才看得清。 */
  lab: 7.5,
  building: 14
};

const CLICK_THRESHOLD = 6;

/**
 * 力流演示的教学顺序：桥面 → 中间承重构件 → 墩 / 座 / 基础。
 *
 * 这不是严格的力学路径（连续体系里荷载是多跨共同分担的），
 * 而是 2D 章节里"桥面 → 吊杆 → 拱肋 → 拱座"那条讲解线的 3D 版。
 * 构件 id 必须与 app3d/bridges.data.mjs 的 parts[].id 对得上，测试会校验。
 */
export const FORCE_FLOW = {
  liujiang: ["deck", "girder", "pier", "foundation"],
  wenhui: ["deck", "hanger", "arch", "abutment"],
  wenchang: ["deck", "box-girder", "pier", "bearing"],
  baisha: ["deck", "cable", "ring", "anchor"],
  fenghuangling: ["deck", "gallery", "pavilion", "pier"]
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/** 把 from 旋到与 to 等价但路径最短的角度，避免复位时连转好几圈。 */
function shortestAngle(from, to) {
  let delta = (to - from) % TAU;
  if (delta > Math.PI) delta -= TAU;
  if (delta < -Math.PI) delta += TAU;
  return from + delta;
}

/** 把主题里的三档天色画成一张竖向渐变贴图，按等距圆柱映射当天空用。 */
function skyTexture(theme) {
  const canvas = document.createElement("canvas");
  canvas.width = 4;
  canvas.height = 256;
  const context = canvas.getContext("2d");
  const gradient = context.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, theme.sky.zenith);
  gradient.addColorStop(0.44, theme.sky.horizon);
  gradient.addColorStop(0.56, theme.sky.horizon);
  gradient.addColorStop(1, theme.sky.ground);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);

  const texture = new THREE.CanvasTexture(canvas);
  texture.mapping = THREE.EquirectangularReflectionMapping;
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

export async function createScene({ canvas, labelLayer, onPick, onPartFocus }) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  const theme = getTheme();

  const scene = new THREE.Scene();
  const sky = skyTexture(theme);
  scene.background = sky;
  // 同一张天色也当环境贴图：亮场景里水面没有反射会像塑料片，
  // 不引入任何外部图片，用天空自身就够了。
  scene.environment = sky;
  scene.fog = new THREE.Fog(theme.fog.color, theme.fog.near, theme.fog.far);

  // near 必须贴着真实的最近距离：镜头最近只能到 4 单位（LIMITS.distanceMin），
  // 原先的 0.05 比实际需要近了 80 倍，白白耗掉深度精度——河道分层只有 0.002–0.02 的
  // 间距，在默认视角下（分辨率 0.027 单位）根本分不开，于是逐帧争抢深度、缝隙闪烁。
  // 抬到 0.4 后精度提升约 8 倍，且没有几何会近到这个距离。
  const camera = new THREE.PerspectiveCamera(45, 1, 0.4, 2600);

  const hemi = new THREE.HemisphereLight(
    theme.lights.hemiSky,
    theme.lights.hemiGround,
    theme.lights.hemiIntensity
  );
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(theme.lights.sunColor, theme.lights.sunIntensity);
  sun.position.set(
    theme.lights.sunPosition.x,
    theme.lights.sunPosition.y,
    theme.lights.sunPosition.z
  );
  // 阴影相机只罩住取景窗口那一片。这是唯一有内容的区域：
  // 若按 4 km 的地面来罩，每个纹素会粗到十几米，桥的影子糊成一团。
  // 光照与几何都是静态的，阴影相机也固定不动，所以不存在阴影随镜头爬行的问题。
  sun.castShadow = true;
  const shadowSize = Math.min(SHADOW_MAP_SIZE, renderer.capabilities.maxTextureSize);
  sun.shadow.mapSize.set(shadowSize, shadowSize);
  const shadowCamera = sun.shadow.camera;
  shadowCamera.left = -SHADOW_SPAN;
  shadowCamera.right = SHADOW_SPAN;
  shadowCamera.top = SHADOW_SPAN;
  shadowCamera.bottom = -SHADOW_SPAN;
  shadowCamera.near = 40;
  shadowCamera.far = 620;
  shadowCamera.updateProjectionMatrix();
  sun.shadow.bias = -0.0005;
  sun.shadow.normalBias = 0.06;
  sun.target.position.set(SCENE_FOCUS.x, 0, SCENE_FOCUS.z);
  scene.add(sun.target);
  scene.add(sun);
  const fill = new THREE.DirectionalLight(theme.lights.fillColor, theme.lights.fillIntensity);
  fill.position.set(
    theme.lights.fillPosition.x,
    theme.lights.fillPosition.y,
    theme.lights.fillPosition.z
  );
  scene.add(fill);

  const atlas = buildAtlas({ theme: theme.id });
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

  /* ---------------- 力流演示（mode = force） ---------------- */

  // 顺序表在模块级 FORCE_FLOW（测试要校验其中的构件 id）
  /** 每一步停留时间（秒）。慢一点才看得清，也方便讲解时停顿。 */
  const FORCE_STEP_SECONDS = 1.6;

  let force = { bridgeId: null, order: [], index: -1, elapsed: 0 };

  function stopForce() {
    if (force.bridgeId) atlas.clearPartHighlight();
    force = { bridgeId: null, order: [], index: -1, elapsed: 0 };
    if (onPartFocus) onPartFocus(null, null, null);
  }

  function startForce(bridgeId) {
    const order = FORCE_FLOW[bridgeId];
    if (!order || order.length === 0) {
      stopForce();
      return;
    }
    force = { bridgeId, order, index: -1, elapsed: FORCE_STEP_SECONDS };
  }

  function stepForce() {
    force.index = (force.index + 1) % force.order.length;
    const partId = force.order[force.index];
    const hit = atlas.highlightPart(force.bridgeId, partId, "force");
    if (onPartFocus) {
      onPartFocus(force.bridgeId, hit ? partId : null, hit ? hit.label : null);
    }
  }

  /**
   * 手动定位到力流第 index 步（实验室用）。
   * index 为空/-1 时只清高亮，不启动定时器。
   */
  function setForceStep(bridgeId, index) {
    const order = FORCE_FLOW[bridgeId];
    if (!bridgeId || !order || !Number.isInteger(index) || index < 0 || index >= order.length) {
      atlas.clearPartHighlight();
      if (onPartFocus) onPartFocus(null, null, null);
      return null;
    }
    const partId = order[index];
    const hit = atlas.highlightPart(bridgeId, partId, "force");
    if (onPartFocus) onPartFocus(bridgeId, hit ? partId : null, hit ? hit.label : null);
    return hit ? partId : null;
  }

  function updateForce(delta) {
    if (!force.bridgeId) return;
    force.elapsed += delta;
    if (force.elapsed < FORCE_STEP_SECONDS) return;
    force.elapsed = 0;
    stepForce();
  }

  const raycaster = new THREE.Raycaster();
  const pointer = new THREE.Vector2();
  const zoomPointer = new THREE.Vector2();
  const zoomPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
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
    // 选最短路回去，不然转过几圈之后复位会原地狂转
    controls.goalAzimuth = shortestAngle(controls.goalAzimuth, HOME.azimuth);
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

    // 两趟：先找构件，再退回桥/建筑。
    // 桥外面套着一层不可见的拾取代理盒，它永远比真实构件近——
    // 如果只取最近的一个命中，永远点不到"拱肋"这一级。
    let fallback = null;
    for (const hit of hits) {
      if (hit.object.userData && hit.object.userData.noPick) continue; // 高亮幽灵不参与拾取
      let node = hit.object;
      while (node) {
        const pick = node.userData && node.userData.pick;
        if (pick) {
          if (pick.type === "part") return pick;
          if (!fallback) fallback = pick;
          break;
        }
        node = node.parent;
      }
    }
    return fallback;
  }

  /**
   * 光标正下方那个世界点的坐标。
   * 先打真实几何（地面、江面、桥、楼），打不中再落到 y=0 平面上；
   * 视线指向天空时返回 null，此时退化为绕轨道中心缩放。
   */
  function pointUnderPointer(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return null;
    zoomPointer.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    zoomPointer.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(zoomPointer, camera);

    const hits = raycaster.intersectObject(atlas.root, true);
    for (const hit of hits) {
      // 跳过不可见的拾取代理，它们不是真实表面
      if (hit.object.material && hit.object.material.visible === false) continue;
      if (hit.point.distanceTo(camera.position) > 1500) continue;
      return hit.point.clone();
    }

    const fallback = new THREE.Vector3();
    if (raycaster.ray.intersectPlane(zoomPlane, fallback)) {
      if (fallback.distanceTo(camera.position) <= 1500) return fallback;
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
    const key = hit
      ? hit.type === "part"
        ? `part:${hit.id}:${hit.partId}`
        : `${hit.type}:${hit.id}`
      : null;
    atlas.setHover(key);
    canvas.style.cursor = key ? "pointer" : "grab";
  }

  /* ---------------- 指针事件 ---------------- */

  /** 正在按下的指针（双指捏合要靠它算两指距离）。 */
  const activePointers = new Map();
  let pinch = null;

  function pointerSpread() {
    const points = [...activePointers.values()];
    if (points.length < 2) return null;
    return {
      distance: Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y),
      midX: (points[0].x + points[1].x) / 2,
      midY: (points[0].y + points[1].y) / 2
    };
  }

  function onPointerDown(event) {
    dragging = true;
    dragDistance = 0;
    lastX = event.clientX;
    lastY = event.clientY;
    activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (activePointers.size === 2) {
      const spread = pointerSpread();
      if (spread && spread.distance > 0) {
        // 双指一旦开始捏合，就以两指中点下方的世界点为不动点
        pinch = {
          distance: spread.distance,
          anchor: pointUnderPointer(spread.midX, spread.midY)
        };
        dragDistance = CLICK_THRESHOLD; // 捏合不算点击，别在松手时触发拾取
      }
    }
    try {
      canvas.setPointerCapture(event.pointerId);
    } catch {
      /* 忽略：部分浏览器在合成事件上不支持捕获 */
    }
    canvas.style.cursor = "grabbing";
  }

  function onPointerMove(event) {
    if (activePointers.has(event.pointerId)) {
      activePointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    }

    // 双指捏合优先于旋转
    if (pinch && activePointers.size >= 2) {
      const spread = pointerSpread();
      if (spread && spread.distance > 1) {
        if (!pinch.anchor) pinch.anchor = pointUnderPointer(spread.midX, spread.midY);
        zoomBy(pinch.distance / spread.distance, pinch.anchor);
        pinch.distance = spread.distance;
        dragDistance = CLICK_THRESHOLD;
      }
      return;
    }

    if (dragging) {
      const dx = event.clientX - lastX;
      const dy = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;
      dragDistance += Math.abs(dx) + Math.abs(dy);
      // 方位角不设限：想从哪一侧看就转到哪一侧
      controls.goalAzimuth -= dx * 0.0045;
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
    activePointers.delete(event.pointerId);
    if (activePointers.size < 2) pinch = null;
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

  /**
   * 按比例缩放，anchor 是屏幕不动点的世界坐标。
   *
   * 以该点为不动点缩放：目标点 T ← A + (T - A)·scale，
   * 于是相机 C ← A + (C - A)·scale，即相机沿"锚点→相机"这条线移动，
   * 视线方向不变，因此锚点在屏幕上分毫不动。
   * 滚轮与双指捏合共用这一套。
   */
  function zoomBy(scale, anchor) {
    const nextDistance = clamp(
      controls.goalDistance * scale,
      LIMITS.distanceMin,
      LIMITS.distanceMax
    );
    const realScale = nextDistance / controls.goalDistance;
    if (realScale === 1) return;
    if (anchor) controls.goalTarget.sub(anchor).multiplyScalar(realScale).add(anchor);
    controls.goalDistance = nextDistance;
  }

  function onWheel(event) {
    event.preventDefault();
    // 乘法缩放：近处步长细、远处步长粗。线性缩放在 4～420 这个跨度里
    // 会变成"远处滚半天不动、近处一下就撞墙"。
    zoomBy(Math.pow(1.0022, event.deltaY), pointUnderPointer(event.clientX, event.clientY));
  }

  /**
   * 键盘镜头。画布带 tabindex="0"，聚焦后可用：
   *   方向键 环视 / +/- 缩放 / Home 复位。
   * 与鼠标一样走 goal*，由阻尼动画负责过渡。
   */
  function onKeyDown(event) {
    const step = 0.12;
    const polarStep = 0.06;
    let handled = true;
    switch (event.key) {
      case "ArrowLeft":
      case "a":
      case "A":
        controls.goalAzimuth -= step;
        break;
      case "ArrowRight":
      case "d":
      case "D":
        controls.goalAzimuth += step;
        break;
      case "ArrowUp":
      case "w":
      case "W":
        controls.goalPolar = clamp(controls.goalPolar - polarStep, LIMITS.polarMin, LIMITS.polarMax);
        break;
      case "ArrowDown":
      case "s":
      case "S":
        controls.goalPolar = clamp(controls.goalPolar + polarStep, LIMITS.polarMin, LIMITS.polarMax);
        break;
      case "+":
      case "=":
      case "PageUp":
        zoomBy(0.86, null);
        break;
      case "-":
      case "_":
      case "PageDown":
        zoomBy(1.16, null);
        break;
      case "Home":
        resetView();
        break;
      default:
        handled = false;
    }
    if (handled) event.preventDefault();
  }

  canvas.addEventListener("pointerdown", onPointerDown);
  canvas.addEventListener("keydown", onKeyDown);
  canvas.addEventListener("pointermove", onPointerMove);
  canvas.addEventListener("pointerup", onPointerUp);
  canvas.addEventListener("pointercancel", onPointerUp);
  canvas.addEventListener("pointerleave", onPointerLeave);
  canvas.addEventListener("wheel", onWheel, { passive: false });
  canvas.style.cursor = "grab";

  /* ---------------- 状态 ---------------- */

  function setState(state) {
    // 实验室：镜头拉近到实验桥，力流由侧栏手动步进
    if (state.view === "lab" && state.bridgeId) {
      stopForce();
      const entry = atlas.bridges.get(state.bridgeId);
      if (entry) {
        focusOn(
          { x: entry.labelAnchor.x, y: 0.35, z: entry.labelAnchor.z },
          FOCUS.lab
        );
        labels?.setActive(`bridge:${state.bridgeId}`);
      }
      setForceStep(state.bridgeId, Number.isInteger(state.step) ? state.step : -1);
      atlas.setExploded(state.exploded ? state.bridgeId : null);
      atlas.setSelection({ view: "bridge", bridgeId: state.bridgeId });
      return;
    }

    // 受力演示：只在单桥视图、且 mode === "force" 时跑
    const wantForce = state.mode === "force" && state.view === "bridge" ? state.bridgeId : null;
    if (wantForce) {
      if (force.bridgeId !== wantForce) {
        stopForce();
        startForce(wantForce);
      }
    } else if (force.bridgeId) {
      stopForce();
    }

    // 分层拆解：爆炸视图只对单桥
    atlas.setExploded(state.exploded && state.view === "bridge" ? state.bridgeId : null);

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

  let lastFrameTime = 0;

  function frame(now = 0) {
    const delta = lastFrameTime ? Math.min(0.1, (now - lastFrameTime) / 1000) : 0;
    lastFrameTime = now;

    updateCamera();
    updateHover();
    updateForce(delta);
    atlas.updateExplode(0.16);
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
  canvas.removeEventListener("keydown", onKeyDown);
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
    /** 手动定位力流步骤（实验室用）；返回命中的构件 id。 */
    setForceStep,
    /** 某座桥的力流顺序（构件 id 数组），实验室用它排步骤。 */
    forceFlow: (bridgeId) => (FORCE_FLOW[bridgeId] ? [...FORCE_FLOW[bridgeId]] : []),
    /** 把镜头对准某座桥（实验室/档案深链用）。 */
    focusBridge: (bridgeId) => {
      const entry = atlas.bridges.get(bridgeId);
      if (!entry) return false;
      focusOn({ x: entry.labelAnchor.x, y: 0.35, z: entry.labelAnchor.z }, FOCUS.lab);
      labels?.setActive(`bridge:${bridgeId}`);
      return true;
    },
    /** 把镜头对准某栋场馆。 */
    focusBuilding: (id) => {
      const entry = atlas.buildings.get(id);
      if (!entry) return false;
      focusOn({ x: entry.group.position.x, y: 0.6, z: entry.group.position.z }, FOCUS.building);
      return true;
    },
    /** 手动开始/结束受力演示；传 null 结束。 */
    setForceFlow: (bridgeId) => {
      stopForce();
      if (bridgeId) startForce(bridgeId);
    },
    /** 高亮某个构件；返回 { id, label } 或 null。 */
    highlightPart: (bridgeId, partId) => atlas.highlightPart(bridgeId, partId),
    clearPartHighlight: () => atlas.clearPartHighlight(),
    /** 该桥建了哪些构件（资料卡据此决定哪几行可以高亮）。 */
    getPartIds: (bridgeId) => {
      const entry = atlas.bridges.get(bridgeId);
      if (!entry || !entry.parts) return [];
      return [...entry.parts.keys()];
    },
    revision: String(THREE.REVISION)
  };
}
