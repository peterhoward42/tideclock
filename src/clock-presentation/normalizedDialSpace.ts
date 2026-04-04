/**
 * normalizedDialSpace.ts — Unit space and angle convention for dial math before viewport scaling.
 * Shared by geometry and SVG helpers. Kind: Definition. Does not encode tide domain rules beyond coordinates.
 *
 * **Linear measure**
 * - One dial unit is arbitrary; we fix a reference diameter so mental math is easy.
 * - {@link REFERENCE_DIAMETER} is the nominal full width/height of the circular dial (100).
 * - {@link REFERENCE_RADIUS} is half of that (50). Future sizes (tick lengths, margins) should be
 *   expressed as proportions of the reference diameter unless a different convention is documented.
 * - The final presentation stage maps this space onto the actual SVG/viewport (uniform scale).
 *
 * **Origin and axes**
 * - Dial center is `(0, 0)`.
 * - `+x` points right; `+y` points down (SVG-style), so the top of the dial is `(0, -REFERENCE_RADIUS)`.
 *
 * **Angles**
 * - `0` rad at the top of the dial, increasing clockwise (matches `docs/specs/tide_dial_spec.md`).
 * - Cartesian position on the reference ring at angle `θ`:
 *   - `x = REFERENCE_RADIUS * sin(θ)`
 *   - `y = -REFERENCE_RADIUS * cos(θ)`
 */

export const REFERENCE_DIAMETER = 100;

/** JS `/` is floating-point, not truncating integer division (cf. Go). 100/2 is exact. */
export const REFERENCE_RADIUS = REFERENCE_DIAMETER / 2;

/** Point on the reference outline circle in normalized dial units; center at origin. */
export type DialPoint = {
  readonly x: number;
  readonly y: number;
};

/**
 * Angle in radians for dial polar placement: {@code 0} at the top, increasing clockwise
 * (see module overview).
 */
export type DialAngleRadians = number;

/** Distance from dial centre in normalized dial units (same unit as {@link REFERENCE_RADIUS}). */
export type DialRadius = number;

/** Point on the reference outline at {@link REFERENCE_RADIUS} and {@link angleRad}. */
export function pointOnReferenceRingFromAngle(angleRad: DialAngleRadians): DialPoint {
  return pointOnRingFromAngle(angleRad, REFERENCE_RADIUS);
}

/** Point on a circle centred at the origin with radius {@link radius} (dial units). */
export function pointOnRingFromAngle(angleRad: DialAngleRadians, radius: DialRadius): DialPoint {
  return {
    x: radius * Math.sin(angleRad),
    y: -radius * Math.cos(angleRad),
  };
}
