# PWA implementation progress

Cross-session checklist for [`implementation-plan.md`](./implementation-plan.md). After completing a package, flip its checkbox and add a one-line verification note so future sessions can continue without re-discovery.

## Baseline already shipped

- [x] **Wake lock runtime** — `mountHomeRouteScreenWakeLock` + tests; mounted from `HomeRoute.svelte` (visibility-aware acquire/release/reacquire behaviour).
- [x] **Orientation behaviour baseline** — Existing orientation guidance and lock behavior are in place and considered sufficient for this pass (no new orientation package planned).
- [x] **Installability baseline** — Manifest/assets and host cache split previously implemented (`public/site.webmanifest`, `index.html` manifest wiring, `vercel.json` cache headers).

## Current packages (source-of-truth checklist)

- [x] **`pkg-install-entry`** — Persistent first-class `Install app` menu entry (not buried in settings).
- [x] **`pkg-install-content`** — Install benefit explanation integrated directly into install flow.
- [ ] **`pkg-setup-helper`** — Standalone first-run helper focused on keep-awake preference (skip + don't-show-again + reopen path).
- [ ] **`pkg-wake-controls`** — Explicit keep-awake toggle and clear state (`active` / `inactive` / `not supported`).
- [x] **`pkg-install-fallbacks`** — Manual platform install instructions when `beforeinstallprompt` is unavailable.
- [ ] **`pkg-copy`** — Final consistency pass for concise, honest copy.
- [ ] **`pkg-doc-sync`** — Keep implementation docs aligned after each package completion.

## Deferred / explicitly out of scope

- Telemetry/event metrics implementation (deferred until backend/event pipeline exists).
- New orientation feature work beyond existing behaviour.
- Timed install reminder resurfacing heuristics.
- Service worker introduction.

## Legacy package mapping (for historical continuity)

- `pkg-manifest` -> absorbed into baseline shipped state.
- `pkg-host-cache` -> absorbed into baseline shipped state.
- `pkg-orientation` -> closed as no-change baseline for this pass.
- `pkg-fullscreen` -> shipped previously; not part of current required package checklist.
- `pkg-wake-ui`, `pkg-browser-doc` -> superseded by current package structure and priorities.

## Notes / verification log

- 2026-04-21: Completed manifest baseline with `public/site.webmanifest`, generated `public/icon-192.png` + `public/icon-512.png`, and wired manifest/theme in `index.html`.
- 2026-04-21: Completed host-cache baseline via `vercel.json` `Cache-Control` split (`/` and `/index.html` => `max-age=0, must-revalidate`; `/assets/*` => `max-age=31536000, immutable`).
- 2026-04-21: Completed orientation baseline with standalone-gated, gesture-triggered, silent-fail `screen.orientation.lock('landscape')` path and tests.
- 2026-04-21: Completed fullscreen enhancement with helper/tests and gesture-triggered Enter/Exit fullscreen in home overlay menu.
- 2026-04-24: Realigned planning docs to source-of-truth package set (`ux-improvements-plan.md` + `implementation-plan.md`); progress checklist updated to new package IDs.
- 2026-04-24: Completed install Phase 1 core packages: added persistent home-menu `Install app` entry, install-flow benefit copy, and prompt/unavailable fallback branch with platform-specific manual steps.
