# PWA implementation judgments (draft)

This document turns the open questions in `key-questions.md` into concrete implementation direction, aligned with `pwa-rationale.md`. It is meant to be revised as we learn more from real devices and browsers.

---

## Decisions

- **Service worker:** **none**—not for the initial PWA work and not planned afterward for this repo. The upside (tighter precache of hashed assets, optional offline shell) does not justify the ongoing cost for a small, part-time project that ships often: stale-bootstrap risk, update/reload UX, extra debugging surface, and Vercel/build alignment. **PWA value here comes from the web app manifest, installability where the platform allows it, `standalone` chrome, and the other APIs already discussed** (wake lock, orientation, optional fullscreen)—plus normal **HTTP caching** of static assets from the host. Revisit a service worker only if a concrete product requirement appears (for example, a committed “open with no network” shell) *and* measured pain shows host caching plus hashed filenames are insufficient.

---

## Caching

### What actually ships in this stack

The app is a Vite-built Svelte SPA. A production build emits at least:

- An `index.html` shell that loads the bundled JavaScript (and typically separate hashed CSS asset files produced from Svelte component styles).

So the mental model should not be “JS only with no HTML/CSS,” but rather: **a small HTML entry, plus hashed static assets, plus whatever the browser fetches at runtime** (your existing API traffic and any in-app caching logic you already own).

### Separation of concerns

- **Application / domain data** (tide API, your sophisticated fetch and cache layers): keep exactly as today. With **no service worker**, that policy stays in one place; if that architecture ever changed, still avoid duplicating freshness rules in a second transport layer.
- **PWA / transport layer (without a service worker):** there is no second cache layer for the shell. **Static performance** is whatever the browser does with **immutable hashed** JS/CSS (Vite’s default) plus **`index.html`** fetched normally from Vercel—tune **Cache-Control** (or framework defaults) on the host if you need stricter behaviour. **Installability and chrome** come from the **web app manifest** and platform UI, not from precaching via a worker.

### Static assets and frequent deploys (no service worker)

Vite’s default file naming (`[name]-[hash].js` / `.css`) remains the main lever: **when you deploy, asset URLs change**, so repeat visitors pick up new bundles without any SW lifecycle.

Practical focus:

1. **Hashed assets:** safe to serve with long-lived caching headers at the edge; each deploy is a new URL.
2. **`index.html`:** should not be treated as “cache forever”; prefer policies where the HTML is **revalidated or short-lived** so new deploys propagate quickly (exact headers depend on Vercel / adapter configuration—goal is “users get new bootstrap soon,” not aggressive immutable caching of the entry document).
3. **No service worker update flow**—deploys are “just a normal site refresh,” which matches how often you ship.

**Why this is enough for Tideclock’s PWA story:** manifest + install + `standalone` already deliver most of the “instrument in its own window” intent; domain freshness stays in app code; avoiding a worker avoids an entire class of stale-shell and maintenance issues for marginal extra repeat-visit wins on a part-time cadence.

---

## Landscape orientation

### Coexistence with the current home-route behaviour

Keep the existing letterboxing, device-class detection, and portrait “rotate for a bigger diagram” copy as the **baseline** behaviour in all contexts (tab or installed). It already guarantees a valid layout and communicates intent without requiring PWA features.

PWA-specific work should **add** optional tightening on top, not replace that foundation:

1. **Web App Manifest `orientation`**: set to a landscape-biased value (for example `landscape` or `landscape-primary` depending on how strict we want to be across platforms). This is a hint to the OS/browser for the installed shortcut; support varies, so it must remain a hint, not the only plan.
2. **Screen Orientation API (`screen.orientation.lock`)**: attempt only when it is likely to succeed and is not user-hostile—typically when the app is already in an installed / standalone display mode and ideally after a user gesture if the platform requires it. Always catch failures and fall back silently to the existing UX. Do not depend on lock for correctness.
3. **Fullscreen**: the rationale explicitly deprioritises **kiosk** as a product pattern (dedicated wall hardware with OS-level lockdown). That is different from **optional fullscreen in the browser/PWA** on phones and tablets, where hiding browser chrome strengthens the “instrument” illusion without claiming we are building a managed appliance. **Direction:** pursue fullscreen (or `standalone`-equivalent chrome removal via install) primarily on **tablet and phone** form factors; on **desktop**, default to normal windowed/tab behaviour so everyday laptop use keeps expected browser affordances (tabs, URL bar, multi-window workflows). **Wall / big-monitor desktop setups** are a real secondary persona: the same **opt-in fullscreen** (or installing the PWA in `standalone` on desktop Chrome/Edge, which drops browser chrome without kiosk) should remain available so enthusiasts can drive a large display from a desktop machine without us forcing that mode on everyone. Fullscreen stays user-triggered or clearly labelled where platforms require a gesture; failures fall back to current letterboxed behaviour. Orientation lock, if ever paired with fullscreen, stays best-effort and separate from “kiosk mode” as a deployment story.

