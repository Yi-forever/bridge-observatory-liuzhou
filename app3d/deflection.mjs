/**
 * 挠度演示的换算（纯函数，方便在 Node 里直接断言）。
 *
 * 真实桥梁在车辆荷载下的跨中下沉是"几厘米"量级：1 单位 = 100 m，
 * 4 cm 只有 0.0004 单位——在 1:100 的模型里根本看不见。
 * 所以 3D 里画出来的下沉是**放大的**，放大倍数必须写死成常数并在界面上明说。
 *
 * 约定：
 *   deflectionCm(deflectionBase, load)  真实下沉（厘米）
 *   sagUnits(deflectionBase, load)      画面上要下沉多少世界单位
 *   两者之比恒等于 DEFLECTION_EXAGGERATION——这条恒等式有断言守着。
 */

/** 图形放大倍数：真实下沉 ×300 才是屏幕上看到的下沉。 */
export const DEFLECTION_EXAGGERATION = 300;

/** 满荷载时，真实下沉 ≈ deflectionBase × 0.5 厘米（教学取值的量级）。 */
export const CM_PER_DEFLECTION_UNIT = 0.5;

const clamp01 = (value) => Math.min(1, Math.max(0, Number(value) || 0));

/** 真实下沉（厘米）。 */
export function deflectionCm(deflectionBase, load) {
  return Math.max(0, Number(deflectionBase) || 0) * CM_PER_DEFLECTION_UNIT * clamp01(load);
}

/**
 * 画面上要下沉的世界单位。
 *
 * 两层换算别漏掉任何一层：
 *   厘米 → 米（/100）→ 世界单位（再 /100，因为 1 单位 = 100 m）→ ×放大倍数。
 * 漏掉第二层会得到 16 单位这种"整座桥沉到水里"的荒唐值（踩过）。
 */
export function sagUnits(deflectionBase, load) {
  const meters = deflectionCm(deflectionBase, load) / 100;
  const units = meters / 100;
  return units * DEFLECTION_EXAGGERATION;
}

/** 界面上统一使用的说明文字（"放大 ×400 · 教学示意"）。 */
export const EXAGGERATION_LABEL = `图形放大 ×${DEFLECTION_EXAGGERATION} · 教学示意`;
