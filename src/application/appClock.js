// @ts-check

import { readable } from 'svelte/store'

/** Milliseconds since Unix epoch, ticking once per second. */
export const nowMs = readable(Date.now(), (set) => {
  const id = setInterval(() => set(Date.now()), 1000)
  return () => clearInterval(id)
})
