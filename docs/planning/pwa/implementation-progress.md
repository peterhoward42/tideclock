# PWA implementation progress

Cross-session checklist for [`implementation-plan.md`](./implementation-plan.md). After completing a package in a coding session, flip its checkbox and add a one-line note (PR link, date, or “verified on device X”) so the next session does not repeat work.

## Completed

- [x] **Wake lock (pre-plan / out of band)** — `mountHomeRouteScreenWakeLock` + tests; mounted from `HomeRoute.svelte`. Matches `implementation.md` (re-acquire on visibility, release on hide).

## Packages (from implementation plan)

- [ ] **`pkg-manifest`** — Web app manifest, icons (192/512), `index.html` link, theme meta.
- [ ] **`pkg-host-cache`** — Verify or configure `index.html` vs hashed asset `Cache-Control` on deploy host.
- [ ] **`pkg-orientation`** — Best-effort `screen.orientation.lock` in standalone, user-gesture-gated, silent failure.
- [ ] **`pkg-fullscreen`** — Opt-in fullscreen (gesture), device-aware prominence.
- [ ] **`pkg-wake-ui`** (optional) — Subtle indicator when wake lock active.
- [ ] **`pkg-copy`** (optional) — Honest wall/tablet expectations copy.
- [ ] **`pkg-browser-doc`** (optional) — Target browsers / known limitations (short).

## Notes / verification log

_Add dated bullets here as you complete packages (e.g. header samples, devices used for smoke tests)._
