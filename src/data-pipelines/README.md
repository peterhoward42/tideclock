# Data pipelines (`src/data-pipelines/`)

Network fetch, persistence adapters, and selectors between the proxy and application layer. No DOM, no diagram generation.

## Tide fetch and store

| Module | Role |
|--------|------|
| `fetchProxyV1Tides.ts` | HTTP to tide proxy; quota error classification. |
| `fetchPersistExtremes.ts` | Proxy → domain model → `localStorage` snapshot. |
| `extremesSnapshot.ts` | Snapshot key, serde, loader/storer seams. |
| `buildFromProxy.ts` | Wire JSON → `TideExtremesAtLocation`. |

## Civil-day slice (uses `time-services/`)

| Module | Role |
|--------|------|
| `civilDayExtremes.ts` | Bookend validation + in-window slice; `loadStoredCivilExtremes`. |

Application façade: `application/civilDayExtremesQuery.ts`.

## Location persistence

| Module | Role |
|--------|------|
| `townPickSerde.ts` | `current-location` key, JSON validation. |
| `townPick.ts` | `loadTownPick` / `storeTownPick` over injectable storage. |

Corpus and picker query: [`../data/README.md`](../data/README.md).
