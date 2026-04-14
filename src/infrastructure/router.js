// @ts-check

/**
 * router.js — Hash URL drives the `route` store; the shell subscribes and {@link navigate} writes `#/{id}`.
 * Owns parse/normalize hash ↔ {@link RouteId} and attaching the `hashchange` listener.
 * Kind: UI shell wiring. Does not load tides or own chrome layout.
 */

import { writable } from 'svelte/store'

/**
 * @typedef {'home' | 'location2' | 'settings' | 'about' | 'acknowledgements' | 'support' | 'cookies'} RouteId
 */

/** @type {import('svelte/store').Writable<RouteId>} */
export const route = writable('home')

/**
 * @param {string} hash
 * @returns {RouteId} Unknown segments map to `home` (defensive default for arbitrary `#/...` input).
 */
function parseHash(hash) {
  const raw = hash.replace(/^#\/?/, '').trim()
  switch (raw) {
    case '':
    case 'home':
      return 'home'
    case 'settings':
      return 'settings'
    case 'location':
      return 'location2'
    case 'location2':
      return 'location2'
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
 * Sets `location.hash`; if a hash listener is attached, this typically fires `hashchange` after the write.
 */
export function navigate(id) {
  if (typeof window === 'undefined') {
    return
  }
  window.location.hash = `/${id}`
}

/**
 * Registers `hashchange` and runs one immediate {@link syncRouteFromHash} so the store matches the current URL.
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
