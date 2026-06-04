# Vercel Telemetry Planning

## Big picture aim

Change the existing telemetry solution in `src/infrastructure/telemetry` to use **Vercel Web Analytics** instead of the custom telemetry service currently provisioned.

Remove all traces of the old solution afterwards, so the code looks like it was designed for the Vercel backend from the start.

## Event types

See `[eventType.ts](../../src/infrastructure/telemetry/eventType.ts)`.

- The `loaded` event no longer needs to be emitted explicitly because it is implicit for Vercel analytics.
- I no longer want the `data_fetch_from_proxy` event.
- All the other current events should be implemented.

## Proxy user ID

The current implementation depends on a `proxyUserId` value, which becomes unused — remove all traces of `proxyUserId` (module, `localStorage` key, boot init, tests).

## Best efforts

Problems during the performing of telemetry must not interfere with the app’s happy path.

## Speed insights

I am not interested in putting in Speed Insights.

---

## Assumptions (review these)

These are defaults for the implementation plan below. Change any that you disagree with before coding.


| #   | Assumption                                                                                                                                                                                                                                                                           |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| A1  | **Clean cut** — no parallel run of old ingest and Vercel; one deploy switches traffic.                                                                                                                                                                                               |
| A2  | **Custom events only** — no manual `pageview()` on hash route changes. Route interest is covered by `visited_*` custom events (hash SPA auto pageviews are unreliable; see prior discussion). Dashboard “top pages” will mostly show `/` unless we add pageviews later.              |
| A3  | **Event names unchanged** — Vercel `track()` uses the same string names as today’s `TelemetryEventType` values (e.g. `visited_story`, `set_custom_loc`) so mental model and any informal notes stay stable.                                                                          |
| A4  | **Errors** — one custom event name `error` with a flat property `reason`: `tide_load_failed`, `tide_quota_exhausted`, or `diagram_render_failed` (replaces `eventParams` on the old payload).                                                                                        |
| A5  | `**set_custom_loc`** — keep human-readable location in a flat property `label` (e.g. `Looe - Cornwall`), truncated to 200 characters as today. Coarsening for privacy is **not** required.                                                                                           |
| A6  | **Production only** — call `inject()` only when `import.meta.env.PROD` is true (matches `@vercel/analytics` dev behaviour and avoids needing analytics config locally).                                                                                                              |
| A7  | **Web Analytics enabled in Vercel before first SDK deploy** — done in Phase 0 (dashboard step); no env var for analytics URL.                                                                                                                                                        |
| A8  | **Thin wrapper** — `src/infrastructure/analytics/trackProductEvent.ts` wraps `track()` in try/catch; telemetry must never throw. On catch: `console.warn('[tideclock] analytics', …)` with event name only (no user data), so failures are visible in devtools without affecting UX. |
| A9  | **Keep `outboundLinkTelemetry.ts`** — see [Why keep outboundLinkTelemetry?](#why-keep-outboundlinktelemetry) below; only the emit path changes.                                                                                                                                      |
| A10 | **Decommission ingest outside repo** — retire the cloud telemetry receiver and any dashboards that read it; not tracked as a code task here.                                                                                                                                         |
| A11 | **No Vercel Toolbar** — analytics viewed in the Vercel dashboard, not in-app.                                                                                                                                                                                                        |
| A12 | **Remove `ulid` dependency** if it is only used by `proxyUserId.ts` after removal.                                                                                                                                                                                                   |
| A13 | **Folder name** — retained helpers live under `src/infrastructure/analytics/` (not `telemetry/`).                                                                                                                                                                                    |


### Why keep outboundLinkTelemetry?

This file does **not** send anything to a server. It only answers: “did this click target the virtual coffee URL or DrawExact?”

`StoryRoute.svelte` uses it in `handleOutboundTelemetryClick`: many links on the page, but telemetry should fire only for those two outbound destinations. The helpers centralise URL matching (origin/path normalisation) so Story markup does not duplicate that logic.

After migration, Story still calls `isCoffeeOutboundHref` / `isDrawExactOutboundHref`, then out`trackProductEvent('clicked_thru_to_coffee')` etc. Removing the file would mean inlining the same checks in the route or duplicating them elsewhere — no benefit.

---

## Event mapping (old → Vercel)


| Old                                                   | Vercel                                                       |
| ----------------------------------------------------- | ------------------------------------------------------------ |
| `loaded`                                              | *(drop — see [Replacing `loaded](#replacing-loaded)` below)* |
| `data_fetch_from_proxy`                               | *(drop)*                                                     |
| `set_custom_loc` + `eventParams`                      | `track('set_custom_loc', { label })`                         |
| `visited_`* (route mapper + direct emits)             | `track('visited_…')` — same names                            |
| `used_screen_awake`, `used_really_full`               | `track(...)` — unchanged names                               |
| `clicked_thru_to_coffee`, `clicked_thru_to_drawexact` | `track(...)` — unchanged names                               |
| `error` + `eventParams`                               | `track('error', { reason })`                                 |


### Replacing `loaded`

Today `loaded` fires once per app **mount** (`onMount` in `App.svelte`) — i.e. each full document load or refresh, not “this browser’s first visit ever.”

Vercel’s implicit signal is different but close enough for intent:

- **Page view** — counted on each full load of the site (and on History API navigations if you wire them; we are not, per A2). For this hash SPA, expect roughly **one pageview per visit** landing on `/`, not one per `#/route` hop.
- **Visitor** — a privacy-oriented daily hash per browser; not the same as the old `proxyUserId` ULID across days.

So dropping `loaded` does **not** mean “only the device’s first visit.” It means visitor/pageview aggregates are handled by Vercel automatically, while **in-app navigation** is tracked via `visited_`* custom events, not duplicate `loaded` pings.

**Route → event** (unchanged logic in `routeVisitTelemetry.ts`, under `analytics/`):


| Hash route id  | Event                   |
| -------------- | ----------------------- |
| `install`      | `visited_install`       |
| `onwall`       | `visited_stick_on_wall` |
| `story`        | `visited_story`         |
| `tidenerd`     | `visited_tide_nerd`     |
| `softwarenerd` | `visited_sw_nerd`       |
| `about`        | `visited_about`         |


`visited_contact` stays emitted from `HomeRoute.svelte` and `PrimaryNavMenu.svelte` (not the route mapper).

---

## Suggested implementation plan

### Phase 0 — Vercel (ops, no repo) — **required before Phase 5**

1. **Enable Web Analytics** — Vercel dashboard → select tideclock project → **Analytics** → **Enable**. (Satisfies A7; blocks meaningful data until done.)
2. Confirm production domain (`thetidedial.page`) is the deployment you care about.
3. *(After first SDK deploy)* Spot-check **Analytics** tab (visitors + custom events). No toolbar or Speed Insights required.

### Phase 1 — Add Vercel analytics (keep old code temporarily)

1. `npm install @vercel/analytics`.
2. Add `src/infrastructure/analytics/trackProductEvent.ts`:
  - `injectProductAnalytics()` — `inject()` from `@vercel/analytics` when `import.meta.env.PROD`.
  - `trackProductEvent(name, properties?)` — wraps `track()` in try/catch; on failure `console.warn('[tideclock] analytics', …)` (A8); never throws.
  - `trackProductError(reason)` — shorthand for `track('error', { reason })`.
3. Call `injectProductAnalytics()` once from `main.js` (client-only).
4. **Do not remove old telemetry yet** — optional smoke: wire one event, or skip and proceed to Phase 2.

### Phase 2 — Switch call sites

Replace imports from `emitTelemetry` / `emitTelemetryError` / `emitRouteVisitTelemetry`:


| File                                                  | Change                                                                                                                                                            |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/ui/App.svelte`                                   | Remove `loaded`, `data_fetch_from_proxy`; route subscribe → route visit helper; `set_custom_loc` → `trackProductEvent` with `label`; errors → `trackProductError` |
| `src/infrastructure/analytics/routeVisitTelemetry.ts` | Move from `telemetry/`; call `trackProductEvent`                                                                                                                  |
| `src/ui/routes/home/HomeRoute.svelte`                 | Errors, fullscreen, contact                                                                                                                                       |
| `src/ui/routes/home/keepAwakeUi.ts`                   | Screen awake                                                                                                                                                      |
| `src/ui/routes/StoryRoute.svelte`                     | Outbound clicks (still uses `outboundLinkTelemetry.ts`)                                                                                                           |
| `src/ui/components/PrimaryNavMenu.svelte`             | Contact                                                                                                                                                           |


Update `eventType.ts` — remove `loaded` and `data_fetch_from_proxy`; types are Vercel custom event names.

### Phase 3 — Remove old stack

**Delete files:**

- `src/infrastructure/telemetry/emitTelemetry.ts`
- `src/infrastructure/telemetry/telemetryClient.ts`
- `src/infrastructure/telemetry/telemetryClient.test.ts`
- `src/infrastructure/telemetry/telemetryPayload.ts`
- `src/infrastructure/proxyUserId.ts`
- `src/infrastructure/proxyUserId.test.ts`
- Empty `telemetry/` directory after moves

**Relocate to `src/infrastructure/analytics/`:**

- `eventType.ts`, `errorEventParam.ts`, `routeVisitTelemetry.ts`, `outboundLinkTelemetry.ts`

**Edit:**

- `src/main.js` — remove `initProxyUserIdAtBoot`, telemetry env boot logs; keep tide proxy logs.
- `src/vite-env.d.ts` — remove `VITE_TELEMETRY_BASE_URL`.
- `.env.example`, `README.md`, `build/README.md`, `src/infrastructure/README.md` — remove telemetry URL and proxy user id docs.
- `package.json` — remove `ulid` if unused (A12).

### Phase 4 — Tests

1. Replace `telemetryClient.test.ts` with tests for `trackProductEvent`:
  - does not throw when `track` throws;
  - `console.warn` on swallow (mock or spy);
  - passes through name and properties when tracking runs;
  - inject skipped in test/dev as designed.
2. Keep or adapt tests for route visit mapping (pure function — no HTTP).
3. Run `npm test` and production build.

### Phase 5 — Deploy and verify

1. **Confirm Phase 0 complete** (Web Analytics still enabled).
2. Remove `VITE_TELEMETRY_BASE_URL` from Vercel project environment variables.
3. Deploy to production.
4. In browser (logged-out visitor): use app — change route, pick location, trigger a known path (e.g. Story → coffee link).
5. Vercel dashboard → **Analytics**: confirm visitors and custom event panels populate (may lag slightly).
6. Decommission old ingest service (A10).

---

## Call site checklist (grep-driven)

After Phase 3, these should **not** appear in `src/`:

- `emitTelemetry`, `emitTelemetryError`, `postTelemetryEvent`
- `VITE_TELEMETRY_BASE_URL`, `proxyUserId`, `initProxyUserIdAtBoot`
- `tideclock.proxyUserId`

---

## Out of scope (unless objectives change)

- Speed Insights (`@vercel/speed-insights`).
- Vercel Toolbar in production.
- Manual `pageview()` per hash route (A2 — unreliable without explicit wiring; `visited_`* events are the reliable route signal).
- Parallel validation against old ingest.
- In-app analytics UI.
- Migrating historical data from old ingest into Vercel.

---

## Resolved decisions (from review)


| Topic                       | Decision                                                                                                                                 |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| `set_custom_loc` privacy    | Keep `label` as today; no coarsening required (A5).                                                                                      |
| Folder name                 | `src/infrastructure/analytics/` (A13).                                                                                                   |
| `pageview()` on hash routes | **Not** doing — same as A2; optional open item removed because it conflicts with “unreliable unless manual”; custom events cover routes. |
| PWA `visited_install`       | Covered by route mapper when `#/install` exists (`[reintroduce_pwa.md](reintroduce_pwa.md)`).                                            |


