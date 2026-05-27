# Application layer (`src/application/`)

Orchestration between data pipelines, time services, diagram-generation, and the UI shell. No DOM, no HTTP adapters, no SVG rendering.

## Refresh and civil-day policy

| Module | Role |
|--------|------|
| `tideRefreshController.ts` | Serial tide reloads; stale completions ignored; maps quota errors to `onQuotaExhausted`. |
| `civilDayRolloverRefresh.ts` | Pure predicate: should the host refetch after local midnight? |
| `civilDayRolloverTick.ts` | Minute-tick adapter: shell snapshot → refresh decision. |
| `minuteCadence.ts` | Local wall-clock minute subscription (App rollover + Home diagram regen). |
| `civilDayExtremesQuery.ts` | Civil-day tide query façade (storage → slice → fetch); see data-pipelines for I/O. |

Wiring lives in `ui/App.svelte` (load + rollover) and `ui/routes/home/HomeRoute.svelte` (diagram regen).

## Diagram build

| Module | Role |
|--------|------|
| `buildDiagramSpec.ts` | Domain extremes + local time → open `DiagramSpec` for generation. |
| `nextTideSemantics.ts` | Derives `spec.semantic.nextTide` on the minute cadence. |
| `localTimeStrings.ts` | Shared `timeNow` / BRHC date strings for live and frozen previews. |
| `diagramCollaborator.ts` | App-facing entry into `diagram-generation/` (build, scene, styles). |

Production Home uses `buildDiagramSpecWithDerivedNextTide()` (base spec → semantics → injected spec).

## Developer previews (DEV only)

Two catalogs, two query params (see root [README](../README.md#developer-previews)):

| Folder | Query param | Simulates |
|--------|-------------|-----------|
| `tide-dev-preview/` | `tideUxPreview` | Tide **load path** (failed, stuck, empty day, quota). |
| `diagram-dev-preview/` | `diagramPreview` | **Frozen diagram** scenarios (no more tides, time-delta bands, atypical day). |

`diagram-dev-preview/resolveForHome.ts` is the Home resolver: live vs waiting vs frozen clock + optional extremes override.
