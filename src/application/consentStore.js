// @ts-check

import { writable } from 'svelte/store'

/**
 * @typedef {Object} Consent
 * @property {boolean} analytics
 */

/** @type {import('svelte/store').Writable<Consent>} */
export const consent = writable({ analytics: false })
