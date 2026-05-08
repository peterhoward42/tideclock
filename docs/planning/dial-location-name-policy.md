# Dial location names: display length, trimming, and trail-based exclusions

Planning notes from design discussion (2026-05-08). **No implementation is specified here** — this file is the handoff for a future session.

## Context

- **The Tide Dial** (`docs/specs/elevator-pitch.md`) presents the chosen place on a **fixed, deterministic** diagram. Location text uses a **monospace** face by design.
- **Effective width** is therefore tightly coupled to **character count**, not to proportional font shaping. Long strings collide with the dial geometry (e.g. right-anchored block overlapping the arc).
- **Canonical place labels** live in `src/data/towns2.compact.json` and hydrate to `Town.name` (`src/data/townSchema.ts`). The dataset is **rich and informal on purpose**: it helps users **find** a pin with minimal effort (landmarks, verbose phrases, disambiguation).
- **On-disk JSON stays that rich feed** (tooling and regeneration pipelines unchanged). The **in-memory town table** the app actually uses — after load-time pruning and any other conditioning — is the **product input**: authoritative for search, selection, and the dial.
- **Search/discovery** and **ambient display** are different jobs. Long or database-ish strings can be **good for resolution** and **wrong for the instrument face**.

## Problem statement

1. **Display budget:** A character cap around **23** was used as a working threshold (derived from visual judgement on a long example such as “Whaling berth historic Aberdeen”, 31 characters). Exact cap is a product choice; the important part is **enforcing a maximum width** for the dial label.
2. **Hard cap alone:** Excluding every `name` with `length > 23` removes about **1,437 / 15,274** rows (**~9.4%**). A one-character move in the cap moves a lot of rows (e.g. **24** → **~7.7%** excluded, **25** → **~6.3%**).
3. **Trailing-word trimming (display-only idea):** Repeatedly drop the **last whitespace-delimited word** until `length ≤ max` (or one token remains) is a **blunt but acceptable** display compromise:
   - Preserves the **leading** phrase users searched toward; strips trailing qualifiers (“… National Nature Reserve”, “… shore”, etc.).
   - **~5** rows in the current compact table still exceed the cap after stripping (single very long token, or **hyphen/en-dash**-joined tokens treated as one word), and need a **tiny fallback** (e.g. hard truncate + ellipsis, or rare special-case).
   - **Collateral:** many distinct canonical names can **collapse to the same display string** (~**144** collision groups in a simulation on the current JSON). Often that is acceptable; occasionally it drops meaningful tails (e.g. **North** vs **South** on the same base — rare but real).
4. **Branded long-distance paths (input errors):** A specific class is names whose **root** is a **multi-mile coastal trail brand** (e.g. **“Wales Coast Path …”**). Conceptually these lines are **errors in the input data** for this product: they should not have been shipped as selectable locations. **Regenerating or editing the geocoded corpus** to drop them is **correct** but **expensive**; until then we approximate a clean feed by **pruning them out of the runtime working set** as soon as the list exists (see §D).

## Conclusions and rationale

### A. Keep canonical `name` for what it is

- **Do not** introduce a general “smart” policy to infer a separate human display name from free text. That stays **complex and fragile**.
- **Do** treat dial copy as a **derived presentation** of the same canonical string (trim rules, cap, optional prefix stripping **only where explicitly listed**).

### B. Display length: trailing words first, then a small fallback

- **Preferred rule:** enforce `maxLength` by **dropping trailing words**; only then apply a **minimal** fallback for pathological tokens.
- **Rationale:** aligns with how verbose rows are structured; avoids inventing new names; keeps behaviour **predictable**.

### C. Recognising “bad” trail rows: lexicographic rules, not “detect all paths”

- **Do not** rely on a broad regex such as “anything containing Coast Path” — many rows are **local** “… coast path” phrases where the **leading tokens are still place-like**; over-blocking would **hurt search**.
- **Do** use a **short, explicit, reviewable list** of **multi-word trail *heads*** (prefixes, and if needed **suffix** forms like ` Wales Coast Path` for place-first variants) that mark a row as an **input error** for this app’s location universe.
- **Rationale:** the failure mode is **branded corridor as root**, which correlates with **fixed string prefixes**, not with geography. New trail marketing strings change **slowly**; patching a list in git is **cheap** compared to rebuilding `towns2` inputs.
- **Scale check (current JSON):** order-of-magnitude counts for orientation — **`Wales Coast Path `** as prefix **~45** rows; **`Wales Coast Path`** anywhere **~58**; **`Coast Path`** as a word-boundary phrase **~83** total. Policy surface stays **small**.

### D. Where pruning lives: inside the input-data universe, early in the pipeline

- **Concept:** Trail-branded rows are **wrong lines in the feed**, not a special case at the dial. The app’s **authoritative list of places** (for search, selection, and everything downstream) should **not** include them once the JSON has been loaded.
- **Placement (choose one coherent seam; both are “early”):**
  - **Load-time systemic pruning:** immediately after hydrating `towns2.compact.json` into `Town[]`, derive **`eligibleTowns`** (or replace the exported list) by **dropping** rows that match the trail-head rules. All features that need “the towns table” consume this pruned universe unless a debug/raw view is explicitly required.
  - **Search-entry conditioning:** if the architecture keeps a raw `Town[]` in memory for tooling, the **search UX** must still **only** query against the **same pruned** list (or an index built from it), so erroneous path rows never appear as results when the user enters the location flow.
- **Rationale:** avoids scattering “exclude here but not there” logic; matches the mental model **errors are removed from the dataset the product uses**, not filtered late for presentation only. Users who would have picked a path-only pin fall through to **nearby non-path rows** in the pruned set.
- **Persistence edge case:** if a user already has a **stored pick** whose `id` is no longer in the pruned universe, a future implementation should define behaviour (e.g. treat as missing selection, prompt re-pick) — same as any removed id.

## Open work (for implementation session)

- [ ] Decide exact **`maxLength`** (23 vs 24/25) after visual check on real dial.
- [ ] Implement **display pipeline** (trim + cap + fallback) in one place used by the diagram / home route; it operates on **`Town.name` from the pruned universe** (so dial never receives path-error rows if pruning is complete).
- [ ] Define **`TRAIL_HEAD_EXCLUSIONS`** (or equivalent): literal prefix/suffix strings + tests; apply at **hydration / first consumer** so the **runtime town list** (and search index) **omits** those rows — not a late “picker-only” filter.
- [ ] Pick the **single seam**: pruned export from `bakedTowns2` (or adjacent module) vs duplicate guard in search bootstrap; document which modules must use the pruned list.
- [ ] Define **stored `id` no longer eligible** behaviour after a prune or list update.
- [ ] Revisit **collision** cases after trim: acceptable vs need county suffix on dial for disambiguation.
- [ ] Confirm behaviour for **empty remainder** after stripping a listed prefix (fallback to full `name` or exclude row) — only relevant if any prefix-stripping remains for display; **pruning** removes the main WCP class entirely from the universe.

## Reference statistics (towns2.compact.json, ~2026-05-08)

| Rule | Approx. count |
|------|----------------|
| Total `Town` rows | 15,274 |
| `name.length > 23` | 1,437 (~9.41%) |
| `name.length > 24` | 1,174 (~7.69%) |
| `name.length > 25` | 965 (~6.32%) |
| Long names still > 23 after trailing-word trim only | 5 |

Simulation details (trimming, collisions) were exploratory; re-run against current JSON before locking tests.
