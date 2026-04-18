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

**Why start without a service worker (even temporarily):** you ship often, so every SW bug or mis-tuned cache policy risks stranding users on stale shells or fighting “why did my tide UI not update?” without touching domain caching. Skipping the SW defers that entire class of problems while you still get icons, name, `standalone`, orientation hints, and (where the platform allows) install from manifest alone. It also keeps debugging simpler—no “disable cache” fighting a worker—and avoids committing to a precache/update story until you have evidence that HTTP caching plus hashed assets is insufficient for perceived load. In short: manifest-first validates installability and chrome stripping with minimal moving parts; add a worker when repeat-visit startup or offline shell is worth the operational cost.
<todo> So why consider introducing a SW later at all?

---

## Landscape orientation

### Coexistence with the current home-route behaviour

Keep the existing letterboxing, device-class detection, and portrait “rotate for a bigger diagram” copy as the **baseline** behaviour in all contexts (tab or installed). It already guarantees a valid layout and communicates intent without requiring PWA features.

PWA-specific work should **add** optional tightening on top, not replace that foundation:

1. **Web App Manifest `orientation`**: set to a landscape-biased value (for example `landscape` or `landscape-primary` depending on how strict we want to be across platforms). This is a hint to the OS/browser for the installed shortcut; support varies, so it must remain a hint, not the only plan.
2. **Screen Orientation API (`screen.orientation.lock`)**: attempt only when it is likely to succeed and is not user-hostile—typically when the app is already in an installed / standalone display mode and ideally after a user gesture if the platform requires it. Always catch failures and fall back silently to the existing UX. Do not depend on lock for correctness.
3. **Fullscreen**: the rationale explicitly deprioritises **kiosk** as a product pattern (dedicated wall hardware with OS-level lockdown). That is different from **optional fullscreen in the browser/PWA** on phones and tablets, where hiding browser chrome strengthens the “instrument” illusion without claiming we are building a managed appliance. **Direction:** pursue fullscreen (or `standalone`-equivalent chrome removal via install) primarily on **tablet and phone** form factors; on **desktop**, default to normal windowed/tab behaviour so laptop users retain expected browser affordances (tabs, URL bar if they want it, multi-window workflows). Fullscreen remains user-triggered or clearly opt-in where platforms require a gesture; failures fall back to current letterboxed behaviour. Orientation lock, if ever paired with fullscreen, stays best-effort and separate from “kiosk mode” as a deployment story.
<todo>I figure some users if they like playing around the product will want to put it on a big monitor on the wall - probably with a desktop driving it. It would be good if there was a way for them to omit the browser chrome if they wanted to. 

Net: **manifest hint + best-effort lock in installed contexts**, with optional fullscreen on handheld/tablet classes only; the current portrait messaging remains the universal safety net.

---

## Always-on display (wake / brightness)

### What PWA can and cannot do

Installation, `display: standalone`, and related manifest fields improve chrome and launch ergonomics; they **do not** reliably control system sleep or brightness. The meaningful web API for the stated goal remains the **Screen Wake Lock API**, which is orthogonal to “PWA” but pairs naturally with an always-on instrument use case.

### Recommended choices

1. **Wake lock as the primary technical lever**: acquire `navigator.wakeLock.request('screen')` when the app is in active use for the home / instrument view, and **re-acquire** when the document becomes visible again (wake locks can be dropped by the browser on visibility change, tab backgrounding, or battery policy).

   **Shipping wake lock before a full PWA push is reasonable:** the API is largely orthogonal to manifests and service workers—it depends on secure context, user engagement patterns, and visibility handling, not on installability. Implementing it early validates behaviour on real phones and tablets (including iOS quirks and permission drops), lets you tune re-acquire logic and any subtle “wake active” UI, and delivers user value in the tab as well as in `standalone`. The main caveat is testing matrix overlap with Safari/Chrome, which you will need for PWA anyway; there is little downside to sequencing wake lock first if the instrument view is already the focal experience.

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
| Landscape / chrome   | Keep current layout UX; manifest orientation + best-effort orientation lock in installed contexts; optional fullscreen on tablet/phone, not default on desktop |
| Sleep / dimming      | Wake Lock API with re-acquire on visibility; manifest does not substitute |

---

## Open follow-ups for later sessions

- Confirm target browsers and devices (especially iOS Safari vs Chrome on Android) for wake lock and orientation hints, and document known limitations.

  **What “target browsers” actually commits you to:** it is not a contract to fix every old engine or to block features every other browser lacks. In practice it means: (1) **manual and automated smoke coverage** on the matrix you named—Windows/macOS desktops and laptops (Chrome, Edge, Safari), Android phones (Chrome), iOS phones (Safari)—so regressions in layout, wake lock, install, and orientation are caught early; (2) **feature detection + graceful degradation** as the default pattern, so “unsupported” is a defined state, not an accident; (3) **documented baselines** (“last ~N major versions” or “evergreen + current iOS”) so future you knows when it is acceptable to drop a polyfill or adopt a newer API; (4) optionally **esbuild/tsconfig browserslist** alignment so you do not transpile for dead engines forever—but that is a build optimisation, not a promise to users. Firefox and niche browsers can remain “best effort” if traffic is negligible. **Pushback worth internalising:** Safari on iOS is often the constraint for wake lock, orientation lock, and some PWA install flows; “Chrome + Edge + Safari, recent” already implies **testing Safari on real iOS devices**, not only desktop Safari.

- Decide whether v1 ships **manifest-only** or **manifest + minimal service worker**, based on how much installability each platform requires for the “appliance” story.
- If a service worker is added, pick the concrete tooling (e.g. Workbox injectManifest vs a maintained Vite PWA plugin) and align it with CI’s build output paths.

  **Tooling choice—what it commits you to:** a **maintained Vite PWA plugin** (typically Workbox under the hood) optimises for **convention and speed**: configure precache/runtime caching in `vite.config`, get generated service worker and manifest wiring with less custom glue, and inherit community fixes as Vite evolves—at the cost of **abstraction thickness** and occasional “fight the plugin” moments when defaults do not match your deploy layout or you need unusual strategies. **Workbox `injectManifest` directly** means you **own the service worker source file** and Workbox only injects the precache manifest at build time: maximum control over routing, update flow, and logging, and a clean mental model for reviewers—but you **write and maintain more boilerplate** and must keep build paths, `globDirectory`, and revision logic in sync with CI yourself. Both approaches can produce equivalent runtime behaviour; the trade-off is **maintainer ergonomics vs explicitness**. Aligning with CI is the same either way: the precache step must see the **post-build** asset directory Vite emits, and the SW must be served from **site root** (or consistent scope) so `navigator.serviceWorker.register` paths match.
  <todo>Whichever choice makes my life simpler would be the right choice here. It's a small one person, part time project. I don't have CI - the deployment platform is Vercel - so all I have to do is git push when I want to deploy. You could say that is some implicit CI - in that the Vercel pipeline might run the tests, I don't know.
