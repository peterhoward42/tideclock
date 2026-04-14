# Location Route Redundancy Removal Plan

## Purpose

Remove code and data that became redundant after adopting the new location-setting route, while preserving runtime behavior and developer workflow stability.

This plan is intentionally split into session-friendly phases, each with:

- scope boundaries,
- concrete file targets,
- dependency notes, and
- explicit verification gates.

## Current State (Baseline)

- Runtime route selection already favors the newer location flow:
  - `#/location` is normalized to `location2` in `src/infrastructure/router.js`.
  - Menu and header links use `#/location2` in `src/ui/components/AppHeader.svelte`.
- Old and new location implementations coexist:
  - old: `src/ui/routes/Location.svelte` + `src/data/bakedTowns.ts` + `src/data/towns.compact.json`
  - new: `src/ui/routes/LocationTowns2.svelte` + `src/data/bakedTowns2.ts` + towns2 JSON artifacts
- Shared types and hydration logic still live in the old module:
  - `Town` type and `hydrateTownsCompact()` are exported from `src/data/bakedTowns.ts`
  - newer code imports those exports, so direct deletion would break compilation.
- Old developer tooling likely still exists but appears disconnected from active scripts:
  - `tools/os-open-names/*`

## Constraints and Safety Rules

- Do not change location-selection behavior during extraction/refactor phases.
- Keep hash compatibility policy explicit:
  - either retain `#/location -> location2` alias for old links,
  - or remove alias later as a deliberate breaking change.
- Delete legacy modules only after all imports are migrated.
- Treat tooling deletions as a separate phase with explicit confirmation that no active process depends on them.

## Phase Plan

### Phase 1 - Extract shared town schema from legacy module

Goal: remove cross-module dependency on `src/data/bakedTowns.ts` before any deletion.

#### Work

- Add new neutral shared module (suggested):
  - `src/data/townSchema.ts`
- Move into it:
  - `Town` type
  - `hydrateTownsCompact()` and its private helpers
- Update imports that currently pull shared pieces from `bakedTowns`:
  - `src/data/bakedTowns2.ts`
  - `src/data-pipelines/currentLocation.ts`
  - `src/data-pipelines/currentLocationSnapshot.ts`
  - `src/data-pipelines/currentLocation.test.ts`
  - `src/ui/App.svelte`
  - `src/ui/components/AppHeader.svelte`
  - `src/ui/routes/LocationTowns2.svelte`

#### Non-goals

- No route or UX changes.
- No file deletion.

#### Verify

- `npm test`
- `npm run build`
- `rg "from ['\"]\\./bakedTowns|from ['\"][^'\"]*bakedTowns['\"]" src` should show only intentional legacy-only imports.

---

### Phase 2 - Remove legacy route wiring from runtime shell

Goal: stop rendering old location UI while preserving user navigation behavior.

#### Work

- In `src/ui/App.svelte`:
  - remove `Location.svelte` import,
  - remove `"location"` from local route union type,
  - remove old route branch that renders `<Location ... />`.
- In `src/infrastructure/router.js`:
  - remove `'location'` from typedef if no longer used as a route ID.
  - decide and apply compatibility policy:
    - keep parsing `#/location` as alias to `location2` (recommended initially), or
    - remove alias in a later cleanup phase.

#### Non-goals

- No dataset deletion yet.
- No tooling deletion yet.

#### Verify

- Manual smoke test:
  - Home -> Location -> choose place -> returns Home with updated location.
  - Direct URL `#/location2` works.
  - If alias retained: `#/location` still lands in new picker.
- `npm test`

---

### Phase 3 - Remove legacy data module and old route files

Goal: delete obsolete old-picker code and dataset artifacts.

#### Work

- Delete:
  - `src/ui/routes/Location.svelte`
  - `src/data/bakedTowns.ts`
  - `src/data/towns.compact.json`
  - `src/data/bakedTowns.test.ts` (replace coverage where still needed)
- Ensure `bakedTowns2` and schema/hydration tests provide sufficient ongoing guardrails.

#### Non-goals

- No tooling-folder deletion yet.

#### Verify

- `npm test`
- `npm run build`
- `rg "Location\\.svelte|bakedTowns|towns\\.compact\\.json" src` has no runtime references except intentional history/docs comments if any.

---

### Phase 4 - Tooling and source-of-truth consolidation

Goal: remove obsolete old-generation tooling and codify towns2 as canonical pipeline.

#### Work

- Audit old tooling directory:
  - `tools/os-open-names/*`
- If anything is still useful (for example schema notes), migrate into `tools/towns2/` first.
- Delete old tooling directory when confirmed unused.
- Update `.gitignore` entries related only to old tooling, if obsolete.
- Add or update one short pipeline note under `docs/planning` or `tools/towns2/` clarifying canonical source-of-truth chain:
  - `tools/towns2/coastal/*.txt`
  - `tools/towns2/coastal-geocoded/*.tsv`
  - `tools/towns2/build-towns2-compact.mjs`
  - `src/data/towns2.compact.json` + `src/data/towns2-search-lines.json`

#### Non-goals

- No feature changes to search UX.

#### Verify

- `rg "os-open-names|build_towns\\.py|towns\\.compact\\.json" .` returns only intentional historical docs, or none.
- `npm run build-towns2-data` still regenerates the shipped towns2 artifacts.

---

### Phase 5 - Documentation and final sweep

Goal: remove stale references and leave a clean handoff state.

#### Work

- Update docs that still describe old location route/data as active.
- Ensure naming in comments/tooling docs no longer frames towns2 flow as "prototype" if it is now canonical.
- Optional: add a brief changelog note in planning logs.

#### Verify

- Full final checks:
  - `npm test`
  - `npm run build`
  - manual route and location persistence smoke pass.

## Suggested Session Breakdown

- Session A: Phase 1 only (schema extraction and import migration)
- Session B: Phase 2 only (runtime route wiring cleanup)
- Session C: Phase 3 only (legacy file deletions and tests)
- Session D: Phase 4 only (tooling/source-of-truth consolidation)
- Session E: Phase 5 final docs sweep and release-readiness checks

## Rollback Strategy

- Keep each phase in a separate commit.
- If a phase fails verification:
  - revert only that phase commit,
  - keep prior validated phases in place.
- Prefer retaining `#/location` alias until final pass to minimize user-facing break risk.
