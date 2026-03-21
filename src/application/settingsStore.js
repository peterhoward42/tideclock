// @ts-check

import { writable } from 'svelte/store'

/**
 * @typedef {Object} Settings
 * @property {string} [locationLabel]
 */

/** @type {import('svelte/store').Writable<Settings>} */
export const settings = writable({})
