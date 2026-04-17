# Time-Ordered Extrema Ubiquity Refactor Plan

## Goal

Refactor the codebase so collections of tide extremes are represented by one canonical, explicitly ordered domain type everywhere in application/domain logic.

The new model should make time ordering obvious and reliable for code readers and prevent drift back to ad-hoc local types.

## Non-Goals

- No behavior change in tide semantics unless required to preserve correctness under the new invariant.
- No UI redesign.
- No unrelated architecture changes.

## Core Policy

- One canonical domain type for collections of extremes (ordered-by-time invariant carried by type and constructor contract).
- One canonical domain type for individual extremes.
- External/raw boundary shapes are allowed only at ingress/egress adapters and must be converted immediately.
- Local app-level interfaces/types that model extremes/extrema are removed.

## Ordering Policy Decision

Implement a single construction gate for ordered collections with deterministic canonicalization:

- Validate each `timeUtc` is parseable.
- Sort ascending by parsed UTC time.
- Decide duplicate timestamp policy once and enforce centrally:
  - Preferred default: reject equal timestamps as invalid domain input.
  - If ties are domain-valid, define stable tie-break policy and document it.

## Phased Fallback Execution

### Session 1: Type Foundation

- Add canonical ordered collection type in core models.
- Add factory/constructor API that enforces ordering policy.
- Add focused unit tests for constructor behavior.
- Keep existing callers compiling with minimal bridges.

Exit criteria:
- Ordered type exists with documented invariant and tests.
- No downstream behavioral changes yet.

### Session 2: Boundary Enforcement

- Migrate proxy/build adapter to construct canonical ordered collection.
- Migrate snapshot deserialize path to construct canonical ordered collection.
- Ensure civil-day selectors preserve canonical type.
- Add/adjust boundary tests for unsorted payload behavior.

Exit criteria:
- All ingress paths produce canonical ordered collections.
- No core consumer receives raw unordered arrays.

### Session 3: Ubiquitous Adoption + Local Type Purge

- Replace local extrema/extreme interfaces/aliases with canonical domain types across:
  - application services
  - time services
  - diagram preview utilities
  - collaborators/parsers where applicable
- Remove local duplicated extrema modeling types.
- Simplify signatures to accept canonical types directly.

Exit criteria:
- Internal extrema collections use canonical type everywhere.
- No remaining local domain-like extrema/extreme types outside boundary adapters.

### Session 4: Hardening + Guardrails

- Add regression tests for order-sensitive consumers.
- Remove redundant local ordering checks that are now impossible, or keep defensive asserts where helpful.
- Add lightweight guardrail (lint/check/script or review checklist doc) preventing new local extrema modeling types.
- Update docs/comments explaining invariant ownership and boundary conversion rule.

Exit criteria:
- Test suite green.
- Guardrails documented and in place.
- Refactor intent clear for future contributors.

## One-Go Execution Plan (Primary Attempt)

When executed in one session, perform work in this order without pausing:

1. Introduce canonical types and constructor gate.
2. Migrate all boundaries to construct canonical ordered collections.
3. Refactor all internal consumers/signatures to canonical types.
4. Purge local extrema/extreme modeling types.
5. Update tests and documentation.
6. Run full validation suite and fix fallout.

## Validation Checklist

- Typecheck passes.
- Unit/integration tests pass.
- Order-sensitive logic (`next tide`, `phase pair`, `atypical detector`) behaves unchanged for already sorted fixtures.
- New/updated tests prove unsorted ingress cannot leak unordered collections downstream.
- Search confirms no internal local extrema modeling interfaces remain (excluding explicit boundary raw payload types).

## Risks and Mitigations

- Risk: broad signature churn causes hidden behavior regressions.
  - Mitigation: migrate boundaries first, then consumers, with tests after each cluster.
- Risk: mixed old/new types coexist too long.
  - Mitigation: make canonical type dominant early and delete bridges promptly.
- Risk: duplicate-time policy ambiguity.
  - Mitigation: choose policy up front and codify in constructor tests/comments.

## Rollback Strategy

If one-go attempt destabilizes the branch:

- Revert to the last commit that contains only this plan.
- Resume using phased sessions above, one phase per reviewable commit.
