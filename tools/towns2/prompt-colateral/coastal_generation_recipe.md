# Coastal Place Name Generation Recipe (Enhanced)

## Purpose

Generate a high-density list of coastal place names for a given county to support search-based location input. Prioritise **recall**, **local saturation**, and **full shoreline coverage** over tidiness. This is generative exploration, not database extraction.

## Core behavioural rules

- Simulate how a human explores and recalls a coastline.
- Prefer density over cleanliness; prefer **covering every coastal segment** over skipping clusters.
- Prefer redundancy of *nearby* names and typed variants; do **not** collapse clusters into umbrella labels.

## Pass 0: Coastline segmentation (required)

**Do not** drive segmentation with compass sectors (NW/N/NE, etc.); that is a poor fit for an open, irregular coastline.

Instead:

1. Identify the county’s **coastal extent** (shared shoreline with the sea).
2. Split it into **4–8 contiguous segments** along the shore, using **natural boundaries**: estuaries, river mouths, major headlands, large bay mouths, or other clear breaks where a “next stretch” naturally starts.
3. **Name each segment** with a short **geographic** label (e.g. by inlet, promontory, or well-known local stretch)—not solely by compass direction.
4. Choose **one traversal order** (e.g. follow the coastline continuously in one direction) and **stick to it** for Pass 1 so no segment is accidentally skipped between two famous towns.

Work **segment by segment** in Pass 1; saturate each before the next.

## Prompt template (internal passes)

Generate coastal place names for **[COUNTY]**, working through the segments defined in Pass 0 in order.

Include:

- towns, villages, hamlets
- beaches, coves, bays
- headlands, harbours, local features

Guidelines:

- Redundancy and overlap between *different* lines are fine.
- Prefer names people might realistically type; include obscure and micro-locations.
- Do **not** optimise away “messy” lists during generation passes.

## Local saturation rule

Within each segment:

- Stay in that stretch and expand (nearby coves, beaches, local names).
- Do not jump to a distant part of the county until the current segment has a **thick** mix of settlement- and feature-scale names.

## Multi-pass strategy

- **Pass 1 — main sweep:** Full coverage, segment order, local saturation per segment.
- **Gap audit (mandatory before Pass 2):** Review each segment for **thin** coverage or **obvious shoreline skips** (e.g. a populated coastal gap between two named hubs). Repair by expanding only the weak segment(s)—**without** relying on external county manifest files.
- **Pass 2 — density expansion:** Aggressively add more names; expand, do not summarise.
- **Pass 3 — search expansion:** Add typed-search variants; expand further, do not “refine down” to a shorter list.

## Anti-summarisation rule

- Do **not** merge similar places into one canonical line.
- Do **not** replace clusters with umbrella names only.

## Density expectation

Aim for **80–200+** names per county where the coastline length supports it.

## Final post-processing (write the saved file)

When producing the **single file** for the county:

1. **Concatenate** all passes into **one list**.
2. **One name per line**; **no** headings, labels, or pass markers in the file.
3. **Remove** the county name from each line when it appears as part of the string (case-insensitive); keep the place name only.
4. **Remove exact duplicate lines** only, using **case-insensitive** whole-line comparison (after trim). Leave all non-identical lines, including near-duplicates and redundant phrasing.
