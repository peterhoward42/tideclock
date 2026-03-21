// @ts-check

/**
 * @param {Date} _from
 * @param {Date} _to
 * @param {number} _stepMs
 * @param {import('./tideExtremes.js').TideExtreme[]} extremes
 * @returns {Array<{ t: number; height: number }>}
 */
export function sampleHeights(_from, _to, _stepMs, extremes) {
  if (extremes.length === 0) {
    return []
  }
  return []
}
