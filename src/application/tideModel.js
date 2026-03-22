// @ts-check

/** @typedef {import('./tideExtremes.js').TideExtreme} TideExtreme */

/**
 * @param {Date} _at
 * @param {TideExtreme[]} extremes
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
 * @param {TideExtreme[]} extremes
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
 * @param {TideExtreme[]} extremes
 * @returns {Date | null}
 */
export function nextHigh(_at, extremes) {
  if (extremes.length === 0) {
    return null
  }
  return null
}
