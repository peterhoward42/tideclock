/// <reference types="vite/client" />

/** Extend when adding `VITE_*` variables so `import.meta.env` stays typed. */
interface ImportMetaEnv {
  readonly VITE_TIDE_PROXY_BASE_URL: string;
}
