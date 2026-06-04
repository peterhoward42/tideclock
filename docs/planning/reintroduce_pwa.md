# Reintroducing PWA support — plan

**Status:** decided — ready to implement (no code in this document yet).  
**Git snapshot of the old full stack:** `988b66c^` (parent of `Strip out PWA`, 2026-05-30).

---

## 1. What we are doing

Restore **installability** (web app manifest, launcher icons, browser Add to Home Screen / Install app) and a clear **in-app path** to instructions — without bringing back the PWA extras that added maintenance and UX risk.

Post-launch, users asked how to “install” the site. Today there is no manifest, no install icons, and no install guidance; **Keep screen awake** and **Really fullscreen** (which remain) answer “leave it running,” not “put an icon on my device.”

**Ship:**

| Piece | Purpose |
|-------|---------|
| `site.webmanifest` + PNG icons + `index.html` manifest link | Enables real install / Add to Home Screen |
| New hash route (e.g. `#/install`) | Static, multi-platform install guide on one page |
| Menu item **Install app / Add to home screen** | Same label in header menu and home diagram menu → that route |
| Light cross-links | Install route ↔ **Stick it on the wall** (`#/onwall`) |

**Do not ship again:**

- Service worker, offline shell, `beforeinstallprompt` interception, in-menu expandable install steps
- Standalone first-run overlay (keep-awake card)
- `orientation.lock` in installed mode
- `pwaDisplayMode` / standalone-only menu affordances (unless a future need appears)

**Unchanged:**

- Screen Wake Lock (**Keep screen awake**), Fullscreen API (**Really fullscreen**), portrait rotate hint on home, `vercel.json` asset caching
- Global first-visit UX for all visitors (separate from install)
- **Stick it on the wall** — retained; mission unchanged (permanent display story + menu-operational features)

---

## 2. Rationale

### 2.1 Why install came out, and what still applies

The May 2026 strip (`988b66c`) removed manifest, icons, install help, standalone onboarding, and orientation lock because the stack felt like **needless complexity** for “mostly an icon,” while wake lock and fullscreen already worked in a tab. Earlier, expandable menu install and `beforeinstallprompt` had caused **dual paths and clipping** on phones (`2496d7a`, `ff8cb4d`).

Those lessons still hold: we should not fight the browser’s native install UI or cram platform steps into a flyout.

What over-corrected: removing the **manifest** and **any** install path. Users were left with no durable launcher story.

### 2.2 What we sell (and what we do not)

**Sell only:** a convenient, durable **launch button** (home screen / dock / app list) that opens the site in a focused window.

**Do not bundle into install copy:** keep-awake, fullscreen, landscape lock, or “always-on display” framing. Those stay on **Stick it on the wall** and in the menu after the user is already running the app.

### 2.3 Copy and UX policy

**One app menu, two access routes.** Header `PrimaryNavMenu` and the home diagram menu are the same conceptual menu: shared `PrimaryMenuContent`, different chrome (styling/anchor only). The install item appears in **both** so home users and document-route users get the same entry.

**Universal menu label:** `Install app / Add to home screen` — long, but accurate on every platform without runtime branching.

**No conditional copy at runtime.** Do not show different menu text or route body per `userAgent`. Instead, the install route presents **parallel static sections** (e.g. iPhone/iPad, Android, computer); everyone sees the same page and scrolls to their section.

**Menu hands off to a route.** A single link keeps the flyout short (avoids old clipping) and provides space for full guidance without duplicating steps in the menu.

**No PWA first-run card.** Site-wide first-visit UX already exists; a standalone-only overlay duplicated onboarding and pushed wake lock at the wrong moment.

**No installed landscape lock.** Rotation stays user-controlled; home already nudges portrait mobile users via letterbox copy. Forcing landscape in standalone broke the location picker experience when lock did not release.

**No `beforeinstallprompt` handler.** Browser-native install only; avoids inconsistent “Install button vs manual steps” behaviour documented in the old log.

### 2.4 Install route vs Stick it on the wall

| Route | Role |
|-------|------|
| **Install** (new) | *How* — get an icon on **this** device; all platforms visible on one page |
| **Stick it on the wall** (existing) | *Why / then what* — kitchen, guesthouse, pub; after it is running, use menu for keep awake and really fullscreen |

Cross-links only, e.g. install page: “Once it opens from your icon, see Stick it on the wall if you are leaving a screen on.” On-wall: “To open from an icon on the device, see Install app / Add to home screen.”

