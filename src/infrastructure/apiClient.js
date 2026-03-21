// @ts-check

/**
 * @returns {string | undefined}
 */
function tideApiBaseUrl() {
  return undefined
}

/**
 * @returns {Promise<import('../domain/tideExtremes.js').TideExtreme[]>}
 */
export async function fetchTideExtremes() {
  const base = tideApiBaseUrl()
  if (!base) {
    return []
  }
  return []
}
