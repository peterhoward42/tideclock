# Location picker: when to show disambiguation (logic spec)

This document records the **display logic** for optional disambiguation material in the location search results (the qualified suffix, e.g. region and country in parentheses). It does **not** change how places are matched, stored, or passed to the tide view—only what the user **sees** in the picker list.

**Status:** experiment / design spec. Implementation and presentation (typography, layout) are out of scope for this file.

---

## Context

- Search uses **space-delimited fragments**; a place matches when its full searchable string contains every fragment (AND semantics).
- Place data is **embedded and static**; names are intentionally rich (towns, beaches, resorts, near variants) so visitors with sparse local knowledge can still get a hit.
- After selection, the **home route** shows only the part **before** the opening parenthesis as a short reminder of what was chosen. That label is not required to be authoritative or fully qualified; it supports recognition (including on shared displays).

---

## Principle

Disambiguation in the list exists to help the user **tell two visible choices apart** when they would otherwise look the same. It is not an obligation to surface the full internal qualified name on every row.

---

## Decision rule (per response)

1. Define a **display primary** for each row—the string the user primarily compares between lines (typically the substring before `(`, if the data uses that pattern, or an explicit field if the data model adds one).
2. **Normalize** primaries for comparison only (e.g. trim, case-folding; exact rules TBD at implementation time).
3. Consider **only the rows actually shown** in that response (e.g. the first *N* results after search), not the whole dataset.
4. **If** two or more rows in that set share the same normalized primary, **show** disambiguation material for every row that participates in such a collision (so each of those lines remains distinguishable).
5. **If** no primary appears more than once in that set, **do not show** the disambiguation material on any row in that set.

---

## Explicit non-goals

- **Tide-equivalence:** Do not classify places as “the same for tides” to drive this rule. That judgment is infeasible to maintain or infer and is **not** required. Distinct visible labels (e.g. “Looe”, “West Looe”, “Looe beach”) fall out of the rule naturally: different primaries ⇒ no collision ⇒ no suffix—without any tide semantics.
- **Changing matching, IDs, or home headline:** Internal identity and tide lookup stay as today; the home headline remains the unqualified (pre-parenthesis) reminder unless separately decided otherwise.

---

## Open points (for implementation pass)

- Exact **normalization** rules for the primary (and whether to strip punctuation).
- Whether the primary is always derived by **parsing** the existing string or supplied by **structured fields** in the static data.
- Edge case: two rows collide on primary but disambiguation text is identical—may need a fallback differentiator (data fix or secondary field).

---

## Relation to later work

Formatting (two-line rows, muted secondary text, link styling, etc.) can follow once this visibility rule is in place.
