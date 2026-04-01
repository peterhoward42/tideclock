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

#### Phase 2 Deliverable - Legacy Diagram Inventory Matrix

| Module/path | Current inferred responsibility | New subsystem equivalent (if any) | Overlap type | Action | Rationale | Preconditions to remove |
| --- | --- | --- | --- | --- | --- | --- |
| `src/application/homeScreenModelFromHost.ts` | Semantic generation (projects tide extremes into legacy `clockScene`) + glue for route model assembly | `src/application/diagramGenerationCollaborator.ts` -> `src/diagram-generation/layout/buildDiagram.mjs` + `src/diagram-generation/mapping/toScene.mjs` | semantic generation | remove | Owns diagram-semantic projection (`tideEventsFromExtremes`/`clockSceneWithTideExtremes`) that now competes with the collaborator pipeline. Keep only if reduced to pure route assembly with no semantic derivation. | Home route host must consume collaborator output (or a successor adapter) directly for diagram semantics. |
| `src/clock-presentation/clockSceneModel.ts` | Semantic generation contract for legacy clock dial scene | `src/diagram-generation/model/tideDiagramModel.mjs` (domain model) + `src/diagram-generation/mapping/toScene.mjs` (scene projection) | semantic generation | remove | Defines an alternate semantic owner (`ClockSceneModel`) for dial/tide state that duplicates the new subsystem's model+mapping ownership boundary. | All runtime consumers moved off `ClockSceneModel` to new subsystem model/scene contracts. |
| `src/clock-presentation/clockDivisionGeometry.ts` | Semantic generation (deterministic dial geometry derivation) | `src/diagram-generation/layout/buildDiagram.mjs` and layout collaborators | semantic generation | remove | Computes dial boundary/tick geometry, which is diagram-semantic layout logic now expected under `diagram-generation/layout`. | UI path no longer imports legacy division geometry; replacement geometry originates from new subsystem output. |
| `src/clock-presentation/normalizedDialSpace.ts` | Semantic generation support utility (dial coordinate conventions) | `src/diagram-generation/layout/*` internal coordinate helpers (none named 1:1 yet) | semantic generation | remove | Encodes foundational geometry conventions for legacy dial derivation, overlapping layout semantics even if helper-shaped. | Either reuse equivalent helpers inside `diagram-generation/layout` or fold conventions into retained layout modules first. |
| `src/ui/svg/clockPathMapping.ts` | Presentation/render mapping from legacy geometry to SVG attrs | `src/diagram-generation/mapping/toScene.mjs` (scene mapping) + render path under new subsystem (current equivalent is partial) | presentation | defer | Presentation-side mapping may be replaced by scene/render outputs from new subsystem, but this phase prioritizes semantic-owner deconfliction first. | Remove only after Home render path is repointed to consume new scene/render contracts. |
| `src/ui/components/ClockDivisionDial.svelte` | Presentation/rendering only | Future scene/render consumer using new subsystem output (none finalized) | presentation | defer | Pure renderer of prepared SVG props; does not own semantic derivation. | Replacement component path agreed and wired to new scene/render payloads. |
| `src/ui/components/TideClock.svelte` | Presentation/rendering + local status display | Future route/component consuming new subsystem output (none finalized) | presentation | defer | Renders local time/status and embeds dial component; no primary semantic generation ownership. | New Home route contract finalized for scene/render payload and tide status display. |
| `src/ui/routes/Home.svelte` | Presentation/rendering route wrapper | N/A (route shell remains, data contract will evolve) | presentation | defer | Thin route-level composition only; no semantic generation logic. | None for deconfliction phase; revisit during route contract migration. |
| `src/clock-presentation/homeScreenModel.ts` | Glue/adapter/transport (route-level typed bundle) | `src/application/diagramGenerationCollaborator.ts`-backed Home route contract | none | retain | Acts as route contract wrapper; does not itself derive diagram semantics. Useful as a temporary transport boundary while semantic owners are removed. | Remove only when a replacement Home route contract is established and all consumers migrated. |
| `src/application/appClock.js` | Orchestration intent (time trigger cadence via readable store) | none yet | none | retain | Encodes timing trigger intent (1s clock tick) and should be preserved per policy unless explicitly superseded. | Explicit replacement of clock tick orchestration is implemented and adopted. |
| `src/ui/App.svelte` | Orchestration intent (load/invalidation sequencing, host lifecycle wiring) | none yet (future event-flow spec) | orchestration | retain | Coordinates when refresh/load work runs and guards async sequencing (`tideLoadSerial`), which is intentionally retained orchestration behavior. | Explicit orchestrator replacement exists with equivalent trigger/lifecycle policy. |

