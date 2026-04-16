# Refactor state (code-first thread)

Created from a fresh pass: judgements from **source and tests** only.  
**Not used as input:** `docs/planning/log.txt`, other historical `docs/planning/*` (per project direction).  
**Orientation only:** `docs/specs/elevator-pitch.md`; `docs/specs/tide-diagram.md` skimmed for vocabulary and generator vs host split—not a line-by-line audit against the spec.

## Test baseline

- `npm test` (Vitest): **21 files, 137 tests**, all passing (session date in repo: 2026-04-16).

## Layer map (observed)

| Area | Role (short) |
|------|----------------|
| `src/ui/` | Svelte shell, routes, dial SVG mapping; `App.svelte` orchestrates load, routing, rollover refresh. |
| `src/application/` | Civil-day queries, tide extremes refresh orchestration, diagram spec building, semantic cadence, dev diagram previews, typed bridge to diagram engine. |
| `src/data-pipelines/` | Proxy fetch, localStorage, civil-day extremes shaping, location snapshot helpers. |
| `src/time-services/` | Civil-day display window, atypical-pattern detection. |
| `src/location-services/` | Town search / space query. |
| `src/clock-presentation/` | Home clock dial geometry and screen model (non–diagram-generation). |
| `src/diagram-config/` | Home tide layout/style inputs consumed by spec builder. |
| `src/diagram-generation/` | `.mjs` pipeline: model → layout → scene → `renderSceneSvg`. |
| `src/core-models/` | Tide domain types. |

## Dominant themes (3–5)

1. **Explicit adapter at the TS ↔ diagram-generation boundary**  
   `diagramGenerationCollaborator.ts` centralises `buildDiagram`, `loadStyleModel`, `tideDiagramToScene`, and re-exports the barrel surface app code needs (`buildDiagram`, `renderSceneSvg`, next-tide helpers, layout probes such as `annularBandMaxX`). Only this module imports `diagram-generation/index.mjs` from `src/application/`.

2. **Orchestration density at the UI root**  
   `App.svelte` owns route wiring, storage sync, and Svelte state for tides; tide **refresh serial / stale-completion** policy lives in `tideExtremesRefreshController.ts`. Civil-day **rollover decision** policy remains in `civilDayRolloverTick.ts`. Further thinning is optional unless the shell gains more triggers.

3. **Dev-only diagram preview cluster**  
   `diagramDevPreview*.ts` under `application/diagram-dev-preview/` (catalog, resolve, time-freeze scenarios). Behaviour remains test-backed; further grouping is optional (e.g. a barrel only if import noise grows).

4. **JavaScript islands on the runtime edge**  
   `main.js`, `infrastructure/router.js`, `application/appClock.js`, `ui/dialFrame.js` coexist with pervasive TypeScript. `main.js` uses `// @ts-check` and file-level intent comments; this looks like a deliberate boundary choice (Vite entry, hash router, clock injectable in tests).

5. **Two languages in the diagram stack**  
   Spec construction and domain logic are TypeScript; geometry/layout/scene are plain `.mjs` with tests colocated in `application/` and snapshots. Coherence is already “typed outside, functional inside”—future work is mostly **consistency of import façades**, not a rewrite.

## Proposed dependency discipline (target, not enforced yet)

- **UI routes** → `application/*`, `clock-presentation/*`, `diagram-config/*`; avoid deep imports into `diagram-generation/layout/*` except via the collaborator or a single render entry re-exported from `application/` or `diagram-generation/index.mjs`.
- **`data-pipelines`** → must not import Svelte or route IDs.
- **`diagram-generation`** → no imports from `ui/`; remains pure build/render.

## Out of scope for near-term sessions

- Spec parity audits against every subsection of `tide-diagram.md`.
- Large moves of `diagram-generation` into TypeScript (high churn, low leverage until façade is tidy).
- Reworking `docs/planning/*` legacy narratives.

## Completed this thread (dated)

- **2026-04-16 — Unify diagram render entry:** `renderSceneSvg` is exported from `diagram-generation/index.mjs` and re-exported from `diagramGenerationCollaborator.ts`. `Home.svelte` imports it from the collaborator only; no other `src/ui/` route imported `diagram-generation/**/*.mjs` directly.
- **2026-04-16 — Layer map skim header:** single orienting file-level block on `diagramGenerationCollaborator.ts` (application ↔ `diagram-generation` boundary, `diagram-config` styling, no tide fetch); full table remains authoritative in this file.
- **2026-04-16 — Rollover tick policy in `application/`:** `decideCivilDayRolloverTideRefresh` in `civilDayRolloverTick.ts` composes `shouldTriggerCivilDayRolloverRefresh` and returns a typed `refresh | none` decision; `App.svelte` only applies storage sync, state mutation, and `refreshTideExtremesForTown`. Tests in `civilDayRolloverTick.test.ts`.
- **2026-04-16 — Single façade for `buildDiagram` in tests:** `diagramGenerationCollaborator.ts` re-exports `buildDiagram`; `diagramSemanticInjection.test.ts` imports `buildDiagram` and diagram types from the collaborator only (no direct `diagram-generation/index.mjs` import for that call).
- **2026-04-16 — Tide refresh orchestration in `application/`:** `createTideExtremesRefreshController` in `tideExtremesRefreshController.ts` owns monotonic load serial and stale-completion policy; `App.svelte` wires `loadTideExtremesForCurrentCivilDay`, civil-day window read, and Svelte state via callbacks. Tests in `tideExtremesRefreshController.test.ts`.
- **2026-04-16 — Dev diagram preview package by folder:** moved `diagramDevPreview*.ts` and colocated Vitest files to `src/application/diagram-dev-preview/`; adjusted imports to parent `application/` and `core-models` / `time-services`; `Home.svelte` imports the catalog and resolver from that folder only.
- **2026-04-16 — Single `index.mjs` import in application:** `nextTideSemantics.ts` and `diagramGenerationCollaborator.test.ts` import diagram-generation helpers via `diagramGenerationCollaborator.ts` re-exports only; no other `src/application/**/*.ts` imports `diagram-generation/index.mjs` directly.

## Next session candidates (pick one)

1. **UI shell thinning (theme 2, optional):** only if `App.svelte` gains more triggers—extract further wiring or document the stopping point.

---

*Update this file when a session changes boundaries or completes a slice; keep entries dated in prose if useful.*
