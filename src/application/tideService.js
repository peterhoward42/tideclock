// @ts-check

import { fetchTideExtremes } from '../infrastructure/apiClient.js'
import { loadCachedExtremes, saveCachedExtremes } from './tideCache.js'
import { shouldRefresh } from './refreshPolicy.js'

/** @type {number | null} */
let lastFetchAtMs = null

/**
 * @param {number} nowMs
 * @returns {Promise<import('../domain/tideExtremes.js').TideExtreme[]>}
 */
export async function loadTideExtremes(nowMs) {
  const cached = loadCachedExtremes()
  if (cached && !shouldRefresh(lastFetchAtMs ?? null, nowMs)) {
    return cached
  }
  const fresh = await fetchTideExtremes()
  lastFetchAtMs = nowMs
  saveCachedExtremes(fresh)
  return fresh
}

/**
 * Resets skeleton fetch state (for tests).
 */
export function resetTideServiceForTests() {
  lastFetchAtMs = null
}
