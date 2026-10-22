/**
 * 场景状态机 + hash 路由 + 浏览器前进/后退。
 *
 * 地址约定：
 *   #atlas                       城市总览
 *   #bridge/<id>                 单桥场景（可选 ?mode=force&explode=1）
 *   #lab                         结构实验室
 *   #archive                     档案馆
 *   #browse                      列表视图（降级 / 无障碍）
 *   #bridge=<id>&mode=...        旧链接格式，读取时兼容并归一化
 */

import { BRIDGE_IDS } from "./data.mjs";

export const VIEWS = ["atlas", "bridge", "lab", "archive", "browse"];
// 夜景（night）已按要求移除；旧的 ?mode=night 链接会被 normalizeMode 回落成 structure。
export const MODES = ["structure", "force"];

function normalizeMode(mode) {
  return MODES.includes(mode) ? mode : "structure";
}

/** 是否为旧版 `#bridge=wenhui&mode=force` 形式的链接。 */
export function isLegacyHash(hash = window.location.hash) {
  const raw = String(hash).replace(/^#/, "").trim();
  // 新格式带路径分隔符（#bridge/wenhui?mode=force），即使含 "=" 也不是旧格式。
  if (!raw || raw.includes("/")) return false;
  return /^[A-Za-z][A-Za-z0-9_]*=/.test(raw);
}

/**
 * 解析 hash 为状态对象。
 * 无法识别的地址一律回落到 atlas，保证不会出现空白场景。
 */
export function parseHash(hash = window.location.hash) {
  const raw = String(hash).replace(/^#/, "").trim();

  if (!raw) {
    return { view: "atlas", bridgeId: null, mode: "structure", exploded: false, legacy: false };
  }

  // 旧链接：bridge=wenhui&mode=force&explode=1
  if (isLegacyHash(raw)) {
    const params = new URLSearchParams(raw);
    const bridgeId = params.get("bridge");
    const known = BRIDGE_IDS.includes(bridgeId);
    return {
      view: known ? "bridge" : "atlas",
      bridgeId: known ? bridgeId : null,
      mode: normalizeMode(params.get("mode")),
      exploded: params.get("explode") === "1",
      legacy: true
    };
  }

  const hashIndex = raw.indexOf("?");
  const pathPart = hashIndex >= 0 ? raw.slice(0, hashIndex) : raw;
  const queryPart = hashIndex >= 0 ? raw.slice(hashIndex + 1) : "";
  const params = new URLSearchParams(queryPart);
  const segments = pathPart.split("/").filter(Boolean);
  const head = segments[0] || "atlas";

  if (head === "bridge") {
    const bridgeId = segments[1] || null;
    if (BRIDGE_IDS.includes(bridgeId)) {
      return {
        view: "bridge",
        bridgeId,
        mode: normalizeMode(params.get("mode")),
        exploded: params.get("explode") === "1",
        legacy: false
      };
    }
    return { view: "atlas", bridgeId: null, mode: "structure", exploded: false, legacy: false };
  }

  if (VIEWS.includes(head)) {
    return {
      view: head,
      bridgeId: null,
      mode: normalizeMode(params.get("mode")),
      exploded: params.get("explode") === "1",
      legacy: false
    };
  }

  return { view: "atlas", bridgeId: null, mode: "structure", exploded: false, legacy: false };
}

/**
 * 状态对象 → hash 字符串。
 *
 * mode / explode 对**所有视图**都要写进去：拆解与受力是整场的状态，
 * 早先只在 bridge 视图带上参数，于是"在总览改状态"点了没反应。
 */
export function toHash(state) {
  const view = VIEWS.includes(state.view) ? state.view : "atlas";
  const mode = normalizeMode(state.mode); // 已移除的模式（如 night）不写进地址
  const params = new URLSearchParams();
  if (mode !== "structure") params.set("mode", mode);
  if (state.exploded) params.set("explode", "1");
  const query = params.toString();
  const suffix = query ? `?${query}` : "";

  if (view === "bridge" && state.bridgeId) {
    return `#bridge/${state.bridgeId}${suffix}`;
  }

  return `#${view}${suffix}`;
}

export function sameState(a, b) {
  if (!a || !b) return false;
  return (
    a.view === b.view &&
    a.bridgeId === b.bridgeId &&
    a.mode === b.mode &&
    a.exploded === b.exploded
  );
}

/**
 * 创建路由。
 * @param {(state: object, meta: { initial: boolean }) => void} onChange
 */
export function createRouter(onChange) {
  let current = null;

  function emit() {
    const next = parseHash(window.location.hash);
    if (current && sameState(current, next)) return;
    current = next;
    onChange(next, { initial: false });
  }

  function start() {
    const next = parseHash(window.location.hash);
    current = next;
    onChange(next, { initial: true });
  }

  /** 只改写地址栏，不触发 onChange（不产生 hashchange）。 */
  function replace(state) {
    current = state;
    try {
      window.history.replaceState(null, "", toHash(state));
    } catch {
      // 浏览器限制 history 时，地址栏保留旧值也不影响功能。
    }
  }

  window.addEventListener("hashchange", emit);
  window.addEventListener("popstate", emit);

  return {
    start,
    replace,
    emit,
    get current() {
      return current;
    }
  };
}
