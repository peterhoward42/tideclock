# Tide Diagram Spec Writing Improvement Plan

## Goal

Improve readability and navigability of `docs/specs/tide-diagram.md` while preserving meaning exactly:

- easier first read (clear sequence),
- less duplication and fewer restatements,
- tighter prose and reduced cognitive load,
- no semantic drift in normative behavior.

This plan is intentionally **semantically lossless**: the document may be restructured and shortened, but not functionally changed.

## Multi-session execution tracking

This work is expected to span multiple sessions. We will persist phase-by-phase implementation state in this document or a clearly linked sister tracking document in `docs/planning`, updating status, decisions, and open items as each phase is completed.

Current execution status:

- Phase 0 audit: completed (clustered pass) in `docs/planning/tide-diagram-spec-phase0-relevance-audit.md`.
- Phase 1 semantic inventory: completed in `docs/planning/tide-diagram-spec-phase1-semantic-inventory.md`.
- Phase 2 heading skeleton: completed in `docs/planning/tide-diagram-spec-phase2-heading-skeleton.md`.
- Phase 3 consolidation: in progress.
- Phases 4-5: pending.

Latest Phase 2 progress:

- Reader-first TB section order in `docs/specs/tide-diagram.md` is now physically reordered to strict `TB-1` through `TB-7`.
- Temporary heading-level mapping markers were removed from migrated section headings.
- Next: execute Phase 3 consolidation by defining repeated rules once in canonical sections and replacing duplicates with short references.

## Non-negotiables

- Keep all normative constraints, validation rules, required/optional fields, and failure cases.
- Keep all externally consumed contracts (element names, leaf names, style-binding names, host responsibilities, ordering semantics).
- Keep all geometric and time-mapping definitions (`theta(t)`, coordinate conventions, radial segment rules, etc.).
- Keep all behavior branches (countdown, empty-day, atypical summary, paint-order override behavior).
- Preserve existing implementation truth: prose must match code behavior, not idealized intent.

## Current Friction (from a structure skim)

- Definitions are mixed with element-level specifics, forcing frequent context switching.
- The same rules appear in multiple sections (for example: canonical time constraints, host-vs-spec responsibility boundaries, and style-name contracts).
- Input schema details and behavioral consequences are interleaved; this is accurate but heavy to parse.
- Some sections hold both normative requirements and explanatory narrative without a clear split.
- End-of-file notes/todo content is not integrated into the doc’s formal information architecture.

## Rewrite Strategy (Relevance Audit + Lossless Compression + Reordering)

### Phase 0: Audit and remove no-longer-relevant content

Run a pre-pass that classifies each normative statement by implementation status:

- **Implemented in runtime code** (keep),
- **Implemented only in test code** (candidate for removal from master spec),
- **Implemented nowhere** (candidate for removal or explicit “future work” relocation outside the spec).

Working rule for this audit (as proposed): if a statement is implemented only by tests and has no runtime implementation path, it is currently non-relevant to the master source specification and should be removed in this pre-pass.

Audit method:

- build a statement-to-code evidence table (`statement ID -> runtime refs -> test refs`),
- require at least one runtime reference (generator/layout/render/runtime host code) for retention in normative spec text,
- for test-only statements, either remove them or move them to a non-normative backlog/planning note,
- record every removal with reason to keep the process reviewable.

### Phase 1: Build a semantic inventory before editing

Create a temporary extraction table from the current spec with one row per normative statement:

- statement ID,
- statement type (`MUST`/`MUST NOT`/`required`/`error condition`/`derivation`/`naming contract`),
- source section,
- target section in new structure.

This table is the anti-regression backbone; every normative row must map forward exactly once.

### Phase 2: Recompose the document into a reader-first sequence

Reorder content so readers get stable primitives before dependent elements:

1. Scope and role
2. Conventions and core math (`Origin`, `Axes`, `Sizing`, `Polar`, `Time and theta`)
3. Global inputs and validation contract
4. Scene primitives and naming/style contracts
5. Element specifications (grouped by dependency order)
6. Cross-cutting behavior branches (`timeNow`, `TimeDelta` cases, paint-order override seam)
7. Interpretation notes and deferred concerns

This keeps meaning intact while reducing jump distance between prerequisite and use.

### Phase 3: Consolidate repeated rules into single source sections

Promote repeated rules into canonical sections, then replace repeats with short references:

