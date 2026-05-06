# Location search: profile-driven UX strategy

Use a measurable **query/result profile** for guidance and ambiguity signaling, not ad-hoc branches. Complements [`loc-disambig.md`](./loc-disambig.md) (how qualifier text is shown on rows).

---

## Product constraints

1. Prefer one universal strategy over special cases.
2. The query service exists only for this UI; it may change substantially.
3. **Fixed picker policies** (see [`location-search-problem-space.md`](./location-search-problem-space.md)):
   - **Cap:** at most **6** visible rows.
   - **Truncation:** if `overflowCount > 0`, those rows are **preview only** — not selectable until the user narrows so all matches fit in the cap.

---

## Query/result profile

For each query, compute a pure `QueryProfile` (illustrative name):

- `termCount`, `terms`
- `matchesTotal`, `matchesVisible`, `overflowCount` (`matchesTotal - matchesVisible`)
- `visiblePrimaryCollisions`, `fullPrimaryCollisions`
- `exactPrimaryCollisionGroups`
- `collisionDensityVisible`, `collisionDensityFull`
- `termSelectivity[]` (per-term counts / narrowing hints)

Primary for towns2: structured `Town.name`. Profile logic stays pure, testable, and independent of how the route renders HTML.

**Why whole-match profiling still matters:** With preview-only truncation, the user cannot select from a partial menu — but we still need **full-set** collision and overflow signals for honest guidance (“add a fragment”, ambiguity pressure) and for future copy tuning. The visible slice alone is insufficient for that.

---

## Derived state

Compact state from thresholds (characterization, not place-specific branching):

- `focused` — low overflow, low ambiguity in the full set.
- `broad` — high overflow, low ambiguity.
- `ambiguous` — low/moderate overflow, high ambiguity.
- `broad_ambiguous` — high overflow and high ambiguity.

---

## UX policy

1. Always apply the **6-row cap**; never expand into a long selectable list.
2. If `overflowCount > 0`: show preview lines + guidance to narrow; **no** selection affordance on those lines.
3. If `overflowCount === 0` and `matchesTotal > 1`: rows are selectable; use disambiguation presentation from `loc-disambig` when visible primaries collide.
4. Use profile/state to tune guidance (breadth vs ambiguity), not to reintroduce “show all” or infinite lists.

---

## Architecture

- **Query service:** matching + full pass for totals + profile metrics + visible slice.
- **Presentation:** pure mapping from profile + rows to labels/qualifiers.
- **Route:** thin — render previews vs buttons from `overflowCount` and profile-driven copy.

Implementation steps: profile module + tests → pipeline returns rows + profile → route consumes both.

---

## Service notes

- **Profiled query path** should compute `matchesTotal` and full-set collision stats in one trustworthy pass (no early stop that hides totals).
- **Performance:** full scans are acceptable for this dataset; keep matching allocation-light.

---

## Non-goals

- Tide-equivalence semantics.
- Place-name-specific UX branches.
- Preserving legacy query APIs “just because”.
- Long or fully revealed match lists.

---

## Relationship to `loc-disambig.md`

`loc-disambig.md` defines **when** qualification suffixes appear on rows (visible-slice collisions). This doc defines **profile + cap + preview-only truncation** around that presentation.
