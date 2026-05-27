/// <reference types="vite/client" />

/**
 * vite-env.d.ts — Ambient typings for `import.meta.env` (VITE_* contract).
 * Kind: Definition. Extend when adding variables so `import.meta.env` stays typed.
 * Build/deploy: see `build/README.md`.
 */
interface ImportMetaEnv {
  readonly VITE_TIDE_PROXY_BASE_URL: string;
}

/** Injected by Vite `define` in `vite.config.js`. */
declare const __TIDECLOCK_BUILD_COMMIT__: string;
