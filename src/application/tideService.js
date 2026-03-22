// @ts-check

import { fetchTideExtremes } from '../infrastructure/apiClient.js'

/**
 * @param {number} _nowMs
 * @returns {Promise<import('./tideExtremes.js').TideExtreme[]>}
 */
export async function loadTideExtremes(_nowMs) {
  return fetchTideExtremes()
}

export function resetTideServiceForTests() {}
