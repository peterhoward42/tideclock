// @ts-check

/**
 * @param {Date} d
 * @returns {number}
 */
export function toUnixMs(d) {
  return d.getTime()
}

/**
 * @param {number} ms
 * @returns {Date}
 */
export function fromUnixMs(ms) {
  return new Date(ms)
}
