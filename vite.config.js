// @ts-check
/**
 * vite.config.js — Vite + Svelte plugin wiring for the SPA build.
 * Kind: Pipeline stage (build config). Does not define runtime app behaviour.
 */
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
})
