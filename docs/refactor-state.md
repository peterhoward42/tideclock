# Refactor state (code-first thread)

Created from a fresh pass: judgements from **source and tests** only.  
**Not used as input:** `docs/planning/log.txt`, other historical `docs/planning/*` (per project direction).  
**Orientation only:** `docs/specs/elevator-pitch.md`; `docs/specs/tide-diagram.md` skimmed for vocabulary and generator vs host split—not a line-by-line audit against the spec.

## Test baseline

- `npm test` (Vitest): **19 files, 130 tests**, all passing (session date in repo: 2026-04-16).

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
   `diagramGenerationCollaborator.ts` centralises `buildDiagram`, `loadStyleModel`, `tideDiagramToScene`, and re-exports `renderSceneSvg` from `diagram-generation/index.mjs`. **Remaining optional consistency:** `diagramSemanticInjection.test.ts` still imports `buildDiagram` directly from the barrel (test-only; acceptable).

2. **Orchestration density at the UI root**  
   `App.svelte` correctly owns serialised tide loads, rollover suppression, and route wiring; it is the natural “application shell.” Any future simplification likely means **extracting named policies** (e.g. load coalescing / rollover) into `application/` rather than thinning comments.

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

## Next session candidates (pick one)

1. **Document the layer table** in one file header (e.g. `src/application/README` is overkill—prefer a short module header on `diagramGenerationCollaborator.ts` only if it stays one sentence).
2. **Rollover / load policy extraction:** pull `shouldTriggerCivilDayRolloverRefresh` call site helpers out of `App.svelte` into a small `application/` module if the file grows further.
3. **Optional:** route `diagramSemanticInjection.test.ts` through `diagramGenerationCollaborator` (or a tiny test helper) if you want a single import path for `buildDiagram` in tests as well as app code.

---

*Update this file when a session changes boundaries or completes a slice; keep entries dated in prose if useful.*
