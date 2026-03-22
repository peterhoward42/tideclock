// @ts-check

/**
 * @param {number | null} cacheTimestampMs
 * @param {number} _nowMs
 * @returns {boolean}
 */
export function shouldRefresh(cacheTimestampMs, _nowMs) {
  return cacheTimestampMs == null
}
