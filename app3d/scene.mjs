/**
 * M0 占位场景。
 *
 * 这里只验证三件事，不承担 M1 的建模工作：
 *   1. 本地打包的 three.js 能在浏览器中被动态 import；
 *   2. WebGL 渲染循环可跑通、可 resize、可释放；
 *   3. 由 data.mjs 的 map 坐标可以换算成世界坐标并落位。
 *
 * M1 会用真正的河道曲线、地形与五桥低模替换掉这些方块。
 */

import { BRIDGES, ATLAS_SPAN, RIVER_ANGLE } from "./data.mjs";

const THREE_SRC = "../vendor/three/three.module.min.js";

const PALETTE = {
  sky: 0x071a22,
  ground: 0x0d2730,
  water: 0x14505f,
  pier: 0x24343a
};

const CAMERA_HOME = { x: 0.5, y: 46, z: 62, tx: 2.8, ty: 0, tz: 0.4 };

function worldFromMap(map) {
  return {
    x: ((map.x - 50) / 50) * ATLAS_SPAN.width,
    z: ((map.y - 50) / 50) * ATLAS_SPAN.depth
  };
}

/**
 * @param {{ canvas: HTMLCanvasElement }} options
 * @returns {Promise<object>} 场景控制接口
 */
export async function createScene({ canvas }) {
  const THREE = await import(THREE_SRC);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance"
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PALETTE.sky);
  scene.fog = new THREE.Fog(PALETTE.sky, 70, 200);

  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 600);
  camera.position.set(CAMERA_HOME.x, CAMERA_HOME.y, CAMERA_HOME.z);
  camera.lookAt(CAMERA_HOME.tx, CAMERA_HOME.ty, CAMERA_HOME.tz);

  scene.add(new THREE.HemisphereLight(0x9fd8e0, 0x08161c, 0.85));
  const sun = new THREE.DirectionalLight(0xffd9b0, 1.05);
  sun.position.set(46, 70, 28);
  scene.add(sun);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(240, 240),
    new THREE.MeshStandardMaterial({ color: PALETTE.ground, roughness: 1, metalness: 0 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.02;
  scene.add(ground);

  const riverGroup = new THREE.Group();
  riverGroup.position.set(2.8, 0, 0.4);
  riverGroup.rotation.y = RIVER_ANGLE;
  const river = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 26),
    new THREE.MeshStandardMaterial({
      color: PALETTE.water,
      roughness: 0.35,
      metalness: 0.15
    })
  );
  river.rotation.x = -Math.PI / 2;
  river.position.y = 0.02;
  riverGroup.add(river);
  scene.add(riverGroup);

  const bridgeGroup = new THREE.Group();
  scene.add(bridgeGroup);

  const bridgeMeshes = new Map();
  const pierGeometry = new THREE.BoxGeometry(0.8, 1.9, 0.8);
  const pierMaterial = new THREE.MeshStandardMaterial({ color: PALETTE.pier, roughness: 0.9 });

  for (const bridge of BRIDGES) {
    const { x, z } = worldFromMap(bridge.map);
    const accent = new THREE.Color(bridge.accent);
    const deckMaterial = new THREE.MeshStandardMaterial({
      color: accent,
      roughness: 0.55,
      metalness: 0.05,
      emissive: accent.clone(),
      emissiveIntensity: 0.12
    });
    const deck = new THREE.Mesh(new THREE.BoxGeometry(6.6, 1.15, 2.1), deckMaterial);
    deck.position.set(x, 0.9, z);
    deck.rotation.y = RIVER_ANGLE;
    deck.userData.bridgeId = bridge.id;

    for (const offset of [-2.2, 2.2]) {
      const pier = new THREE.Mesh(pierGeometry, pierMaterial);
      pier.position.set(offset, -0.55, 0);
      deck.add(pier);
    }

    bridgeGroup.add(deck);
    bridgeMeshes.set(bridge.id, deck);
  }

  function setState({ view, bridgeId }) {
    const focus = view === "bridge" ? bridgeId : null;
    for (const [id, mesh] of bridgeMeshes) {
      const active = focus === id;
      const dimmed = Boolean(focus) && !active;
      mesh.material.emissiveIntensity = active ? 0.65 : dimmed ? 0.04 : 0.12;
      mesh.scale.setScalar(active ? 1.16 : 1);
      mesh.position.y = active ? 1.35 : 0.9;
    }
  }

  function resize() {
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    if (!width || !height) return;
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
  }

  const clock = new THREE.Clock();
  const reduceMotion =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let frameHandle = null;
  let running = false;

  function renderFrame() {
    const elapsed = clock.getElapsedTime();
    if (!reduceMotion) {
      camera.position.y = CAMERA_HOME.y + Math.sin(elapsed * 0.25) * 0.8;
      riverGroup.position.y = Math.sin(elapsed * 0.6) * 0.05;
    }
    camera.lookAt(CAMERA_HOME.tx, CAMERA_HOME.ty, CAMERA_HOME.tz);
    renderer.render(scene, camera);
  }

  function loop() {
    renderFrame();
    frameHandle = window.requestAnimationFrame(loop);
  }

  function start() {
    if (running) return;
    running = true;
    resize();
    if (reduceMotion) {
      renderFrame();
      return;
    }
    loop();
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
    for (const mesh of bridgeMeshes.values()) {
      mesh.geometry.dispose();
      mesh.material.dispose();
    }
    pierGeometry.dispose();
    pierMaterial.dispose();
    ground.geometry.dispose();
    ground.material.dispose();
    river.geometry.dispose();
    river.material.dispose();
    renderer.dispose();
  }

  window.addEventListener("resize", resize);

  return {
    setState,
    start,
    stop,
    resize,
    dispose,
    revision: String(THREE.REVISION)
  };
}
