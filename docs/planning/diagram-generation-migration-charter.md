# Diagram Generation Migration Charter

## Purpose

Capture a safe, executable plan to move reusable diagram-generation code from `tools` into one in-band subtree under `src`, while preserving current output behavior and development iteration speed.

This charter is the controlling reference for migration sequencing.

## Scope Boundary

- Target in-band home: one subtree under `src` with scope boundary **"stuff that generates the diagram"**.
- Keep `tools` as the home for developer workflows (CLI entrypoints, file IO scripts, iter loops, generated artifacts).
- Do not widen scope to general app architecture changes during this migration.

## Explicit Deferral

- There is existing app code under `src` with potential semantic overlap.
- Reconciliation with that wider app code is intentionally deferred until later phases, when the moved diagram-generation modules are in place and stable.
- During early phases, optimize for safe extraction and compatibility over conceptual unification.

## Non-Negotiable Constraints

- Preserve diagram semantics and rendered output intent.
- Preserve style-binding behavior (exact name matching, current validation policy).
- Avoid introducing browser-incompatible dependencies (`node:*`, process/argv, filesystem access) into runtime modules intended for the app.
- Keep migration incremental and reversible.
- No unrelated refactors mixed into migration phases.

## Target Layering (Inside One `src` Subtree)

- `model`: diagram/scene types, invariants, canonical time helpers.
- `layout`: deterministic geometry builders (`buildDiagram` and collaborators).
- `mapping`: diagram-to-scene projection.
- `render`: pure scene-to-SVG/HTML string generation (no file writing).
- `presets`: compile-time/static style model defaults.

Names and exact file layout may evolve, but role boundaries should remain.

## Phase Plan and Gates

### Phase 0: Charter lock (this file)

- Write and agree migration constraints, boundaries, and order.
- Gate: charter accepted before code movement.

### Phase 1: Renderer extraction

- Separate pure render functions from Node/file/CLI wrappers.
- Keep current preview workflow behavior intact.
- Gate: preview output still renders correctly via existing `tools` loop.

### Phase 2: Move pure modules to `src` subtree

- Move or copy pure diagram/scene modules into `src` target subtree.
- Add compatibility re-exports/shims from old `tools` paths.
- Gate: no caller breakage; tools pipeline still runs.

### Phase 3: Repoint tools to in-band modules

- Update `tools` entrypoints to import from `src` modules.
- Retain tools-only orchestration in `tools`.
- Gate: generated artifacts and iteration loop still work.

### Phase 4: Introduce app-facing collaborator surface

- Define stable API surface for app host/orchestrator usage.
- Prepare route-level view model/orchestrator integration points.
- Gate: app runtime path can call diagram-generation code without Node-only imports.

### Phase 5: Cleanup

- Remove temporary shims once all imports are migrated.
- Tighten docs and tests around final module boundaries.
- Gate: tests and dev workflows pass; no lingering legacy imports.

## Verification Checklist Per Phase

- Unit tests pass for touched modules.
- Existing preview workflow remains functional.
- No newly introduced Node-only imports in browser/runtime paths.
- No unexpected changes to diagram primitives, naming, or style-binding contracts.

## Change Management Rules

- Execute one phase at a time.
- Stop at each phase boundary for explicit review.
- If a phase reveals hidden coupling with existing app semantics, document the coupling and defer resolution unless it blocks progress.

## Out of Scope (For Now)

- Full reconciliation with existing `src` app architecture outside diagram generation.
- Broader renaming/restructuring unrelated to migration safety.
- Product-level behavior changes to diagram logic beyond compatibility fixes.
