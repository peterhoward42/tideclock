# Universal Session Prompt (Enhanced Coastal Batch Runs)

Follow process files: read **`done`** in `tools/towns2/state/coastal_queue_state.yaml` and **`coastal_county_queue.md`**; the next county is the first in canonical region order not yet in `done`.

## Coverage-first (mandatory)

- **Pass 0 — coastline segmentation (before Pass 1):** Partition the county’s share of the coast into **4–8 contiguous segments** along the **actual shoreline**, not by compass sectors or arbitrary wedges. Use **natural breaks** (estuaries, river mouths, pronounced headlands, large bay mouths, administrative coastal corners) so each segment is a real stretch of coast. Traverse segments in **one consistent order** (e.g. follow the shore in a single direction) so **no stretch is skipped** between major hubs.
- **Pass 1 — main sweep:** Generate names **segment by segment**, saturating each segment (settlements + beaches/coves/bays + harbours/headlands/features) before moving to the next.
- **Gap audit (between Pass 1 and Pass 2):** For each segment, sanity-check that it has both **settlement-scale** and **feature-scale** names and that coverage does not “jump” past an obvious coastal cluster. If any segment is thin or skipped, run a **gap-repair expansion** on that segment only, then continue.
- **Pass 2 — density expansion:** Expand further; do not replace or summarise Pass 1.
- **Pass 3 — search expansion:** Add typed-search style variants (abbreviations, common shortenings, “X beach/harbour” where people type that); still **no** merging clusters into umbrella names.

Do **not** use external per-county manifest files or fixed anchor lists. Coverage discipline comes from **segmentation + traversal order + gap audit**, not from a shipped checklist.

## Output format (final artefact per county)

- **One** concatenated list: **one location per line**, **no** section headings, **no** pass labels in the file.
- Strip the **county name** from each line when it appears as a suffix or parenthetical (case-insensitive match); the line should be the place name only.
- Remove **exact** duplicate lines only, compared **case-insensitively** (same text after trim). **No** other deduplication (similar spellings, redundant near-duplicates, and overlapping concepts stay).

## Density and style

- Prefer **recall and local saturation** over neatness; do **not** summarise or merge clusters into umbrella names.
- Target **high density** (e.g. 80+ names per county where the coast allows).

## Persistence

Persist results and append the completed county to the appropriate **`done`** list in **`tools/towns2/state/coastal_queue_state.yaml`** (single source of truth for progress; queue spec stays read-only).
