# Build and deploy

Static SPA built with **Vite 8** + **Svelte 5**, hosted on **Vercel** at [thetidedial.page](https://thetidedial.page). No server-side app runtime — only static files and client-side `fetch` to the tide proxy.

## Commands

| Script | Role |
|--------|------|
| `npm run dev` | Vite dev server + HMR (`vite.config.js`, `svelte.config.js`). |
| `npm run build` | Production bundle → `dist/`. |
| `npm run preview` | Serve `dist/` locally after a build. |
| `npm test` | Vitest (unit tests; also run before/at deploy per project setup). |

## Environment (Vite)

| Variable | When | Role |
|----------|------|------|
| `VITE_TIDE_PROXY_BASE_URL` | Dev + build | Origin for `${base}/v1/tides` (no trailing slash). Baked into the client bundle. |
| `VITE_TELEMETRY_BASE_URL` | Dev + build | Origin for `${base}/v1/events` (no trailing slash). Baked into the client bundle. |

Copy [`.env.example`](../.env.example) → `.env` locally. Set the same variable in the **Vercel project** for production builds. Typings: [`src/vite-env.d.ts`](../src/vite-env.d.ts).

`import.meta.env.DEV` / `PROD` gate dev-only previews and diagnostics; do not rely on them for security.

## Build fingerprint (`buildCommit`)

| Piece | Role |
|-------|------|
| [`resolveBuildCommitShort.mjs`](./resolveBuildCommitShort.mjs) | Resolve short SHA from CI env or `git rev-parse`. |
| [`vite.config.js`](../vite.config.js) | `define.__TIDECLOCK_BUILD_COMMIT__` at build time. |
| [`src/buildCommit.ts`](../src/buildCommit.ts) | Re-exports constant for the About route. |

CI env precedence: `VERCEL_GIT_COMMIT_SHA` → `CF_PAGES_COMMIT_SHA` → `GITHUB_SHA` → local git. Invalid values are skipped.

## Vercel (`vercel.json`)

Cache policy for static output:

- `/` and `/index.html` — `max-age=0, must-revalidate` (fresh shell on deploy).
- `/assets/*` — long immutable cache (hashed filenames from Vite).

Framework detection uses `package.json` (`vite build` output). Push-to-deploy; no separate release step.

## Config files (repo root)

| File | Role |
|------|------|
| `vite.config.js` | Vite + Svelte plugin, `define` injection. |
| `svelte.config.js` | Svelte compiler options (empty default). |
| `vercel.json` | CDN cache headers only. |
| `index.html` | SPA shell; entry `/src/main.js`. |

Runtime shell and operator-notice deploy switch: [`src/ui/README.md`](../src/ui/README.md).
