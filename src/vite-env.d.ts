/// <reference types="vite/client" />

/**
 * vite-env.d.ts — Ambient typings for `import.meta.env` (VITE_* contract).
 * Kind: Definition. Extend when adding variables so `import.meta.env` stays typed.
 */
interface ImportMetaEnv {
  readonly VITE_TIDE_PROXY_BASE_URL: string;
}
