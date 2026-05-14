/**
 * Short git commit id baked in at build time (`vite.config.js` → `__TIDECLOCK_BUILD_COMMIT__`).
 * Not rendered in the UI; import `TIDECLOCK_BUILD_COMMIT` when you need a deploy fingerprint
 * (e.g. diagnostics, future about/settings surfaces).
 */
export const TIDECLOCK_BUILD_COMMIT: string = __TIDECLOCK_BUILD_COMMIT__;
