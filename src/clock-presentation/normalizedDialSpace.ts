/**
 * Normalized dial space — abstract units used throughout clock presentation before viewport scaling.
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

export function pointOnReferenceRingFromAngle(angleRad: number): DialPoint {
  return pointOnRingFromAngle(angleRad, REFERENCE_RADIUS);
}

/** Point on a circle centred at the origin at the given radius (dial units). */
export function pointOnRingFromAngle(angleRad: number, radius: number): DialPoint {
  return {
    x: radius * Math.sin(angleRad),
    y: -radius * Math.cos(angleRad),
  };
}
