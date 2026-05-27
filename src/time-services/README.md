# Time services (`src/time-services/`)

Local civil time primitives and wall-clock cadence. No HTTP, no `localStorage`, no diagram or SVG.

## Civil day

| Module | Role |
|--------|------|
| `civilDayWindow.ts` | Half-open local civil-day interval (`CivilDayWindow`), `TimeNowProvider`, `SystemTimeNowProvider`. |
| `currentCivilDayWindow.ts` | Resolves “today” from a provider; `civilDayWindowFromHostClock()` for the live app. |

Slicing stored extremes to the active window lives in `data-pipelines/civilDayExtremes.ts`. Midnight rollover **policy** (when to refetch) lives in `application/civilDayRolloverRefresh.ts` and `civilDayRolloverTick.ts`.

## Wall-clock cadence

| Module | Role |
|--------|------|
| `minuteCadence.ts` | `subscribeMinuteCadence` — aligned local minute boundaries. |

Wiring: `ui/App.svelte` (civil-day rollover tick), `ui/routes/home/HomeRoute.svelte` (diagram regen on minute roll).

## Tide-day shape (diagram input)

| Module | Role |
|--------|------|
| `extremaPattern.ts` | `classifyExtremaPattern` — conservative “atypical day” detector for diagram copy/branching. |

Consumed by `application/buildDiagramSpec.ts` and diagram dev previews.

## Related (outside this folder)

- `application/localTimeStrings.ts` — `timeNow` / BRHC date strings for live and frozen diagram previews.
- Home’s minute tick also runs `application/nextTideSemantics.ts` after diagram spec build.

Normative civil-day and diagram behaviour: [`docs/specs/tide-diagram.md`](../../docs/specs/tide-diagram.md).
