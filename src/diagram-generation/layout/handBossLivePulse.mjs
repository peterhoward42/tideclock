/**
 * Hand **BossCircle** radius oscillation — slow sine envelope so the hub reads subtly “live”
 * without relying on full-diagram regeneration every frame (animation is SMIL on the circle).
 * Shared by layout bounds, scene preview-frame bounds, and {@link renderSceneSvg}.
 */

/** Wall-clock period of one full breathe cycle (seconds). */
export const HAND_BOSS_LIVE_PULSE_PERIOD_S = 4;

/**
 * Peak fractional deviation from nominal radius: **r(t) = r₀ (1 + k sin(ωt))**, **k** = this constant.
 * Kept small so motion stays peripheral.
 */
export const HAND_BOSS_LIVE_PULSE_RELATIVE_AMPLITUDE = 0.03;

/**
 * Same phase as radius: **opacity(t) = opacity₀ (1 + k sin(ωt))**, clamped to **[0, 1]**.
 * **k** = this constant (slightly weaker than radius so the stroke does not “disappear”).
 */
export const HAND_BOSS_LIVE_PULSE_OPACITY_RELATIVE_AMPLITUDE = 0.20;

/** Upper envelope for layout / viewBox so the stroked boss is not clipped at peak radius. */
export function handBossCircleMaxRadiusForLayout(baseRadius) {
  return baseRadius * (1 + HAND_BOSS_LIVE_PULSE_RELATIVE_AMPLITUDE);
}
