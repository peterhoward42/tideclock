// @ts-check

/**
 * appClock.js — Shared ~1 Hz wall-clock store (`nowMs`) for components that avoid local timers.
 * Fed by nothing; consumed anywhere a coarse current instant is enough.
 * Kind: Service (Svelte store). Does not interpret civil days or time zones.
 */

import { readable } from 'svelte/store'

/**
 * Milliseconds since epoch, updated about once per second while subscribed.
 * Subscribing starts a timer; unsubscribing clears it. Initial value is `Date.now()` at store creation.
 */
export const nowMs = readable(Date.now(), (set) => {
  const id = setInterval(() => set(Date.now()), 1000)
  return () => clearInterval(id)
})
