# Hand Projection Z-Depth V1 Plan

## Goal

Introduce non-hacky, deterministic z-depth control for one new leaf (`Hand.Projection`) without overbuilding a global layering framework.

Constraints already agreed:

- Production behavior is driven by full diagram regeneration at minute cadence.
- 1Hz updates patch clock text only and do not regenerate geometry.
- Dev preview frozen mode is for manual inspection and is out of scope for production layering rules.

## Scope (V1)

- Add a minimal paint-order control seam in the diagram spec for `Hand.Projection`.
- Apply ordering in scene build/render flow (not DOM post-processing).
- Keep default rendering behavior unchanged when no override is provided.
- Do not introduce a broad, global z-index policy model yet.

## Design Choice

Use a constrained **relative ordering override** rather than numeric global z-depth:

- Supports one targeted use cleanly.
- Avoids inventing global semantics prematurely.
- Easier to validate and reason about than arbitrary numbers.

Suggested spec shape (V1):

- Optional object: `paintOrder`
- Optional array: `overrides`
- Each override:
  - `name` (leaf/group name to move)
  - `place` (`"before"` or `"after"`)
  - `relativeTo` (target leaf/group name)

V1 policy restriction:

- Allow exactly one override entry in production preset usage, for `name = "Hand.Projection"`.
- Parser/validator can still be generic enough to accept future expansion.

## Spec Updates

File: `docs/specs/tide-diagram.md`

1. Add a small section under global inputs for optional `paintOrder.overrides`.
2. Define names as scene named elements/leaves (existing naming contract).
3. State default behavior explicitly: absent override => current deterministic order.
4. Add validation rules:
   - `name`/`relativeTo` must exist in the generated scene tree.
   - `name !== relativeTo`.
   - duplicate override for same `name` rejected.
   - unresolved/cyclic relationships rejected.
5. Add an initial normative example for `Hand.Projection` placement.

## Implementation Plan

### 1) Keep layout pure

No paint-order logic in `buildDiagram.mjs` geometry calculations.

- `buildDiagram` can pass through `spec.paintOrder` in diagram document metadata if needed.
- Do not mix radius/angle geometry with ordering behavior.

### 2) Apply order in scene mapping

Primary file: `src/diagram-generation/mapping/toScene.mjs`

- Build scene groups as today (preserve current defaults).
- Add helper to apply overrides after constructing the root group:
  - discover reorderable named children (initially root-level groups; extend to nested if required by Hand structure).
  - perform stable move op (`before`/`after`) by name.
  - keep deterministic fallback order for untouched nodes.
- Ensure helper is pure and returns a new children array (or equivalent deterministic mutation with tests).

### 3) Renderer stays simple

File: `src/diagram-generation/render/renderSceneSvg.mjs`

- No new z logic required if scene mapping outputs correct child order.
- Renderer continues emitting children in array order.

### 4) Spec-builder preset wiring

Relevant files:

- `src/application/buildDiagramGenerationSpec.ts`
- `src/diagram-config/homeTideDiagram.preset.ts`

Add the V1 override in the home diagram spec/preset:

- `name: "Hand.Projection"`
- chosen `place`/`relativeTo` target based on desired visual stacking

Note: choose a target stable under minute-by-minute regeneration (e.g. a consistently present named sibling/group).

## Validation Behavior (Implementation)

Add strict runtime checks where overrides are read/applied:

- non-array `overrides` => error
- malformed entry => error
- missing referenced name(s) => error
- no-op self reference => error
- duplicate mover names => error

Fail fast (throw) to match existing strict-spec style.

## Tests

### Unit tests for ordering utility

Add tests near mapping layer (new test file next to `toScene` tests or existing mapping tests):

1. No overrides => existing order unchanged.
2. Valid `before` move for `Hand.Projection` => expected relative order.
3. Valid `after` move => expected relative order.
4. Unknown `name` => throw.
5. Unknown `relativeTo` => throw.
6. Duplicate override for same `name` => throw.
7. `name === relativeTo` => throw.

### Integration-ish scene test

From a realistic home spec:

- generate scene
- assert emitted order of named groups/leaves around `Hand.Projection` matches expectation
- snapshot or explicit index assertions

### Home route behavior safety

Existing DOM patch tests can remain mostly unchanged, but add one check:

- 1Hz text patch updates text only and does not alter group order assumptions.

## Rollout Steps (Suggested)

1. Spec wording first (`docs/specs/tide-diagram.md`).
2. Add mapping helper + tests (no preset usage yet).
3. Wire preset override for `Hand.Projection`.
4. Run tests; verify home route visual at minute boundary.
5. Record outcome in `docs/planning/log.txt`.

## Non-Goals (V1)

- Full global z-index model for all primitives.
- Arbitrary numeric depth blending.
- Runtime DOM re-layer patching after SVG injection.
- 1Hz geometry updates for hand movement.

## Follow-up Criteria for V2

Only expand beyond V1 if at least one of these appears:

- more than one element requires independent depth control,
- nested-group ordering needs cannot be expressed cleanly,
- feature requests require composable “layer sets” rather than one-off overrides.

