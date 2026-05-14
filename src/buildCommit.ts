/**
 * Short git commit id baked in at build time (`vite.config.js` → `__TIDECLOCK_BUILD_COMMIT__`).
 * Shown on the About route; also useful for diagnostics.
 */
export const TIDECLOCK_BUILD_COMMIT: string = __TIDECLOCK_BUILD_COMMIT__;
