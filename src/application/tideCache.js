// @ts-check

import { getItem, setItem } from '../infrastructure/storage.js'

const CACHE_KEY = 'tide-extremes'

/**
 * @returns {import('../domain/tideExtremes.js').TideExtreme[] | null}
 */
export function loadCachedExtremes() {
  const raw = getItem(CACHE_KEY)
  if (!raw) {
    return null
  }
  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return null
    }
    return /** @type {import('../domain/tideExtremes.js').TideExtreme[]} */ (parsed)
  } catch {
    return null
  }
}

/**
 * @param {import('../domain/tideExtremes.js').TideExtreme[]} extremes
 */
export function saveCachedExtremes(extremes) {
  setItem(CACHE_KEY, JSON.stringify(extremes))
}
