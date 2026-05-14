// @ts-check

/**
 * router.js — Hash URL drives the `route` store; the shell subscribes and {@link navigate} writes `#/{id}`.
 * Owns parse/normalize hash ↔ {@link RouteId} and attaching the `hashchange` listener.
 * Kind: UI shell wiring. Does not load tides or own chrome layout.
 */

import { writable } from 'svelte/store'

/** @type {readonly string[]} */
const LEGACY_PLACEHOLDER_HASHES = [
  'settings',
  'about',
  'acknowledgements',
  'support',
  'cookies',
]

/**
 * @typedef {'home' | 'location'} RouteId
 */

/** @type {import('svelte/store').Writable<RouteId>} */
export const route = writable('home')

/**
 * @param {string} hash
 * @returns {RouteId} Unknown segments map to `home` (defensive default for arbitrary `#/...` input).
 * `location2` is accepted as a legacy hash segment (same screen as `location`).
 */
export function parseHash(hash) {
  const raw = hash.replace(/^#\/?/, '').trim()
  switch (raw) {
    case '':
    case 'home':
      return 'home'
    case 'location':
    case 'location2':
      return 'location'
    default:
      return 'home'
  }
}

/**
 * Sync store from {@link window.location.hash}.
 * Rewrites legacy `#/location2` to `#/location` via {@link history.replaceState} (no extra history entry).
 */
export function syncRouteFromHash() {
  if (typeof window === 'undefined') {
    return
  }
  const hash = window.location.hash
  const raw = hash.replace(/^#\/?/, '').trim()
  const id = parseHash(hash)
  route.set(id)

  if (raw === 'location2' && id === 'location') {
    const url = new URL(window.location.href)
    url.hash = `/${id}`
    history.replaceState(null, '', url.href)
  } else if (LEGACY_PLACEHOLDER_HASHES.includes(raw) && id === 'home') {
    const url = new URL(window.location.href)
    url.hash = '/home'
    history.replaceState(null, '', url.href)
  }
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
