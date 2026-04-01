// @ts-check

import { readable } from 'svelte/store'

/**
 * Intent hold (Phase 5): retain this 1s wall-clock trigger as orchestration policy,
 * even while diagram semantics ownership moves elsewhere.
 */
export const nowMs = readable(Date.now(), (set) => {
  const id = setInterval(() => set(Date.now()), 1000)
  return () => clearInterval(id)
})
