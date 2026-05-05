/**
 * Hand **BossCircle** radius oscillation — slow sine envelope so the hub reads subtly “live”
 * without relying on full-diagram regeneration every frame (animation is SMIL on the circle).
 * Shared by layout bounds, scene preview-frame bounds, and {@link renderSceneSvg}.
 */

/** Upper envelope for layout / viewBox so the stroked boss is not clipped at peak radius. */
export function handBossCircleMaxRadiusForLayout(baseRadius, relativeAmplitude) {
  return baseRadius * (1 + relativeAmplitude);
}