#### Phase 2 Gate Status

- Status: **Accepted**
- Date: **2026-04-01**
- Acceptance basis: inventory matrix now classifies all currently identified legacy diagram-related modules with overlap/action/rationale and explicit removal preconditions.

### Phase 3 - Remove Obvious Semantic Duplicates

Delete or quarantine highest-confidence semantic duplicates first.

- Focus on modules whose primary role is now owned by the new subsystem.
- Avoid touching orchestration-intent modules unless supersession is explicit.

Gate:

- No high-confidence semantic duplicate remains active in the primary path.

#### Phase 3 Deliverable - Primary Path Deconflicted

Implemented actions (2026-04-01):

- Removed `src/application/homeScreenModelFromHost.ts` (legacy semantic projection from tide extremes into `clockScene`).
- Updated `src/ui/App.svelte` to stop invoking the removed semantic adapter and keep only orchestration/state-load intent for Home data refresh cadence.
- Updated `src/clock-presentation/homeScreenModel.ts` to retain only the collaborator contract (`diagramGeneration`) and drop legacy `clockScene` semantic ownership from the route model.
- Updated `src/ui/routes/Home.svelte` to a temporary non-diagram placeholder surface so the primary Home route path no longer activates legacy semantic generation modules.

Quarantined (retained but no longer active in primary Home path):

- `src/clock-presentation/clockSceneModel.ts`
- `src/clock-presentation/clockDivisionGeometry.ts`
- `src/clock-presentation/normalizedDialSpace.ts`
- `src/ui/svg/clockPathMapping.ts`
- `src/ui/components/ClockDivisionDial.svelte`
- `src/ui/components/TideClock.svelte`

#### Phase 3 Gate Status

- Status: **Accepted**
- Date: **2026-04-01**
- Acceptance basis: the active Home runtime path no longer constructs legacy `clockScene` semantics; legacy semantic-generation modules are quarantined and not invoked by the primary route flow.

### Phase 4 - Remove Secondary Dead Helpers and Imports

Clean follow-on artifacts created by Phase 3 removals:

- Helpers only used by removed semantic modules
- Dead exports
- Stale import chains tied to the removed legacy path

Gate:

- Import graph no longer depends on removed semantic generation path.

#### Phase 4 Deliverable - Secondary Import Chain Cleanup

Implemented actions (2026-04-01):

- Updated `src/ui/routes/Home.svelte` to remove the unused `homeScreenModel` prop and its stale type import from `clock-presentation/homeScreenModel`.
- Updated `src/ui/App.svelte` to remove dead `homeScreenModel` state, collaborator construction, and related imports that were no longer consumed after the Home route placeholder transition.
- Kept active Home runtime behavior unchanged (status-only placeholder surface + tide load state), while eliminating stale semantic-path wiring from the primary route import chain.

Verification:

- `npm test` passes (45/45), confirming cleanup did not regress current behavior.

#### Phase 4 Gate Status

- Status: **Accepted**
- Date: **2026-04-01**
- Acceptance basis: the active Home import graph no longer carries stale wiring to the removed legacy semantic generation path (`homeScreenModel` route prop chain), and only currently used runtime dependencies remain on the primary path.

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
