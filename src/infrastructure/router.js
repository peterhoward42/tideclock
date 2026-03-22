// @ts-check

/**
 * Hash-based SPA routing: `route` mirrors `window.location.hash`; {@link navigate} writes `#/{id}`.
 */

import { writable } from 'svelte/store'

/**
 * @typedef {'home' | 'settings' | 'about' | 'acknowledgements' | 'support' | 'cookies'} RouteId
 */

/** @type {import('svelte/store').Writable<RouteId>} */
export const route = writable('home')

/**
 * @param {string} hash
 * @returns {RouteId}
 */
function parseHash(hash) {
  const raw = hash.replace(/^#\/?/, '').trim()
  switch (raw) {
    case '':
    case 'home':
      return 'home'
    case 'settings':
      return 'settings'
    case 'about':
      return 'about'
    case 'acknowledgements':
      return 'acknowledgements'
    case 'support':
      return 'support'
    case 'cookies':
      return 'cookies'
    default:
      return 'home'
  }
}

/**
 * Sync store from {@link window.location.hash}.
 */
export function syncRouteFromHash() {
  if (typeof window === 'undefined') {
    return
  }
  route.set(parseHash(window.location.hash))
}

/**
 * @param {RouteId} id
 */
export function navigate(id) {
  if (typeof window === 'undefined') {
    return
  }
  window.location.hash = `/${id}`
}

/**
 * @returns {() => void}
 */
export function attachHashListener() {
  if (typeof window === 'undefined') {
    return () => {}
  }
  const onHash = () => syncRouteFromHash()
  window.addEventListener('hashchange', onHash)
  syncRouteFromHash()
  return () => window.removeEventListener('hashchange', onHash)
}
