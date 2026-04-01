# Legacy Diagram Deconfliction Phases

## Objective

This is a deconfliction phase, not a migration phase yet.

- Primary objective: remove legacy code whose responsibilities overlap with the new tide-clock diagram subsystem, so the codebase has one clear conceptual owner per responsibility.
- Constraint: preserve any existing code that encodes plausible future orchestration concerns (time/event/data-staleness triggers), even if current wiring is temporary or incomplete.
- Non-goal for this phase set: keeping the Home route diagram rendering functional at every intermediate step.
- Outcome target: a cleaner architecture boundary that is ready for later orchestration wiring and event-flow design.

Policy:

- If a legacy module computes or transforms diagram semantics now owned by the new subsystem, remove or quarantine it.
- If a legacy module coordinates when or why work happens (timing, invalidation, sequencing, trigger intent), retain it unless clearly superseded.

## Phase Plan

### Phase 1 - Define Competition Rubric

For each legacy artifact, classify by dominant responsibility:

- Generate/derive diagram state (likely obsolete if duplicated by new subsystem)
- Present/render UI only (may stay, may be adapted later)
- Orchestrate triggers/lifecycle/invalidation (likely keep for now)
- Glue/adapters/transport (case-by-case; often keep until replacement exists)

Decision rule:

- If it overlaps in semantic model generation, mark as removal candidate.
- If it overlaps in orchestration intent, mark as retain candidate unless fully replaced.

Gate:

- A shared rubric exists and is accepted before deletion work starts.

#### Phase 1 Deliverable - Shared Rubric (Accepted)

Use this rubric when classifying any legacy diagram-related artifact.

1) Determine the **dominant responsibility** (pick one):

- **Semantic generation**: computes or derives diagram meaning/state (time windows, event ordering, geometric/semantic transforms, model projection).
- **Presentation/rendering**: displays already-computed state (Svelte/UI composition, display formatting, visual wiring) without owning semantic derivation.
- **Orchestration intent**: coordinates when/why work runs (triggers, invalidation, sequencing, lifecycle timing, staleness policy).
- **Glue/adapter/transport**: maps data/contracts across boundaries (host-to-view-model adapters, entrypoint wrappers, transport DTO mapping).

2) Assign overlap type against the new subsystem:

- `semantic generation` if both modules claim diagram meaning derivation.
- `orchestration` if both modules encode trigger/lifecycle intent.
- `presentation` if overlap is display-only.
- `none` if concerns are materially different.

3) Apply action rule:

- Dominant responsibility `semantic generation` + overlap `semantic generation` -> **remove candidate**.
- Dominant responsibility `orchestration intent` + overlap `orchestration` -> **retain candidate** unless explicit full replacement exists.
- Dominant responsibility `presentation/rendering` -> **defer** unless directly blocking deconfliction.
- Dominant responsibility `glue/adapter/transport` -> **retain or defer** until replacement path is present and verified.

4) Tie-breakers (when classification is mixed):

- If >50% of logic computes diagram semantics, classify as `semantic generation`.
- If module mostly schedules/invalidates/calls collaborators, classify as `orchestration intent`.
- If uncertain, choose `defer` and record missing evidence as a precondition.

5) Evidence requirement per decision:

- Quote one concrete behavior the module owns today.
- Name the new subsystem equivalent (or explicitly note "none yet").
- State one-line rationale for `remove`, `retain`, or `defer`.

#### Phase 1 Gate Status

- Status: **Accepted**
- Date: **2026-04-01**
- Acceptance basis: shared responsibility taxonomy, deterministic action rules, and explicit tie-breakers are now defined for all later phase decisions.

### Phase 2 - Build Inventory Matrix

Create and maintain a table with:

- Module/path
- Current inferred responsibility
- New subsystem equivalent (if any)
- Overlap type: semantic generation | orchestration | presentation | none
- Action: remove | retain | defer
- Rationale (1-2 lines)
- Preconditions to remove (if any)

Gate:

- All identified legacy diagram-related modules are classified.

### Phase 3 - Remove Obvious Semantic Duplicates

Delete or quarantine highest-confidence semantic duplicates first.

- Focus on modules whose primary role is now owned by the new subsystem.
- Avoid touching orchestration-intent modules unless supersession is explicit.

Gate:

- No high-confidence semantic duplicate remains active in the primary path.

### Phase 4 - Remove Secondary Dead Helpers and Imports

Clean follow-on artifacts created by Phase 3 removals:

- Helpers only used by removed semantic modules
- Dead exports
- Stale import chains tied to the removed legacy path

Gate:

- Import graph no longer depends on removed semantic generation path.

### Phase 5 - Intent Hold for Orchestration-Adjacent Code

Protect code that may encode future orchestration behavior.

- Mark as intent hold and retain intentionally.
- Add a brief note in planning docs when retained for anticipated orchestration role.
- Revisit only when orchestration specification is concrete.

Gate:

- Retained orchestration-adjacent modules are explicitly intentional, not accidental leftovers.

### Phase 6 - Deconfliction Exit Check

Declare this phase set complete when:

- No two active modules claim the same diagram-semantic responsibility.
- Legacy semantic generation path is removed or isolated from production path.
- Orchestration-intent modules are explicitly identified and retained intentionally.
- Repository structure is ready for future event-flow wiring without conceptual ambiguity.

## Execution Notes

- Temporary breakage in Home route diagram rendering is acceptable during these phases.
- Do not introduce temporary wiring just to keep rendering alive if it muddies responsibility boundaries.
- Keep changes in bounded waves; verify and review after each wave.

## One-Sentence North Star

Establish a single authoritative diagram semantics pipeline by removing legacy semantic competitors, while intentionally retaining orchestration-relevant code until trigger/lifecycle requirements are fully specified.
