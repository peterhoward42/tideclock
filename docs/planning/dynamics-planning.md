# Dynamics Planning

## Purpose

Capture the current working conclusions about update dynamics for the tide diagram:

- what should update frequently to create a sense of life,
- what should update less frequently for semantic correctness,
- and which candidate triggers are intentionally out of scope.

## Core Distinction

Treat diagram updates as two separate concerns:

- **Alive-motion updates**: perceptual updates that make the display feel active.
- **Semantic recompute updates**: domain-driven updates to what the diagram means.

These concerns run at different cadences by design.

## Agreed Drivers

### 1) One-second alive-motion cycle

- Cadence: **once per second**.
- Role: create visible evidence that the diagram is alive when glanced at.
- Scope: lightweight visual/liveness artifacts only.
- Constraint: this cycle should not imply expensive semantic recomputation.

### 2) Programmatic semantic cycle (minute-scale)

- Cadence: **coarser than 1 Hz**; baseline working assumption is **once per minute**.
- Role: refresh semantically meaningful time-derived state for a slowly changing tide picture.
- Scope: recalculation of semantic presentation state that does not require fine-grained sub-minute precision.

### 3) Load-time query trigger

- Trigger moments:
  - app load/startup,
  - location change,
  - civil-day rollover boundary (local day change).
- Action: invoke the existing "get from memory for current civil-day query" entrypoint.
- Note: network fetch behavior remains an internal side effect of that query path when memory does not satisfy the request.

## Explicit Non-Drivers

- **`expiresAt` from proxy payload is not a first-class trigger.**
  - Ignore cache-expiry metadata as an orchestration driver.
- **No source-data change trigger from upstream provider.**
  - Do not model external correction events as first-class update stimuli.
- **No standalone scheduled "slow path" fetch policy in this plan.**
  - Network behavior stays encapsulated behind the query boundary and is not separately scheduled here.

## Operational Model

Use a dual-loop mental model:

- **Loop A (1s):** liveness-only update.
- **Loop B (~60s):** semantic refresh update.

And a boundary-triggered query model:

- **Boundary events:** load, location change, local day rollover.
- **Boundary action:** run civil-day query entrypoint (memory-first, fetch-hidden-if-needed).

## Rationale

- Tide-state semantics move slowly relative to human perception.
- Users benefit from frequent visual confirmation that the display is active.
- Separating liveness from semantic recompute avoids unnecessary churn while preserving product feel.
- Keeping fetch behavior hidden behind query keeps orchestration simpler and consistent with current architecture intent.

## Derived Decisions (diagram generation branch ownership)

### 1) One-second alive-motion tranche

- Include only lightweight liveness presentation.
- **Explicit inclusion:** centre-cluster **NowTime** ticking readout.
- **Explicit exclusion:** **NowPointer** is not part of the one-second tranche.

### 2) Minute-scale semantic tranche

- Own semantically meaningful recompute derived from `timeNow` and current-day marker state.
- **Includes:**
  - **NowPointer** (moved here from one-second consideration),
  - next-event derivation (`computeNextTideEvent*`),
  - **CentreCluster.TimeDelta** (`EventKind`, `DeltaInterval`),
  - **NextPointer**,
  - **WaitArc** semantic geometry.

### 3) Boundary-triggered query tranche (load/location/day rollover)

- Boundary events remain:
  - app load/startup,
  - location change,
  - local civil-day rollover.
- Boundary action remains:
  - invoke the existing civil-day query entrypoint (memory-first; fetch internal when needed).
- This tranche refreshes base marker data that minute-scale semantics consume.

## Next-event derivation: application semantic service

### Intent

Today, next-event logic is invoked from several diagram layout modules (`centreCluster`, `nextPointer`, `waitArc` in `buildDiagram`). That duplicates work on every full build and fights the minute-scale semantic tranche: **one semantic refresh should derive next-event once**, then feed **NowPointer**, **TimeDelta**, **NextPointer**, and **WaitArc**.

**Ownership:** an **application-side semantic service** is the single orchestration entrypoint for that derivation (aligned with boundary query + semantic loop living in the app). **Pure tide-event math** may continue to live in `src/diagram-generation/model/tideEvents.mjs` and be called from the service so we do not fork marker parsing and interval formatting in two languages.

### Is a one-shot change viable?

**Possible in principle, not recommended as a single step.**

Reasons:

- **No consolidated host path yet:** runtime diagram wiring is still thin (`createDiagramGenerationCollaborator` + tests; `tools/diaggen` / `scenegen` build specs directly). A “big bang” would change `buildDiagram` and multiple layout modules **without** a single app call site that proves the new contract, increasing regression risk for CLI previews and specs.
- **Contract surface:** layout needs a stable injected shape (e.g. optional `spec.semantic.nextTide` or explicit builder arguments) plus fallbacks or migration rules for existing JSON specs.
- **Verification:** behaviour must stay identical for existing scenegen inputs; that is easier to gate with a phased fallback than with an all-at-once removal of in-layout derivation.

### Phased plan

1. **Define the semantic result type** (TypeScript under `src/application/` or next to the future host orchestrator): e.g. parsed `timeNow`, optional next event `{ secondsSinceMidnight, kind }`, forward interval string for **TimeDelta**, and any fields **WaitArc** / **NextPointer** need so layout does not re-scan markers.
2. **Implement `deriveNextTideSemantics` (or equivalent)** in the application layer: input = the same conceptual inputs as today (`timeNow` + civil-day marker list / tide spec slice); implementation = call existing `computeNextTideEventCore` / `computeNextTideEventFromSpec` from `diagram-generation` (re-exported) until a stronger shared-types story exists.
3. **Thread results into diagram construction without breaking tools:** extend the spec or add a parallel `buildDiagram` overload path so **when** semantic payload is present, `centreCluster` / `nextPointer` / `waitArc` use it; **when** absent, keep current in-layout derivation so `tools/diaggen` and JSON fixtures unchanged.
4. **Add focused tests:** application service tests (edge cases: no next marker, midnight boundaries) and one golden or snapshot path proving diagram output unchanged for a fixed spec when semantic injection is used.
5. **Switch the app host** (once it assembles full specs): on each semantic tick, call the service once and pass the payload; remove redundant calls inside layout only after the host path is live (optional final cleanup phase).
6. **Optional later:** delete in-layout fallback and require semantic injection everywhere, or move pure `tideEvents` next to the service if the team wants all tide semantics in TypeScript—only after callers are unified.

### Outcome

- Minute-scale loop does **one** next-event derivation per tick.
- Diagram layout becomes mostly **geometry from supplied semantic facts**, matching the dynamics model and simplifying future per-tranche updates.
