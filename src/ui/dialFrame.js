// @ts-check

/**
 * dialFrame.js — Preset outer→inner dial radii for SVG layout helpers.
 * Kind: Definition (layout constants). Does not compute angles or tide positions.
 */

/** Fixed ratio from outer dial radius to inner content radius (layout preset, not caller input). */
const INNER_RADIUS_FROM_OUTER = 0.55

/**
 * buildDialFrame returns centre, outer radius, and a smaller inner radius for dial SVG layout.
 *
 * @param {number} cx
 * @param {number} cy
 * @param {number} outerR
 * @returns {{ cx: number, cy: number, outerR: number, innerR: number }}
 */
export function buildDialFrame(cx, cy, outerR) {
  return {
    cx,
    cy,
    outerR,
    innerR: outerR * INNER_RADIUS_FROM_OUTER,
  }
}
