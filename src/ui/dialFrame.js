// @ts-check

/**
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
    innerR: outerR * 0.55,
  }
}
