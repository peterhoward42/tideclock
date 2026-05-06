# Location picker: when to show disambiguation (logic spec)

This document records the **display logic** for optional disambiguation material in the location search results (the qualified suffix, e.g. region and country in parentheses). It does **not** change how places are matched, stored, or passed to the tide view—only what the user **sees** in the picker list.

**Status:** experiment / design spec for behaviour; **execution** is phased (see [Phased execution](#phased-execution)). Typography, layout, and other presentation polish are out of scope until the visibility rule exists in code.

**See also:** [`location-search-profile-strategy.md`](./location-search-profile-strategy.md) for the query/result-shape strategy that generalizes overflow and ambiguity handling beyond visible-slice disambiguation.

---

## Mission (session intent)

Ship **pure logic** that implements the decision rule below so the picker can **suppress needless qualification** when every **visible** row already has a distinct **display primary**, and **show** qualification only when two or more visible rows would otherwise look the same after normalization.

The implementation should **reuse** what the repo already provides:

- **`SearchSpaceQueryer`** ([`src/location-services/searchSpaceQueryer.ts`](../../src/location-services/searchSpaceQueryer.ts)) for fragment-AND matching and aligned `results` / `displayNames` / `resultKeys`.
- **`Town`** and compact hydration ([`src/data/townSchema.ts`](../../src/data/townSchema.ts)).
- **`bakedTowns2`** ([`src/data/bakedTowns2.ts`](../../src/data/bakedTowns2.ts)) for parallel `searchLines`, display column, and `towns2ByTownId`.
- **`LocationTowns2.svelte`** ([`src/ui/routes/LocationTowns2.svelte`](../../src/ui/routes/LocationTowns2.svelte)) as the eventual consumer; it already calls `queryWithResultCapAndMatchCeiling` and iterates `resultKeys` with `displayNames`.

**Deliberate sequencing:** add the logical services and tests **first**; **do not** wire the behaviour into the Svelte UI until that layer is stable (see [Phased execution](#phased-execution)).

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

## Repository alignment (avoid duplication)

- **Display primary for towns2:** Use structured **`Town.name`** as the primary; it matches the “before `(`” convention because the qualified picker line is built as ``name (county, country)``. **Do not** parse parenthesis from display strings in app code if **`Town`** (or `towns2ByTownId` via `resultKeys`) is available.
- **Search haystack:** Pre-baked **`searchLines`** ([`towns2-search-lines.json`](../../src/data/towns2-search-lines.json), built in [`tools/towns2/build-towns2-compact.mjs`](../../tools/towns2/build-towns2-compact.mjs)) is a single lowercase string per row for **retrieval** only. It does **not** need to be refactored for this feature; structured fields remain in **`Town`** / compact JSON.
- **Collision scope:** Run the rule on the **visible slice** only—the same rows returned as `displayNames` / `resultKeys` for that query (e.g. capped at `maxResults`), not on the full dataset or on `totalMatchingRows` beyond what is listed.

---

## Preparation refactor (small, before or with the first logic PR)

**Goal:** one canonical definition of how a towns2 row is formatted for the picker, so qualification and “primary vs suffix” never drift.

1. Introduce a **pure formatter** (e.g. functions taking `Pick<Town, 'name' | 'county' | 'country'>`) that can emit:
   - the **full** qualified line (today’s behaviour), and
   - **primary-only** (name alone) when the visibility rule says qualification is off.
2. **`bakedTowns2`** should build **`displaySpace`** by calling that formatter (instead of inlining a template literal), so **`SearchSpaceQueryer`** continues to receive parallel arrays unchanged.
3. Keep **`SearchSpaceQueryer`** focused on matching; put **normalization, collision detection, and per-row “show qualifier”** in a separate **pure module** that takes structured row inputs (or aligned arrays derived from `resultKeys` + `towns2ByTownId`).

This refactor is **not** a change to search-line generation unless a later goal requires per-field retrieval behaviour.

---

## Phased execution

| Phase | Scope | Out of scope for that phase |
|--------|--------|-----------------------------|
| **1 — Preparation** | Extract shared picker formatting from **`bakedTowns2`**; keep tests/build green. | UI changes. |
| **2 — Logic services** | New pure module(s): normalize primary, detect collisions on visible rows, emit labels or `showQualifier` flags; **unit tests** with table-driven cases. | **`LocationTowns2.svelte`** (or any route) **must not** depend on the new API yet unless we explicitly start phase 3. |
| **3 — UI integration** | Route uses query result + `towns2ByTownId` + new helpers to render list labels. | Layout/theming polish (can stay a follow-up). |

**Next step for implementation sessions:** complete **phase 1** as needed, then **phase 2** (logical services + tests only). Treat **phase 3** as a separate, explicit milestone.

---

## Open points (for implementation pass)

- Exact **normalization** rules for the primary (and whether to strip punctuation).
- Edge case: two rows collide on primary but disambiguation text is identical—may need a fallback differentiator (data fix or secondary field, e.g. id or extra **`Town`** field).

**Resolved for towns2:** Primary is **`Town.name`** (structured), not parsed from a display string.

---

## Relation to later work

Formatting (two-line rows, muted secondary text, link styling, etc.) can follow once this visibility rule is in place in the UI (phase 3).

---

## UX conundrum 1: overflow with no guidance (query: `beach corn tre`)

Observation from testing:

- Retrieval quality is generally good in this case.
- The user can often click immediately if their intended place appears in the shown subset.
- The current friction is when results are truncated (e.g. "8 matches, first 6 shown") and the user wants to inspect hidden rows.
- Today, the only path is adding another query piece, but the UI gives no clue what extra piece would be useful.

Interpretation:

- This is primarily a discovery/interaction gap, not a matching-quality gap.
- The system has enough candidates; the user lacks a low-effort way to explore remainder candidates.

Likely user next-step scenarios:

1. **Target visible:** user confidently clicks a shown row (works well; preserve this fast path).
2. **Target not visible but expected:** user feels blocked and must guess another fragment.
3. **User wants hidden rows only:** user needs a direct reveal path, not a query rewrite.
4. **User unsure how to narrow:** random extra fragments can degrade relevance and confidence.

Candidate UX responses (ordered smallest to larger change):

1. **Small-overflow auto-expand:** if total matches are only slightly above the display cap, show all rows.
2. **Explicit reveal control:** keep cap by default, but add a one-click "Show all N".
3. **Progressive reveal:** "Show more" / "Show next K" instead of immediate full expansion.
4. **Token suggestions from hidden rows:** suggest additional fragments derived from hidden matches (e.g. "Try adding: dock, cove").
5. **Category/count hints:** surface compact type hints (e.g. Beach/Bay/Cove counts) to guide narrowing.

Recommended direction for this conundrum:

- Implement an immediate reveal affordance (`Show all N` or equivalent), especially effective for small overflows.
- Consider follow-up hinting for "what to type next" when overflow remains large.
- Keep current scanning-first behaviour (top subset shown first) while removing the blind-guess trap.

---

## UX conundrum 2: exact-name ambiguity with high wrong-click risk (query: `seaton`)

Observation from testing:

- A single-token query (`seaton`) returns many rows, including distinct places that share the same canonical town name.
- In the southwest UK context, there are at least two relevant "Seaton" locations (Devon and Cornwall), both plausible user intent targets.
- If one bare "Seaton" appears as an apparently sufficient option, users can confidently pick the wrong place.

Interpretation:

- This is not only a discovery problem; it is an accuracy/safety problem caused by ambiguous exact names.
- The UX must reduce false confidence when exact primary collisions exist for a short query.

Likely user next-step scenarios:

1. **Intent is specific but user lacks county detail:** user expects the app to help choose correctly between same-name places.
2. **User clicks first plausible exact-name row:** risk of selecting wrong location with high confidence.
3. **User notices many partial rows (foreshore/cliffs/etc.):** disoriented because broad matches can visually drown exact-name choices.
4. **User adds random extra fragment:** may help, but is an unreliable burden shift to user memory.

Candidate UX responses (ordered by impact):

1. **Exact-match priority group:** list exact primary matches before broader partial matches.
2. **Forced qualifier on exact collisions:** always show county/country for each exact-name collision row.
3. **Ambiguity hint copy:** short message such as "Seaton matches multiple places; choose county/country."
4. **Optional quick chips for exact collisions:** one-click filters for each colliding canonical place.
5. **Retain broader matches below:** keep discoverability of nearby/features rows, but clearly secondary.

Recommended direction for this conundrum:

- Introduce an "ambiguous exact-name" state for short queries when multiple rows share the same normalized primary and match exactly.
- In that state, pin exact-primary collisions to the top and force disambiguation text on those rows.
- Keep the broader match list available beneath, preserving current retrieval breadth while protecting against wrong confident picks.

Cross-conundrum synthesis:

- Combine this exact-name guardrail with conundrum 1's reveal affordance (`Show all N` / progressive reveal).
- Together, they address both blind narrowing and wrong-place selection without changing core matching semantics.
