# Coastal Batch Automation Specification (Enhanced)

## Intent

- Prioritise **shoreline coverage** and **density** over a “clean” list.
- **Pass 2** must **expand**, not summarise.
- **Pass 3** must **expand further**, not refine into fewer concepts.
- This is **generative exploration**, not authoritative gazetteer extraction.

## Segmentation (Pass 0)

- **Mandatory** before Pass 1: define **4–8 contiguous coastal segments** following the **real coastline**, separated by **natural breaks** (estuaries, river mouths, headlands, large bay mouths). **Do not** use compass-sector wedges (e.g. NW/N/NE) as the primary segmentation model.
- Segments must be visited in a **single consistent order** along the shore so **no coastal stretch is skipped** between hubs.
- **Do not** introduce per-county manifest files or shipped anchor checklists; coverage is enforced via segmentation, traversal, and gap audit only.

## Gap audit

- After Pass 1, **review segment-by-segment** coverage. If any segment is thin or an obvious coastal cluster was bypassed, run **targeted gap repair** on that segment before Pass 2.
- Pass 2/3 must not undo coverage; they add lines only.

## Output artefact (per county)

- **Format:** one plain list — **one location per line**, **no** section headings, **no** pass headers in the file.
- **County name:** strip **[COUNTY]** from each line when present (case-insensitive); output lines are place names only.
- **Deduping:** remove **exact** duplicate lines only, **case-insensitive** (after trim). **No** fuzzy dedupe, normalisation of spelling variants, or merging of similar concepts.

## State and handoff

- Persist outputs and update batch state so the next session can read **which county is next** and where files live.
- Internal working notes (segment names, gap-audit notes) may exist **outside** the final per-county list file; the **saved county file** must match the output rules above.
