# Diagram host integration (staged)

## Purpose

This document is a **first-class planning stage** for wiring the running app (notably the Home route) to the dynamics and diagram-generation contracts already captured elsewhere.

It **back-references** [dynamics-planning.md](./dynamics-planning.md) for:

- the dual-loop model (**Loop A** ~1 Hz liveness vs **Loop B** ~minute semantic refresh),
- boundary-triggered civil-day query (load, location change, local civil-day rollover),
- next-event derivation ownership (`deriveNextTideSemantics`, `spec.semantic.nextTide` injection),
- phased plan steps **1–5** in that doc (types, service, threaded injection, tests, **switch the app host**).

## Relationship to dynamics-planning.md phased plan

In [dynamics-planning.md](./dynamics-planning.md), the phased plan ends with:

- **Step 5:** switch the app host — semantic tick calls the service once and passes the payload into diagram construction.
- **Step 6 (optional later):** delete in-layout fallback / require semantic injection everywhere / optional TypeScript co-location of pure tide math.

**Staging decision:** treat **host integration** (this document) as the **immediate successor** to step 5. The work below **replaces “what comes next”** in practice: step 6 remains a **tail** item **after** the host path is live and verified, not the next scheduled chunk of work.

## Objective

Deliver a **complete vertical slice** on Home: civil-day data in app state, full diagram spec assembly, collaborator invocation, rendering of generated scene output, **Loop B** semantic regeneration, **Loop A** liveness without repeating heavy semantic work, and **civil-day rollover** as a boundary trigger — aligned with [dynamics-planning.md](./dynamics-planning.md).

## Non-goals (this stage)

- **Selective / mandate-based partial SVG updates** — deferred until a working full replace exists and, if needed, profiling justifies a patch layer ([dynamics-planning.md](./dynamics-planning.md) liveness can start with the simplest honest implementation, e.g. one text overlay or a single group replace).

## Staged integration steps

Work is ordered so each stage is reviewable and testable on its own. Stages map to the gap between “collaborator + semantics exist in tests” and “browser Home shows the intended dynamics.”

### Stage 1 — App state and boundary triggers

**Deliverables**

- Persist the **last successful** civil-day tide payload (`TideExtremesAtLocation` or equivalent) and coordinates needed for spec assembly when `tideLoadState` is ready (today the refresh path discards the result after success/failure).
- Keep existing **load** and **location-change** triggers; add **local civil-day rollover** detection (e.g. compare calendar date on an existing tick or on semantic refresh) and re-invoke the same civil-day query entrypoint when the day changes.

**Gate**

- Changing location or crossing a local midnight produces a coherent refresh sequence without stale overwrites (existing serial guard still applies).

### Stage 2 — Spec assembly and generation (test-first)

**Deliverables**

- Pure application-layer builder: **stored extremes + canonical `timeNow` + optional `deriveNextTideSemantics` output** → `DiagramGenerationSpec` compatible with `createDiagramGenerationCollaborator().generate`.
- Unit tests for the builder (and integration test calling `generate`) **without** Svelte.

**Gate**

- Fixed fixture input produces stable `buildDiagram` / scene output matching expectations (snapshots or golden tests as already used elsewhere).

### Stage 3 — Home route render path

**Deliverables**

- Replace the Home placeholder with a consumer of collaborator output (scene or agreed render contract).
- **Full scene replace** on each semantic regeneration is acceptable for this stage.

**Gate**

- With proxy/storage satisfied, `#/home` shows the tide diagram for the current location and civil day.

### Stage 4 — Loop B (semantic cadence)

**Deliverables**

- **~Minute-scale** (or coarser) timer or scheduler aligned with [dynamics-planning.md](./dynamics-planning.md): refresh canonical `timeNow`, run **one** `deriveNextTideSemantics`, inject `spec.semantic.nextTide`, regenerate diagram/scene.

**Gate**

- Semantic elements called out in dynamics planning (NowPointer, TimeDelta, NextPointer, WaitArc semantics) advance on the semantic cadence, not on every second.

### Stage 5 — Loop A (liveness) without redundant semantic work

**Deliverables**

- **~1 Hz** updates only for **liveness** artifacts (per dynamics planning: centre-cluster **NowTime**; **not** pushing full semantic recompute every second).
- Implement using the **simplest** approach that honors the split (overlay, targeted DOM update, or narrow rebuild — **not** a general mandate system unless already justified).

**Gate**

- Clock readout feels live at a glance; minute-scale semantic geometry does not churn at 1 Hz.

### Stage 6 — Hardening and optional cleanup

**Deliverables**

- Loading / error / empty-marker UX; dev diagnostics if useful.
- **Optional:** begin dynamics-planning **step 6** — remove redundant in-layout derivation once the host **always** injects semantics; unify callers — only when safe and covered by tests.

**Gate**

- `npm test` green; manual smoke on Home with load, location change, and day rollover.

## Cross-references

- [dynamics-planning.md](./dynamics-planning.md) — authoritative dynamics model and next-event derivation phased plan (steps 1–5 + deferred step 6).
- [legacy-diagram-deconfliction-phases.md](./legacy-diagram-deconfliction-phases.md) — deconfliction phase set (including intentional Home placeholder during deconfliction); **this integration stage** is the planned path **out** of that placeholder toward production wiring.

## One-sentence north star

**Ship a host that assembles specs, runs one semantic derivation per semantic tick, respects boundary queries, and renders the diagram on Home — before investing in selective SVG patching.**
