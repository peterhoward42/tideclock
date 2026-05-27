/**
 * resolveBuildCommitShort.mjs — Resolve a short git SHA for Vite `define` at build time.
 * Used by `vite.config.js`; tested without shelling out to git when env vars are set.
 */

import { execSync } from 'node:child_process'

const COMMIT_SHA_PATTERN = /^[0-9a-f]{7,40}$/i

/**
 * @param {string} raw
 * @returns {string}
 */
function normaliseCommitSha(raw) {
  const trimmed = typeof raw === 'string' ? raw.trim() : ''
  if (!COMMIT_SHA_PATTERN.test(trimmed)) {
    return ''
  }
  return trimmed.length <= 7
    ? trimmed.toLowerCase()
    : trimmed.slice(0, 7).toLowerCase()
}

/**
 * @param {Record<string, string | undefined>} env
 * @returns {string}
 */
function commitFromCiEnv(env) {
  const candidates = [
    env.VERCEL_GIT_COMMIT_SHA,
    env.CF_PAGES_COMMIT_SHA,
    env.GITHUB_SHA,
  ]
  for (const raw of candidates) {
    const short = normaliseCommitSha(raw ?? '')
    if (short !== '') {
      return short
    }
  }
  return ''
}

/**
 * Short SHA for deploy fingerprint (Vercel / Cloudflare Pages / GitHub Actions / local git).
 *
 * @param {{
 *   env?: Record<string, string | undefined>;
 *   revParseShort?: () => string;
 * }} [options]
 * @returns {string} Seven hex chars when known, otherwise "".
 */
export function resolveBuildCommitShort(options = {}) {
  const env = options.env ?? process.env
  const fromCi = commitFromCiEnv(env)
  if (fromCi !== '') {
    return fromCi
  }

  const revParseShort =
    options.revParseShort ??
    (() => {
      try {
        return execSync('git rev-parse --short HEAD', {
          encoding: 'utf-8',
          stdio: ['ignore', 'pipe', 'ignore'],
        }).trim()
      } catch {
        return ''
      }
    })

  return normaliseCommitSha(revParseShort())
}
