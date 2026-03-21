// @ts-check

/**
 * @typedef {Object} DialFrame
 * @property {number} cx
 * @property {number} cy
 * @property {number} outerR
 * @property {number} innerR
 */

/**
 * @param {number} cx
 * @param {number} cy
 * @param {number} outerR
 * @returns {DialFrame}
 */
export function buildDialFrame(cx, cy, outerR) {
  return { cx, cy, outerR, innerR: outerR * 0.55 }
}
