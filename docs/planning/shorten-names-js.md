# Plan: shorten-names-js roll-out for tideclock

This document tracks incremental application of the [shorten-names-js](cursor skill) guidance: shorten overlong JS/TS **path segments**, **filenames**, and **symbols** by dropping context already supplied by directory, module, or type — not mechanical truncation.

## Why incremental sessions

- The repo has on the order of **100+** TS/JS/MJS modules under `src/` alone; many basenames exceed the skill’s soft max (~24 chars per segment), often in **coupled families** (`homeRoute*`, `diagramDevPreview*`, `tideExtremes*`, `civilDay*`, time-services, etc.).
- Each batch touches **imports, exports, tests, and sometimes dynamic/tool references**; a single-session “whole repo” pass risks incomplete renames and is hard to validate under token limits.
- Work **one coherent family or directory at a time**, run tests (`npm test` / project script), commit, then move on.

## How to update progress here

Edit the checkboxes below in this file as steps complete:

- Use `- [x]` when a step is **done** (merged or PR landed).
- Use `- [ ]` when **not started** or **in progress**.
- Optional: append a date in parentheses after the checkbox text, e.g. `(2026-05-08)`.

Keeping status in **this same file** gives a persistent, grep-friendly ledger.

---

## Progress

### Phase 0 — Ground rules (once)

- [x] Skim the **shorten-names-js** Cursor skill (`shorten-names-js/SKILL.md` in your skills directory) before each batch; prefer dropping **redundant** words over cryptic abbreviations. (2026-05-08)
- [ ] After each batch: full test run; fix imports; avoid renaming **generated** or **tool-contract** paths unless tooling is updated in the same change.
- [ ] Skip or defer: framework-mandated names, string keys used in persisted data, unless you migrate data.

### Phase 1 — Highest-churn filenames (long basenames)

Complete in **separate commits/PRs** if preferred; order is suggestion only.

- [x] **Time services window API** (2026-05-08) — `civilDayWindow.ts` (`CivilDayWindow`), `currentCivilDayWindow.ts` (`getCurrentCivilDayWindow`, `civilDayWindowFromHostClock`), `extremaPattern.ts` (`classifyExtremaPattern`, `ExtremaPatternDetection`); imports and tests updated.
- [x] **`src/application/diagram-dev-preview/`** (2026-05-08) — dropped redundant `diagramDevPreview`/long basenames in favour of `previewCatalog.ts`, scenario modules (`noMoreTidesToday.ts`, …), `resolveForHome.ts`; public symbols now `DiagramPreviewId`, `resolveHomeDiagramPreview`, etc.; kept **`Diagram`/preview** wording so `diagramGeneration*` stays distinct.
- [x] **`src/ui/routes/home/` route modules** (2026-05-08) — removed `homeRoute*` filename prefix in favour of route-local modules (`diagramDom.ts`, `screenWakeLock.ts`, `installFlow.ts`, …); shortened paired symbols (`RouteProps`, `WakeLockPresentation`, `mountScreenWakeLock`, `installObserver`, `getDiagramFullscreenTarget`, menu/diagram helpers, etc.); URL/query helpers moved to `src/ui/homeUrlQuery.ts` in a follow-up batch.
- [x] **Application tide/civil naming** (2026-05-08) — renamed `tideExtremesForCivilDayQuery` → `civilDayExtremesQuery` (`loadCivilDayExtremes`), `tideExtremesRefreshController` → `tideRefreshController` (`createTideRefreshController`, `refreshTidesForTown`), `semanticMinuteCadence` → `minuteCadence` (`subscribeMinuteCadence`), `localWallClockReadoutFromMs` → `localTimeStrings` (`localCanonicalTimeNow`, `localBrhcDatePrefix`), `buildDiagramGenerationSpec` → `buildDiagramSpec` (`formatTideHeightMetres`); civilDayRollover files retained but symbols dropped redundant `CivilDay` prefix (`shouldTriggerRolloverRefresh`, `decideRolloverTideRefresh`, `RolloverRefreshInput`/`Tick…`); `utcIsoToLocalCanonicalTime*` impls left intact (stable contract).
- [x] **`src/data-pipelines/`** (2026-05-08) — `fetchStoreExtremes` → `fetchPersistExtremes` (`FetchPersistExtremesInput`); `buildExtremesFromProxy` → `extremesFromProxyWire` (`FromProxyWireInput`); civil-day slice API `extremesInCivilWindow` / `loadStoredCivilExtremes` / param types; town selection persistence `townPick.ts` + `townPickSerde.ts` (`storeTownPick`, `loadTownPick`, `CURRENT_LOCATION_KEY` unchanged).
- [x] **`src/diagram-config/`** (2026-05-08) — `homeLayout.*` (`homeLayoutBase`, `HomeLayoutBase`, `TideMarkMarker`, `HomeTideMarks`); `homeStyleModel.preset.ts` / `styleModel.types.ts`; preset vs generic style types split preserved.
- [x] **`src/application/tide-dev-preview/`** (2026-05-08) — aligned with `diagram-dev-preview`: `previewCatalog.ts`, `TidePreviewId` / `tidePreviewIdFromSearch` / `tidePreviewMaybeOverrideLoad`; shell props `tidePreviewBannerLine`; kept query param **`tideUxPreview`** for bookmark stability.
- [x] **`tools/` + root configs** (2026-05-08) — `build-towns2-compact.mjs` → `buildCompact.mjs` under `tools/towns2/` (directory supplies `towns2`); `package.json` script target + doc/comment references updated; root config basenames left as framework defaults.
- [x] **`src/ui/homeUrlQuery`** (2026-05-08) — `homeRouteUrlQuery.ts` → `homeUrlQuery.ts`; exports shortened (`effectiveSearchFromLocation`, `HomeDevDebugFlags`, `homeDevDebugFlagsFromSearch`, `pwaSetupDevPreviewWanted`, `pwaSetupDevResetWanted`); `HomeRoute.svelte` + tests updated.

