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
