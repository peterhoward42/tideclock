# Refactor state (code-first thread)

Created from a fresh pass: judgements from **source and tests** only.  
**Not used as input:** `docs/planning/log.txt`, other historical `docs/planning/*` (per project direction).  
**Orientation only:** `docs/specs/elevator-pitch.md`; `docs/specs/tide-diagram.md` skimmed for vocabulary and generator vs host split—not a line-by-line audit against the spec.

## Test baseline

- `npm test` (Vitest): **20 files, 133 tests**, all passing (session date in repo: 2026-04-16).

## Layer map (observed)

| Area | Role (short) |
|------|----------------|
| `src/ui/` | Svelte shell, routes, dial SVG mapping; `App.svelte` orchestrates load, routing, rollover refresh. |
| `src/application/` | Civil-day queries, diagram spec building, semantic cadence, dev diagram previews, typed bridge to diagram engine. |
| `src/data-pipelines/` | Proxy fetch, localStorage, civil-day extremes shaping, location snapshot helpers. |
| `src/time-services/` | Civil-day display window, atypical-pattern detection. |
| `src/location-services/` | Town search / space query. |
| `src/clock-presentation/` | Home clock dial geometry and screen model (non–diagram-generation). |
| `src/diagram-config/` | Home tide layout/style inputs consumed by spec builder. |
| `src/diagram-generation/` | `.mjs` pipeline: model → layout → scene → `renderSceneSvg`. |
| `src/core-models/` | Tide domain types. |

## Dominant themes (3–5)

1. **Explicit adapter at the TS ↔ diagram-generation boundary**  
   `diagramGenerationCollaborator.ts` centralises `buildDiagram`, `loadStyleModel`, `tideDiagramToScene`, and re-exports `buildDiagram` and `renderSceneSvg` from `diagram-generation/index.mjs`. App and semantic-injection tests use the collaborator for those entrypoints.

2. **Orchestration density at the UI root**  
   `App.svelte` correctly owns serialised tide loads, rollover suppression, and route wiring; it is the natural “application shell.” Civil-day **rollover decision** policy now lives in `civilDayRolloverTick.ts`; further simplification likely means **load serial / coalescing** extraction into `application/` if the shell grows further.

3. **Dev-only diagram preview cluster**  
   `diagramDevPreview*.ts` modules in `application/` are a coherent feature island (catalog, resolve, time-freeze scenarios). Good candidate for later “package by feature” grouping **if** folder churn is justified—behaviour is already test-backed.

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

## Next session candidates (pick one)

1. **Further shell thinning (if needed):** extract `refreshTideExtremesForTown` + load serial policy into `application/` behind an explicit factory or small module; only worthwhile if `App.svelte` picks up more orchestration.

---

*Update this file when a session changes boundaries or completes a slice; keep entries dated in prose if useful.*