### Phase 2 — Symbols-only clean-up (optional, after Phase 1)

Use when filenames are acceptable but **exports** remain over soft max (~28 chars).

- [x] Grep/longest-export pass: prioritize **public-ish** exports reused across packages; rename **internals** second. (2026-05-08) — `diagramGenerationCollaborator` → `diagramCollaborator` / `DiagramSpec` / `DiagramBundle` / `createDiagramCollaborator`; PWA `keepAwakeUserStore`, `readKeepAwakeEnabled`, `wakeLockSupport` inlined where `isWakeLockApiSupportedRuntime` wrapped it; `ExtremesQueryCoreDeps`, `LoadStoredExtremesParams`.
- [ ] Ensure **tests** stay readable per skill — do not shorten `it(...)` descriptions just to hit length targets.

### Phase 3 — Directory names (only if clearly redundant)

- [ ] Rename directories only when the rename **plus** updated imports is straightforward (e.g. no deep links from docs/external). Prefer smaller vertical slices (`diagram-dev-preview` → shorter slug) over repo-wide churn.

---

## Batch checklist (repeat per PR)

Copy into the PR description or a scratch note:

1. Bounded scope (one family/folder)?
2. File renames **and** matching symbol renames?
3. All imports updated (including tests and `*.mjs` if applicable)?
4. Tests green?
5. This file’s Phase checkboxes updated?

---

## Reference: longest basenames observed (discovery)

Rough ordering by basename length helps pick Phase 1 order; regenerate with:

`find src -type f \( -name '*.ts' -o -name '*.mjs' \) | while read f; do b=$(basename "$f"); echo "${#b} $b"; done | sort -rn | head`

Examples that motivated Phase 1: `getCurrentTideClockCivilDayDisplayWindow*`, `diagramDevPreviewNoMoreTidesToday*`, `instrumentLetterboxObserver` (formerly `homeRouteInstrumentLetterboxObserver`), etc.