- canonical time format and `24:00:00` sentinel policy,
- host responsibility boundaries,
- text-element defaults and anchor conventions,
- style-binding exact-name contract,
- strict input/throw behavior.

Rule of thumb: define once, reference many.

### Phase 4: Tighten prose without shrinking semantics

Apply a constrained editing style:

- one normative point per bullet where possible,
- split “what” (normative) from “why” (explanatory note),
- remove duplicate qualifiers that do not change behavior,
- prefer symbolic consistency (`R`, `k·R`, `theta`) over re-explaining terms.

### Phase 5: Verify semantic equivalence

Run a manual spec diff review using the post-audit inventory (Phase 0 + Phase 1):

- every old normative statement is accounted for,
- no new normative behavior introduced,
- no field constraints widened/narrowed,
- no naming contract drift.

Then run a code cross-check pass against implementation touchpoints (generator, layout modules, runtime host paths, and route tests) to confirm wording still matches emitted behavior.

## Proposed Target Outline

1. `Role and boundaries`
2. `Core conventions`
   - Origin, axes, sizing
   - RefArc geometry
   - Time scalar and `theta(t)`
3. `Global contract`
   - strict input shape
   - error conditions
   - host responsibilities
4. `Scene model contracts`
   - primitives
   - named elements
   - style-binding exact-match contract
   - paint-order override seam
5. `Element specs` (fixed template per element)
   - intent
   - required inputs
   - geometry/layout
   - emitted scene structure (names)
   - element-specific validation/failure
6. `Behavioral branches`
   - `timeNow` consequences
   - `TimeDelta` (countdown, atypical, no-more-tides-today)
7. `Interpretation and deferred topics`

## Per-Element Template (for consistency and brevity)

Use this same mini-structure for each element section:

- **Inputs** (only element-specific keys; link to global strict input section for shared rules)
- **Geometry / placement**
- **Scene emission** (group/leaf names as contract)
- **Validation failures**
- **Notes** (non-normative, optional)

This removes repeated prose patterns and lowers reader effort.

## Semantic Safety Mechanisms

- Maintain a temporary “old heading -> new heading” mapping table during rewrite.
- Keep all current exact leaf/group names unchanged unless explicitly planned in a separate change.
- Treat examples as non-authoritative unless they encode unique normative detail; if unique, lift the rule into normative text.
- Mark non-normative text explicitly with “Note:” to prevent accidental contract ambiguity.

## Execution Plan (when we implement this later)

1. Run relevance audit and classify every normative statement by runtime/test coverage.
2. Remove or relocate test-only / unimplemented statements with a logged rationale.
3. Create semantic inventory table for the retained normative set.
4. Draft new heading skeleton only (no prose edits yet).
5. Move existing content into new sections with minimal rewriting.
6. Deduplicate by replacing copied rules with cross-references.
7. Perform constrained brevity pass.
8. Run semantic inventory reconciliation.
9. Run implementation cross-check.
10. Final read as a first-time reader; adjust only wording clarity.

## Acceptance Criteria

- A reader can understand prerequisites without backtracking between distant sections.
- Normative statements retained in the master spec have runtime implementation evidence (not test-only evidence).
- Repeated canonical rules appear once and are referenced elsewhere.
- The new doc is materially shorter in wording, not in semantic coverage.
- Every prior normative statement is preserved and traceable.
- Existing implementation behavior remains representable from the rewritten spec without interpretation gaps.

## Risks and Mitigations

- **Risk:** accidental softening/strengthening of requirements while simplifying prose.  
  **Mitigation:** explicit normative inventory and reconciliation gate.

- **Risk:** moving content breaks discoverability for collaborators used to old layout.  
  **Mitigation:** include a short “where things moved” map in PR notes.

- **Risk:** examples carrying hidden requirements are deleted as “redundant.”  
  **Mitigation:** extract any unique requirement from examples before trimming.

- **Risk:** valid near-term behavior is currently test-only during staged rollout and gets removed prematurely.  
  **Mitigation:** allow explicit “temporarily test-backed” exceptions, tagged with owner and expiry/review date.

## What this plan does not do

- It does not change diagram behavior, field names, style names, or generation logic.
- It does not redesign the model; it redesigns documentation composition only.
- It does not treat prose brevity as permission to remove normative detail.
- It does not keep test-only behavior in the master normative spec unless explicitly marked as a temporary exception.