Menu order (suggested): install link, then **Stick it on the wall**, then the rest of the existing items — mechanism before use case, or the reverse if user testing prefers motivation first.

---

## 3. Technical scope

### 3.1 Restore from git (`988b66c^` / `9d9311b`)

- `public/site.webmanifest` — `display: standalone`, `orientation: any` (not `landscape`), theme/background `#090a0f`, icons 192 + 512
- `public/icon-192.png`, `public/icon-512.png`
- `index.html` — `<link rel="manifest">`, `theme-color`, description mentioning install where appropriate

**No service worker** — unchanged product decision (see git `3c8b538:docs/planning/pwa/implementation.md` if needed).

### 3.2 New work

- Router + `InstallRoute.svelte` (name/id to match repo conventions, e.g. `install`)
- Document-mode page: shared lede + static sections per platform family (copy in markup, not UA switches)
- `PrimaryMenuContent`: hash link with exact menu label **Install app / Add to home screen**
- Optional: telemetry route id for install page visits (mirror `onwall`)

### 3.3 Explicitly not restored

```
src/ui/routes/home/installFlow.ts          # UA-conditional steps — replace with static route copy
createInstallObserverStore / beforeinstallprompt
src/ui/routes/home/pwaDisplayMode.ts
src/ui/routes/home/orientationLock.ts
src/ui/routes/home/pwaPreferences.ts       # standalone setup dismiss prefs
HomePwaStandaloneSetupOverlay.svelte
?pwaSetup=1 dev flags
Software Nerd “Installed app” section      # optional one-line link to MDN later
```

### 3.4 Already in the repo — wire mentally, do not duplicate

```
src/ui/routes/home/keepAwake*.ts
src/ui/routes/home/fullscreen*.ts
src/ui/routes/home/fullscreenBrowserAdvice.ts
src/ui/routes/home/screenWakeLock.ts
vercel.json
src/ui/components/PrimaryMenuContent.svelte   # extend, don’t fork menus
```

---

## 4. Implementation phases

1. **Manifest + assets** — restore manifest and icons; verify installability (Lighthouse / Chrome Application panel).
2. **Install route** — static multi-platform content; register route in router, `App.svelte`, `routeSurfaceMode`, README route table.
3. **Menu** — add link to `PrimaryMenuContent` only; confirm header + diagram menu parity.
4. **Cross-links** — install ↔ `#/onwall`; sanity-check on-wall copy does not promise install steps inline.
5. **QA** — iPhone Safari (Add to Home Screen), Android Chrome (Install app), desktop Chrome/Edge; open installed shortcut; home + `#/location` rotation without lock; keep awake + fullscreen unchanged.

---

## 5. Previous implementation (brief reference)

For archaeology only — not a target state.

The old PWA was **not** offline-first: manifest + install UX + optional standalone extras. Wake lock and fullscreen were later kept when the rest was stripped.

| Area | Peak behaviour | Removed |
|------|----------------|---------|
| Install | Menu accordion; later `beforeinstallprompt` button; then manual steps only; then menu → on-wall only | `988b66c`, earlier `ff8cb4d`, `2496d7a` |
| Standalone | First-run keep-awake overlay; “show setup again” in menu | `988b66c` |
| Orientation | Silent landscape lock in standalone; unlock on location route | `988b66c` (manifest uses `orientation: any`) |
| Manifest | Icons, standalone display | `988b66c` |

**Still true without PWA:** letterbox + rotate hint on portrait phones; location route portrait requirement on phones; Vercel cache headers for hashed assets.

Original product intent (git `3c8b538:docs/planning/pwa/pwa-rationale.md`): instrument / wall display — landscape-friendly home, stay awake, easy relaunch — **without** offline, push, or kiosk. The **decided plan** keeps that intent but separates **launcher** (install route) from **running on a wall** (on-wall + menu tools).

---

## 6. Git reference

| Milestone | Commit |
|----------|--------|
| Manifest + icons | `9d9311b` |
| Vercel cache headers | `fe23d8e` (still present) |
| `beforeinstallprompt` removed | `2496d7a` |
| Manifest `orientation: any` + unlock on location | `5e9cfbc` |
| Menu install → on-wall link only | `ff8cb4d` |
| Full PWA strip | `988b66c` |
| Fullscreen iOS advice (retained) | `bea8cc8` |

```bash
git show '988b66c^:public/site.webmanifest'
git diff 988b66c^ 988b66c --stat
```

Planning docs from the first PWA pass: `git show 3c8b538:docs/planning/pwa/implementation.md` (and siblings).
