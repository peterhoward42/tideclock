// @ts-check

/**
 * shouldRefresh is true when cached tide data must be refetched.
 * Policy is minimal for now: missing cache timestamp forces refresh; `_nowMs` is reserved for future TTL rules.
 *
 * @param {number | null} cacheTimestampMs
 * @param {number} _nowMs
 * @returns {boolean}
 */
export function shouldRefresh(cacheTimestampMs, _nowMs) {
  return cacheTimestampMs == null
}
