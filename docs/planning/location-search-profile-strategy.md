# Location search: profile-driven UX strategy

This document captures a universal strategy for location search UX decisions based on a measurable query/result profile, rather than case-by-case rules.

It extends the direction in [`loc-disambig.md`](./loc-disambig.md) and is intended to persist strategy choices before implementation details are finalized.

---

## Steering constraints from product direction

The following constraints are explicit and should guide design and implementation decisions:

1. Avoid logically complex or special-case behavior. Prefer one universal strategy that works across all query shapes.
2. Do not optimize for minimum change. Extended-scope change is acceptable if it produces a cleaner model and better UX.

Additional guidance:

- The existing location query service is not a protected legacy boundary.
- It exists only to serve this UI, so it may be changed substantially if needed.
- There are no incumbent users whose behavior must be preserved at all costs.
- Priority is the best answer and the cleanest implementation, not local incrementalism.

---

## Core strategy

Treat each search as a profiled state, then apply one consistent policy to that state.

The current system already does matching well, but it does not characterize the query/result shape deeply enough, and disambiguation currently uses only truncated visible rows. This strategy adds explicit profiling to unlock safer and clearer UX decisions.

---

## Query/result profile (single source of truth)

For every query response, compute a pure `QueryProfile` (name illustrative):

- `termCount`: number of non-empty query terms.
- `terms`: normalized query terms in order.
- `matchesTotal`: number of rows matching all terms (whole match space).
- `matchesVisible`: number of rows currently rendered.
- `overflowCount`: `matchesTotal - matchesVisible`.
- `visiblePrimaryCollisions`: collision stats for primaries in visible rows.
- `fullPrimaryCollisions`: collision stats for primaries in the full matched set.
- `exactPrimaryCollisionGroups`: groups where a primary exactly matches a query term and appears more than once.
- `collisionDensityVisible`: colliding visible rows / visible rows.
- `collisionDensityFull`: colliding full-match rows / full-match rows.
- `termSelectivity[]`: per-term counts and optional marginal narrowing metrics.

Notes:

- Primary remains structured `Town.name` for towns2.
- Profile logic is pure and testable.
- Profile should be independent of rendering concerns.

---

## Why whole-match profiling matters

Visible-only disambiguation can miss hidden ambiguity introduced by truncation. Whole-match profiling enables:

- safer ambiguity signaling even when collisions are partly hidden,
- better guidance when many relevant rows are not shown,
- consistent policy decisions without naming special cases.

The visible slice still matters for what is rendered immediately, but it should not be the only input to risk/discovery decisions.

---

## Universal decision model

Derive a compact state from the profile using a small threshold set:

- `focused`: low overflow, low ambiguity.
- `broad`: high overflow, low ambiguity.
- `ambiguous`: low/moderate overflow, high ambiguity.
- `broad_ambiguous`: high overflow and high ambiguity.

This state is a characterization of query/result shape, not a place-name-specific branch.

---

## UX policy mapped from state

Apply one policy family regardless of query text:

1. Always show the initial capped slice first for scan speed.
2. If `overflowCount > 0`, show an explicit reveal path (`Show all N` or progressive reveal).
3. If ambiguity pressure is high, force qualifiers on colliding rows and show concise ambiguity guidance.
4. If breadth pressure is high, optionally offer narrowing guidance (for example from term selectivity or grouped hints).
5. Keep broader non-exact results available, but visually secondary when ambiguity risk is high.

This replaces ad-hoc conundrum handling with one model that covers both overflow and wrong-click risk.

---

## Architecture implications

Because best/cleanest is prioritized over minimum diff, service boundaries can be simplified:

- It is acceptable to evolve or replace parts of `SearchSpaceQueryer` if a profile-first contract is cleaner.
- Prefer returning a richer response model that includes both rows and profile metrics instead of bolting side channels into UI code.
- Keep computation pure and deterministic where possible.
- Keep UI route code thin: consume profile + rows, do minimal policy branching.

Possible target split:

- Query service: retrieval + profiling.
- Disambiguation/presentation logic: pure mapping from profile + matched rows to row display directives.
- Route: rendering and interaction state only.

---

## Implementation approach

1. Add pure profile module + tests (table-driven query shape scenarios).
2. Integrate profile generation into query pipeline (including whole-match collision stats).
3. Refactor response contract to expose profile explicitly.
4. Update route to consume state/policy outputs.
5. Validate behavior with representative query shapes (`focused`, `broad`, `ambiguous`, `broad_ambiguous`).

---

## Non-goals

- Do not introduce tide-equivalence semantics.
- Do not reintroduce place-name-specific UX branches.
- Do not preserve current query-service shape purely for historical reasons.

---

## Relationship to `loc-disambig.md`

`loc-disambig.md` defines the disambiguation visibility principle and specific UX conundrums. This document defines the higher-level universal strategy for handling those conundrums through profile-driven state characterization and policy mapping.
