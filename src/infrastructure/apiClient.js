// @ts-check

/**
 * tideApiBaseUrl will supply the HTTP API root once wired; unset while the app uses the tide proxy path instead.
 *
 * @returns {string | undefined}
 */
function tideApiBaseUrl() {
  return undefined
}

/**
 * fetchTideExtremes loads tide extremes from the legacy API surface.
 * Stub: returns an empty list until a base URL exists (live tides go through `createTideProxyFetcher` in the UI).
 *
 * @returns {Promise<import('../application/tideExtremes.js').TideExtreme[]>}
 */
export async function fetchTideExtremes() {
  const base = tideApiBaseUrl()
  if (!base) {
    return []
  }
  return []
}
