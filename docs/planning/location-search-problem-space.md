# Location search: problem space

Failure modes we still care about after matching: confusion, wrong place chosen, or **unwitting mistaken choices**. Ties to disambiguation rules in [`loc-disambig.md`](./loc-disambig.md) and profiling in [`location-search-profile-strategy.md`](./location-search-profile-strategy.md).

---

## UX policies (fixed)

These are not negotiable for the towns2 picker:

1. **Short list only** — At most **6** rows are ever shown (same order of magnitude as older product versions). There is no “show all” or long scroll of matches.
2. **No commitment on a truncated list** — If there are more matches than fit in that cap (`overflowCount > 0`), the rows are **preview only** (not buttons / not links). The user must add fragments until the full match set fits in the cap, then choose.

Together, this removes a large class of errors where someone picks from a list that did not represent the whole match space.

---

## Remaining problem classes

| ID | Problem |
|----|---------|
| **P1** | **Narrowing discovery** — Many whole-space matches; preview shows a slice only. User may not know which extra fragment helps (selectivity / guidance is still relevant). |
| **P2** | **Exact-name / wrong pick** — When the full set is visible (≤6) but several rows share the same display primary, a wrong click remains possible. Mitigated by disambiguation qualifiers (`loc-disambig.md`). |
| **B1** | **`focused` ≠ geographically safe** — Low overflow and low collision in the profile do not guarantee the right region or intent (colloquial vs official, similar names). |
| **C1** | **Over-narrowing** — ANDed fragments; an extra token can eliminate the true row. |
| **C2** | **Under-specificity** — Very broad tokens (`beach`, `bay`, …) still produce huge sets; user only ever sees six previews until they narrow. |
| **C3** | **Substring noise** — Short or generic fragments match inside many tokens; irrelevant-looking previews erode trust. |
| **C4** | **Order myth** — Fragments are order-insensitive; users may think order matters. |
| **D1** | **Qualifier collision** — Same primary and identical suffix: rows still indistinguishable (data or another axis). See `loc-disambig.md`. |
| **D2** | **Normalization surprises** — Case, punctuation, `St.` / `Saint`, etc. |
| **E1** | **Short home headline** — Home uses primary-only; colliding names make it easy to forget which place was chosen. |
| **F1** | **“Not in list”** — Dataset coverage and spelling assumptions. |
| **F2** | **Near-duplicate rows** — Odd pairs in data. |
| **G1** | **Tide equivalence** — Out of scope by design. |
| **G2** | **Intent type (“best” station)** — Out of scope; profile does not encode intent. |

---

## Profile levers (for guidance and copy)

| User pain | Profile hints |
|-----------|----------------|
| Hidden ambiguity in full set | `fullPrimaryCollisions`, `exactPrimaryCollisionGroups`, `collisionDensityFull` |
| Wrong pick among visible dupes | `exactPrimaryCollisionGroups`, `collisionDensityVisible`, `termCount` |
| Hard to narrow | `overflowCount`, `termSelectivity[]`, states `broad*` / `ambiguous` |
| Indistinguishable lines | Not profiling alone — **D1** |
