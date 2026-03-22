// @ts-check

import { readable } from 'svelte/store'

/** nowMs is a Svelte readable of milliseconds since Unix epoch, updating once per second. */
export const nowMs = readable(Date.now(), (set) => {
  const id = setInterval(() => set(Date.now()), 1000)
  return () => clearInterval(id)
})
