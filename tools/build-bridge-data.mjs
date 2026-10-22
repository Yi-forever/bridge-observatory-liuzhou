/**
 * 从 app.js 抽取权威桥梁数据 → app3d/bridges.data.mjs
 *
 * 背景：app.js 是 2D 页面（经典脚本，不能 import），3D 场景需要同一份
 * parts / description / observation 文案。为避免两处维护，这里把 app.js 里的
 * `const bridges = [...]` 字面量抽出来生成 ES 模块；app.js 仍是唯一权威来源。
 *
 * 用法：
 *   node tools/build-bridge-data.mjs            # 生成
 *   node tools/build-bridge-data.mjs --check    # 只校验是否过期（退出码 1 = 过期）
 */

import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const SOURCE = path.join(ROOT, "app.js");
const TARGET = path.join(ROOT, "app3d", "bridges.data.mjs");

/** 从 app.js 源码里切出 bridges 字面量并求值。 */
function readBridges() {
  const source = fs.readFileSync(SOURCE, "utf8");
  const start = source.indexOf("const bridges = [");
  if (start < 0) throw new Error("app.js 里找不到 `const bridges = [`");
  const literalStart = start + "const bridges = ".length;
  const end = source.indexOf("\n];", literalStart);
  if (end < 0) throw new Error("app.js 里找不到 bridges 数组的结尾 `\\n];`");
  const literal = source.slice(literalStart, end + 3);
  // 数据块是纯字面量（没有模板串、没有外部引用），可以直接求值。
  return new Function(`return ${literal}`)();
}

/** 生成模块源码。 */
function render(bridges) {
  const json = JSON.stringify(bridges, null, 2);
  return `/**
 * 自动生成，请勿手工编辑。
 *
 * 来源：app.js 里的 \`const bridges = [...]\`（2D 页面的权威数据）。
 * 重新生成：node tools/build-bridge-data.mjs
 * 校验是否过期：node tools/build-bridge-data.mjs --check（tests 里也会跑）
 *
 * 3D 场景用这份数据渲染资料卡：别名、结构家族、规模、构件说明、观察要点。
 */

export const BRIDGES = ${json};

export const BRIDGE_BY_ID = new Map(BRIDGES.map((bridge) => [bridge.id, bridge]));
`;
}

const bridges = readBridges();
if (!Array.isArray(bridges) || bridges.length === 0) throw new Error("bridges 数据为空");

const output = render(bridges);
const check = process.argv.includes("--check");

if (check) {
  const current = fs.existsSync(TARGET) ? fs.readFileSync(TARGET, "utf8").replace(/\r\n/g, "\n") : "";
  if (current === output) {
    console.log(`app3d/bridges.data.mjs 与 app.js 一致（${bridges.length} 座桥）`);
    process.exit(0);
  }
  console.error("app3d/bridges.data.mjs 已过期：请运行 node tools/build-bridge-data.mjs");
  process.exit(1);
}

fs.writeFileSync(TARGET, output, "utf8");
const parts = bridges.reduce((sum, bridge) => sum + bridge.parts.length, 0);
console.log(
  `已生成 app3d/bridges.data.mjs：${bridges.length} 座桥、${parts} 个构件、` +
    `${(output.length / 1024).toFixed(1)} KB`
);
