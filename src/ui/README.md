# UI shell (`src/ui/`)

Svelte 5 presentation layer: hash routing, route chrome, home tide instrument, menus, and static copy. No proxy HTTP, no diagram algorithms (those live in `application/` and `diagram-generation/`).

## Entry and routing

| Piece | Role |
|-------|------|
| `App.svelte` | Root shell: route switch, tide load orchestration, operator-notice gate, minute rollover. |
| `routes/Home.svelte` | Thin re-export of `routes/home/HomeRoute.svelte`. |
| [`../infrastructure/router.js`](../infrastructure/router.js) | Hash ↔ `route` store, `navigate`, legacy hash normalisation. |

Surface styling: `routeSurfaceMode.ts` (`appliance` for home, `document` for other routes) → `data-surface-mode` on `.app-frame`.

## Routes

| Route id | Component | Notes |
|----------|-----------|--------|
| `home` | `routes/home/HomeRoute.svelte` | Diagram, menus, dev URL flags. |
| `location` | `routes/LocationRoute.svelte` | Step-back town picker ([`../data/README.md`](../data/README.md)). |
| `about` | `routes/AboutRoute.svelte` | Privacy, cookies, tide data attribution. |
| `onwall` | `routes/OnWallRoute.svelte` | Wall-mount guidance. |
| `story` | `routes/StoryRoute.svelte` | Author story, support links. |
| `tidenerd` | `routes/TideNerdRoute.svelte` | Tide background for visitors. |
| `softwarenerd` | `routes/SoftwareNerdRoute.svelte` | Technical architecture for visitors. |

## Shared components

| Module | Role |
|--------|------|
| `components/AppHeader.svelte` | Document-mode title bar (non-home routes). |
| `components/PrimaryNavMenu.svelte` | Header flyout menu. |
| `components/PrimaryMenuContent.svelte` | Nav links + optional keep-awake section (header and in-diagram menu). |
| `components/PrimaryNavLinks.svelte` | Hash links to routes. |

## Home subfolder (`routes/home/`)

Orchestration in `HomeRoute.svelte`; presentation panels in `HomeRouteTidePanels.svelte`.

| Area | Modules |
|------|---------|
| Diagram DOM | `diagramDom.ts` — menu anchor, dev outline helpers. |
| SVG glue | `menuSvgTriggerWire.ts`, `instrumentLetterboxObserver.ts`. |
| Keep awake | `keepAwakePreferences.ts`, `keepAwakeUi.ts`, `screenWakeLock.ts`, `wakeLockPresentation.ts`, `HomeKeepAwakeSection.svelte`. |
| Display | `fullscreen.ts`, `wakeLockSupport.ts`. |
| Props contract | `routeProps.ts` — `TidePresentation`, `RouteProps`. |

## Cross-route policy (pure TS)

| Module | Role |
|--------|------|
| `displayOptimisation.ts` | Viewport device/aspect classes (store + testable core). |
| `homeLandscapeHint.ts` | Landscape encouragement + letterbox slack math. |
| `homeUrlQuery.ts` | Hash vs `search` query resolution; dev debug flags. |
| `brand.ts` | Product name and production origin. |

## Copy and operator controls

| Module | Role |
|--------|------|
| `quotaExhaustedCopy.ts` | Quota-exhausted panel copy (`TidePresentation.quotaExhausted`). |
| `operatorNoticeCopy.ts` | Full-screen maintenance message copy. |
| `operatorNoticeConfig.ts` | **`OPERATOR_NOTICE_ACTIVE`** — flip and redeploy to disable the app. |

Wiring: operator notice bypasses routing in `App.svelte`; quota and load states render in `HomeRouteTidePanels.svelte`.

## Related layers

- Tide load and rollover: [`../application/README.md`](../application/README.md).
- Location corpus: [`../data/README.md`](../data/README.md).

Normative home diagram: [`docs/specs/tide-diagram.md`](../../docs/specs/tide-diagram.md). Dev preview URLs: root [README](../../README.md#developer-previews).
