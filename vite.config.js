// @ts-check
/**
 * vite.config.js — Vite + Svelte plugin wiring for the SPA build.
 * Kind: Pipeline stage (build config). Does not define runtime app behaviour.
 * See build/README.md for env vars, deploy fingerprint, and Vercel cache policy.
 */
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'
import { resolveBuildCommitShort } from './build/resolveBuildCommitShort.mjs'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    __TIDECLOCK_BUILD_COMMIT__: JSON.stringify(resolveBuildCommitShort()),
  },
})
