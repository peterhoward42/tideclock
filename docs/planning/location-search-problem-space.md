# Location search: problem space (for review)

This document inventories **user-facing failure modes** around location search and disambiguation: confusion, dissatisfaction, or **unwitting mistaken choices**. It extends the two concrete conundrums in [`loc-disambig.md`](./loc-disambig.md) and ties optional profile levers to [`location-search-profile-strategy.md`](./location-search-profile-strategy.md).

**Purpose:** narrow the problem space. Please edit this file in place with your observations (strike items, add “ignore because…”, priority tags, etc.); we can discuss from that marked-up version.

---

## Documented conundrums (baseline)

| ID | Summary | Notes |
|----|---------|--------|
| **P1** | **Overflow / discovery** — Many whole-space matches; capped visible slice; user cannot inspect hidden rows without guessing extra fragments; no hint what fragment would help. | Formalized as `overflowCount`, `broad` (and related) states. Example flavour: `beach corn tre`. |
| **P2** | **Exact-name / wrong-click** — Multiple rows share the same display primary; short queries invite a confident wrong pick; partial matches can dominate the list. | `exactPrimaryCollisionGroups`, `ambiguous` / `broad_ambiguous`. Example flavour: `seaton`. |

---

## Additional problem classes (candidate list)

Use the **ID** when commenting. Items are not equally likely or equally fixable; several are expectation gaps rather than picker bugs.

### A. Truncation × ambiguity

| ID | Problem |
|----|---------|
| **A1** | **Hidden collisions** — Visible slice looks distinct, but duplicate primaries (or exact-name groups) exist only in the overflow tail. User overconfident or never discovers ambiguity until (if) they reveal all. |
| **A2** | **Reveal changes the problem** — After expanding the list, collision density and need for qualifiers can jump. Can feel inconsistent if the user thought the short list was “the whole story”. |

### B. Profile shape vs mental model

| ID | Problem |
|----|---------|
| **B1** | **`focused` ≠ safe** — Low overflow and low collision metrics reduce *label* ambiguity, not necessarily *geographic* or *intent* ambiguity (similar names, wrong region, colloquial vs official). |
| **B2** | **`broad` without ambiguity** — Many matches but distinct primaries: scan fatigue and first-result bias; user may not read qualifiers. |
| **B3** | **`broad_ambiguous`** — High overflow and high ambiguity together: cognitive overload; risk of random narrowing, picking “least bad” visible row, or abandoning. |

### C. Matching semantics (AND, substrings, haystack)

| ID | Problem |
|----|---------|
| **C1** | **Over-narrowing** — ANDed fragments; an extra token can eliminate the true row. User may not know failure is over-constraint vs missing data. |
| **C2** | **Under-specificity** — Very broad tokens (`beach`, `bay`, …) yield huge sets; user may not know which added token actually discriminates (selectivity is partly a UX/data problem). |
| **C3** | **Substring noise** — Short or generic fragments match inside many tokens; irrelevant-looking hits erode trust. |
| **C4** | **Order myth** — Fragments are order-insensitive logically; users may believe order matters and misattribute different result sets. |

### D. Disambiguation display limits

| ID | Problem |
|----|---------|
| **D1** | **Qualifier collision** — Same primary and identical disambiguation suffix: rows still indistinguishable in the list (needs another axis or data fix). Already noted as open in `loc-disambig.md`. |
| **D2** | **Normalization surprises** — Case, punctuation, `St.` / `Saint`, etc. can create false merge or false split of primaries; behaviour is invisible to the user. |

### E. Post-selection and memory

| ID | Problem |
|----|---------|
| **E1** | **Short home headline** — Reminder uses primary-only (pre-parenthesis); colliding names (`Seaton`) make it easy to forget which place was chosen after leaving the picker. |

### F. Data and coverage expectations

| ID | Problem |
|----|---------|
| **F1** | **“Not in list”** — User infers wrong spelling, or assumes wider geographic/topic coverage than the embedded dataset provides. |
| **F2** | **Near-duplicate rows** — Subtle duplicates or odd pairs in data create false choice or duplicate-looking lines without a clear mental model. |

### G. Out of scope by design (expectation gaps)

| ID | Problem |
|----|---------|
| **G1** | **Tide equivalence** — User assumes nearby / same estuary implies same tides; product explicitly avoids tide-equivalence semantics for disambiguation. |
| **G2** | **Intent type (“best” station)** — Rich names surface beaches, cliffs, harbours; user may want a default “main” tide context when several rows match; profile does not encode intent type. |

---

## Profile levers (reference for later UX work)

Not every row in the tables above is addressable by profiling alone. Rough mapping:

| User pain (examples) | Profile / contract hints |
|----------------------|---------------------------|
| Hidden duplicates, false calm | `fullPrimaryCollisions` vs visible, `exactPrimaryCollisionGroups`, `overflowCount` |
| Wrong confident pick | `exactPrimaryCollisionGroups`, `collisionDensityFull`, `termCount` |
| Hard to narrow | `overflowCount`, `termSelectivity[]`, state `broad*` |
| Overwhelming list | `matchesTotal`, `broad` / `broad_ambiguous` + cost of reveal |
| Identical lines after qualifiers | Not solved by profile alone — **D1** |

---

## Suggested review markings (optional)

You can use any convention you like, for example:

- `<!-- drop: reason -->` or a short line under an item.
- `**REVIEW:** …` paragraphs.
- Strike-through for items you consider closed or irrelevant.

No need to preserve formatting perfection; rough notes are enough for discussion.