Net: **manifest hint + best-effort lock in installed contexts**, with optional fullscreen emphasised on handheld/tablet and **available but not default** on desktop (including “wall PC” installs); the current portrait messaging remains the universal safety net.

---

## Always-on display (wake / brightness)

### What PWA can and cannot do

Installation, `display: standalone`, and related manifest fields improve chrome and launch ergonomics; they **do not** reliably control system sleep or brightness. The meaningful web API for the stated goal remains the **Screen Wake Lock API**, which is orthogonal to “PWA” but pairs naturally with an always-on instrument use case.

### Recommended choices

1. **Wake lock as the primary technical lever**: acquire `navigator.wakeLock.request('screen')` when the app is in active use for the home / instrument view, and **re-acquire** when the document becomes visible again (wake locks can be dropped by the browser on visibility change, tab backgrounding, or battery policy).

   **Shipping wake lock before or alongside manifest work is reasonable:** the API is largely orthogonal to the web app manifest and install UI—it depends on secure context, user engagement patterns, and visibility handling, not on installability. Implementing it early validates behaviour on real phones and tablets (including iOS quirks and permission drops), lets you tune re-acquire logic and any subtle “wake active” UI, and delivers user value in the tab as well as in `standalone`. The main caveat is testing matrix overlap with Safari/Chrome, which you will need for PWA anyway; there is little downside to sequencing wake lock first if the instrument view is already the focal experience.

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
| PWA / static caching | No service worker; manifest + host HTTP caching; hashed JS/CSS, sensible policy for `index.html` |
| Rapid deploys        | Rely on hashed filenames + normal document load; no SW lifecycle            |
| Landscape / chrome   | Keep current layout UX; manifest orientation + best-effort orientation lock in installed contexts; optional fullscreen (tablet/phone emphasis; desktop/wall via opt-in or installed standalone, not default) |
| Sleep / dimming      | Wake Lock API with re-acquire on visibility; manifest does not substitute |

---

## Open follow-ups for later sessions

- Confirm target browsers and devices (especially iOS Safari vs Chrome on Android) for wake lock and orientation hints, and document known limitations.

  **What “target browsers” actually commits you to:** it is not a contract to fix every old engine or to block features every other browser lacks. In practice it means: (1) **manual and automated smoke coverage** on the matrix you named—Windows/macOS desktops and laptops (Chrome, Edge, Safari), Android phones (Chrome), iOS phones (Safari)—so regressions in layout, wake lock, install, and orientation are caught early; (2) **feature detection + graceful degradation** as the default pattern, so “unsupported” is a defined state, not an accident; (3) **documented baselines** (“last ~N major versions” or “evergreen + current iOS”) so future you knows when it is acceptable to drop a polyfill or adopt a newer API; (4) optionally **esbuild/tsconfig browserslist** alignment so you do not transpile for dead engines forever—but that is a build optimisation, not a promise to users. Firefox and niche browsers can remain “best effort” if traffic is negligible. **Pushback worth internalising:** Safari on iOS is often the constraint for wake lock, orientation lock, and some PWA install flows; “Chrome + Edge + Safari, recent” already implies **testing Safari on real iOS devices**, not only desktop Safari.

- **Ship manifest-led PWA** (icons, name, `display`, orientation hints, etc.) without revisiting a service worker unless the decision block at the top of this doc is explicitly reopened.
