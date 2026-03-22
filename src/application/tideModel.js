// @ts-check

/**
 * @param {Date} _at
 * @param {import('./tideExtremes.js').TideExtreme[]} extremes
 * @returns {number}
 */
export function heightAt(_at, extremes) {
  if (extremes.length === 0) {
    return 0
  }
  return 0
}

/**
 * @param {Date} _at
 * @param {import('./tideExtremes.js').TideExtreme[]} extremes
 * @returns {number}
 */
export function trendAt(_at, extremes) {
  if (extremes.length === 0) {
    return 0
  }
  return 0
}

/**
 * @param {Date} _at
 * @param {import('./tideExtremes.js').TideExtreme[]} extremes
 * @returns {import('./tideExtremes.js').TideExtreme | null}
 */
export function nextHigh(_at, extremes) {
  if (extremes.length === 0) {
    return null
  }
  return null
}

/**
 * @param {Date} _at
 * @param {import('./tideExtremes.js').TideExtreme[]} extremes
 * @returns {import('./tideExtremes.js').TideExtreme | null}
 */
export function nextLow(_at, extremes) {
  if (extremes.length === 0) {
    return null
  }
  return null
}
