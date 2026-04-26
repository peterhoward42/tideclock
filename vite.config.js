// @ts-check
/**
 * vite.config.js — Vite + Svelte plugin wiring for the SPA build.
 * Kind: Pipeline stage (build config). Does not define runtime app behaviour.
 */
import { execSync } from 'node:child_process'
import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

/**
 * Short SHA for deploy fingerprint (Vercel / GitHub Actions / local git).
 * @returns {string} 7+ hex chars when known, otherwise ""
 */
function resolveBuildCommitShort() {
  const raw =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.CF_PAGES_COMMIT_SHA ||
    process.env.GITHUB_SHA ||
    ''
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  if (/^[0-9a-f]{7,40}$/i.test(trimmed)) {
    return trimmed.length <= 7 ? trimmed.toLowerCase() : trimmed.slice(0, 7).toLowerCase()
  }
  try {
    return execSync('git rev-parse --short HEAD', {
      encoding: 'utf-8',
      stdio: ['ignore', 'pipe', 'ignore'],
    }).trim()
  } catch {
    return ''
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [svelte()],
  define: {
    __TIDECLOCK_BUILD_COMMIT__: JSON.stringify(resolveBuildCommitShort()),
  },
})
