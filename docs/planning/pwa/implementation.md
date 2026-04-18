# PWA implementation judgments (draft)

This document turns the open questions in `key-questions.md` into concrete implementation direction, aligned with `pwa-rationale.md`. It is meant to be revised as we learn more from real devices and browsers.

---

## Caching

### What actually ships in this stack

The app is a Vite-built Svelte SPA. A production build emits at least:

- An `index.html` shell that loads the bundled JavaScript (and typically separate hashed CSS asset files produced from Svelte component styles).

So the mental model should not be “JS only with no HTML/CSS,” but rather: **a small HTML entry, plus hashed static assets, plus whatever the browser fetches at runtime** (your existing API traffic and any in-app caching logic you already own).

### Separation of concerns

- **Application / domain data** (tide API, your sophisticated fetch and cache layers): keep exactly as today. Do not duplicate that policy inside a service worker unless there is a future, explicit requirement. That preserves the product definition and avoids two sources of truth for freshness rules.
- **PWA / transport layer** (service worker, if we add one): focus on **static shell assets** only—HTML, JS, CSS, fonts, icons, and the web app manifest. Treat this as “make repeat visits and cold starts snappy,” not “offline tide correctness.”

### How to use PWA caching given frequent deploys

Vite’s default file naming (`[name]-[hash].js` / `.css`) is the main lever: **when you deploy, asset URLs change**, so browsers (and a well-written precache list) naturally stop using obsolete hashed files for those entries.

Recommended pattern for early rapid iteration:

1. **Precache** the build’s static asset URLs (generated at build time, e.g. via Workbox injectManifest or a mature Vite PWA plugin). Hashed assets are safe to precache aggressively.
2. Treat **`index.html` carefully**. A purely “cache first” HTML shell can leave some users on an old bootstrap until the service worker updates. Prefer **network-first for `index.html`** (or equivalent: always try network, fall back to cache), so new deploys propagate quickly even when a service worker is present.
3. On **service worker updates**, use a simple, honest UX pattern: detect `waiting` worker, then either prompt for reload or auto-reload once—so multiple deploys per day do not strand users on stale app code for long.

This satisfies “cache other things for faster load” without entangling the service worker in your domain cache, and it respects “we ship often.”

### If we skip a service worker initially

Manifest + installability can still be valuable without a service worker on some platforms; startup wins would then come mostly from HTTP caching headers on static assets at the host. That is a valid incremental step if we want to defer SW complexity entirely until needed.

---

## Landscape orientation

### Coexistence with the current home-route behaviour

Keep the existing letterboxing, device-class detection, and portrait “rotate for a bigger diagram” copy as the **baseline** behaviour in all contexts (tab or installed). It already guarantees a valid layout and communicates intent without requiring PWA features.

PWA-specific work should **add** optional tightening on top, not replace that foundation:

1. **Web App Manifest `orientation`**: set to a landscape-biased value (for example `landscape` or `landscape-primary` depending on how strict we want to be across platforms). This is a hint to the OS/browser for the installed shortcut; support varies, so it must remain a hint, not the only plan.
2. **Screen Orientation API (`screen.orientation.lock`)**: attempt only when it is likely to succeed and is not user-hostile—typically when the app is already in an installed / standalone display mode and ideally after a user gesture if the platform requires it. Always catch failures and fall back silently to the existing UX. Do not depend on lock for correctness.
3. **Fullscreen**: the rationale explicitly deprioritises full kiosk mode. Avoid pushing fullscreen purely to unlock orientation lock unless we later decide the trade-off is acceptable.

Net: **manifest hint + best-effort lock in installed contexts**, with the current portrait messaging as the universal safety net.

---

## Always-on display (wake / brightness)

### What PWA can and cannot do

Installation, `display: standalone`, and related manifest fields improve chrome and launch ergonomics; they **do not** reliably control system sleep or brightness. The meaningful web API for the stated goal remains the **Screen Wake Lock API**, which is orthogonal to “PWA” but pairs naturally with an always-on instrument use case.

### Recommended choices

1. **Wake lock as the primary technical lever**: acquire `navigator.wakeLock.request('screen')` when the app is in active use for the home / instrument view, and **re-acquire** when the document becomes visible again (wake locks can be dropped by the browser on visibility change, tab backgrounding, or battery policy).
2. **Transparent degradation**: if the API is missing, permission-denied, or the lock is released, continue working with no hard dependency—matching the rationale’s progressive enhancement stance.
3. **Optional subtle UI** (as the rationale already suggests): a small indicator when wake lock is active helps debugging and sets expectations without implying a guarantee.
4. **Copy and expectations**: light-touch guidance for “wall tablet” setups can mention OS display sleep settings and power supply. That is honest where web APIs cannot promise behaviour.

### What not to rely on

Hacky patterns (hidden video loops, etc.) are brittle, often throttled, and conflict with the goal of a calm, appliance-like instrument. Prefer standards-based wake lock plus clear fallbacks.

---

## Summary table

| Concern              | Direction                                                                 |
| -------------------- | ------------------------------------------------------------------------- |
| Domain/API caching   | Unchanged; remain the single source of truth in app code                   |
| PWA / static caching | Optional SW: precache hashed assets; careful network-first policy for HTML; fast SW update + reload |
| Rapid deploys        | Rely on hashed filenames + SW update flow; avoid cache-first HTML         |
| Landscape            | Keep current layout UX; add manifest orientation + best-effort orientation lock in installed contexts |
| Sleep / dimming      | Wake Lock API with re-acquire on visibility; manifest does not substitute |

---

## Open follow-ups for later sessions

- Confirm target browsers and devices (especially iOS Safari vs Chrome on Android) for wake lock and orientation hints, and document known limitations.
- Decide whether v1 ships **manifest-only** or **manifest + minimal service worker**, based on how much installability each platform requires for the “appliance” story.
- If a service worker is added, pick the concrete tooling (e.g. Workbox injectManifest vs a maintained Vite PWA plugin) and align it with CI’s build output paths.
