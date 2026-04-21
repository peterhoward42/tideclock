# PWA implementation progress

Cross-session checklist for [`implementation-plan.md`](./implementation-plan.md). After completing a package in a coding session, flip its checkbox and add a one-line note (PR link, date, or “verified on device X”) so the next session does not repeat work.

## Completed

- [x] **Wake lock (pre-plan / out of band)** — `mountHomeRouteScreenWakeLock` + tests; mounted from `HomeRoute.svelte`. Matches `implementation.md` (re-acquire on visibility, release on hide).

## Packages (from implementation plan)

- [x] **`pkg-manifest`** — Web app manifest, icons (192/512), `index.html` link, theme meta.
- [x] **`pkg-host-cache`** — Added `vercel.json` headers to revalidate `/` + `/index.html` and long-cache `/assets/*`.
- [ ] **`pkg-orientation`** — Best-effort `screen.orientation.lock` in standalone, user-gesture-gated, silent failure.
- [ ] **`pkg-fullscreen`** — Opt-in fullscreen (gesture), device-aware prominence.
- [ ] **`pkg-wake-ui`** (optional) — Subtle indicator when wake lock active.
- [ ] **`pkg-copy`** (optional) — Honest wall/tablet expectations copy.
- [ ] **`pkg-browser-doc`** (optional) — Target browsers / known limitations (short).

## Notes / verification log

- 2026-04-21: Completed `pkg-manifest` with `public/site.webmanifest`, generated `public/icon-192.png` and `public/icon-512.png` from `public/favicon.svg`, and added manifest/theme wiring in `index.html`.
- 2026-04-21: Completed `pkg-host-cache` by adding `vercel.json` `Cache-Control` policy split (`/` and `/index.html` => `max-age=0, must-revalidate`; `/assets/*` => `max-age=31536000, immutable`). Deploy-preview `curl -I` verification still recommended.
