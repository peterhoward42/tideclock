# Agent prompt: coastal place names → latitude / longitude

Use the **“Prompt body”** section below as the main instruction you give the AI in Cursor (chat or agent). Replace the placeholders in **“Batch”** each time you run a slice of work.

In **interactive** Cursor sessions, supply only **county stem** and **line range** (and pointers to these docs). **Do not repeat** `tools/towns2/coastal/…` or `tools/towns2/coastal-geocoded/…` in the chat—the agent derives both from this file.

**Output layout (fixed):** results use the same directory **shape** as the coastal lists: for every `tools/towns2/coastal/<stem>.txt` there is exactly one `tools/towns2/coastal-geocoded/<stem>.tsv` (same `<stem>`, `.tsv` instead of `.txt`).

**Before anything else**, the agent should read and align with the planning doc:

- [`get-lat-lon.md`](./get-lat-lon.md) — requirements, scale, and **Conclusions from design discussion** (human-map matching, partial coverage, no cross-line equivalence in pass 1).

This file does not replace `get-lat-lon.md`; it operationalizes it.

---

## Batch (human fills in each run)

- **County file:** `tools/towns2/coastal/<stem>.txt` (e.g. `cornwall.txt`)
- **Line range:** from line **\_\_\_** to line **\_\_\_** (1-based, inclusive), or **entire file** only if explicitly approved
- **Output file (derived, do not change):** `tools/towns2/coastal-geocoded/<stem>.tsv` — same `<stem>` as the input file (e.g. `cornwall.txt` → `cornwall.tsv`). Create the `coastal-geocoded` directory if it does not exist.

---

## Interactive bootstrap (copy-paste)

Use this in a Cursor chat/agent turn. It intentionally **omits** input and output paths; those come from this document.

```text
Read docs/planning/get-lat-lon.md (especially “Conclusions from design discussion”), then follow docs/planning/get-lat-lon-agent-prompt.md: use its “Prompt body” and “Output path” rules.

Batch: county stem “cornwall”, lines 1–30 inclusive (1-based). Derive paths from that file; do not restate directories in this message.

Run that batch and stop.
```

Swap the stem and numbers for other counties or ranges.

---

## Prompt body (copy from here)

You are helping geocode UK (and related) **coastal place names** for an informal **tide times** app.

### Required reading

Open **`docs/planning/get-lat-lon.md`** and follow it, especially:

- Human **map intuition** beats formal gazetteer-style “first official hit.”
- **Partial coverage is OK**; wrong-looking certainty is not.
- **Pass 1:** each input line is its own row. Do **not** merge or skip lines because two names “look like the same place.” Do **not** copy coordinates from one line to another based on similarity or list order (a possible **later gap-fill pass** is described in that doc and is **out of scope** for this run).

### Inputs

- **County context:** the basename of the file (e.g. `cornwall` from `cornwall.txt`) is the geographic prior for disambiguation.
- **Places:** one name per line in the file; process only the **line range** (or whole file) specified in the batch header above.

### Output path (mandatory)

- Input `tools/towns2/coastal/<stem>.txt` → output **`tools/towns2/coastal-geocoded/<stem>.tsv`**.
- This mirrors the **coastal** tree: one geocoded TSV per coastal text file, same filename stem, under `coastal-geocoded/` instead of `coastal/`.
- If the batch is a **partial line range** and `coastal-geocoded/<stem>.tsv` **already exists**, **merge**: keep rows for lines outside this batch unchanged; replace or insert rows for each `line_index` in this batch. If the file **does not** exist yet, create it (with header) containing only the rows for the current batch — the file may be incomplete until all lines for that county are processed.

### How to decide coordinates

- Interpret each name as a person would when scanning a **map of this county’s coast** (settlement, beach, headland, harbour, small landmark, etc.).
- Use whatever tools you have (search, maps, geocoding APIs, etc.) to **support** that interpretation. **No single backend is mandatory.** If a tool returns a candidate, check it against the human-map reading and the **county coast** context; reject obvious mismatches (e.g. wrong region, inland centroid of a parish when the name is clearly a cove).
- If several coastal features plausibly match, prefer **`ambiguous`** with a short note over picking one arbitrarily.
- If you cannot find a plausible match, output **`not_found`** (or **`unresolved`**) with a short note.

### Output format

Write **one output row per input line** in the range, in **input order**. Use **TSV** with a header row:

```text
line_index	county_file	place_name	status	latitude	longitude	feature_kind	notes
```

- **`line_index`:** 1-based line number in the source file.
- **`county_file`:** basename e.g. `cornwall.txt`.
- **`place_name`:** exact string from that line (trim trailing `\n` only; preserve internal spacing).
- **`status`:** one of `resolved` | `ambiguous` | `not_found` (or `unresolved` if you could not complete).
- **`latitude` / `longitude`:** decimal degrees, WGS84, only when `status` is `resolved` (otherwise leave empty or use empty fields consistently).
- **`feature_kind`:** short free-text hint when helpful, e.g. `village`, `beach`, `harbour`, `headland`, `bay`, `attraction`, `unknown` — empty if not applicable.
- **`notes`:** brief; for `ambiguous` / `not_found`, say why. No long essays.

If the human asked for JSONL instead, use one JSON object per line with the same field names.

### Execution

- Process **only** the requested range; do not refactor unrelated code or other county files.
- Write results only to **`tools/towns2/coastal-geocoded/<stem>.tsv`** as above — not under `coastal/` and not ad-hoc paths.
- If the batch is large, you may split **your own work** into sub-batches, but the **combined output** must still be one row per input line in order with no duplicates or dropped lines (after merging partial runs into that single TSV per stem).

### End of prompt body

---

## Notes for the human operator

- Start with a **small** line range in one county and spot-check pins on a map before scaling up.
- For repeating runs across the corpus, use **`tools/towns2/scripts/run-geocode-agent-loop.sh`** with state in **`tools/towns2/state/geocode_queue_state.yaml`** (one fresh headless agent session per batch). Details: **`tools/towns2/prompt-colateral/geocode_batch_automation_spec.md`** and **`geocode_universal_prompt.md`**.
- After pass 1 is stable, consider the **optional gap-fill pass** described in `get-lat-lon.md` — still **not** part of the prompt body above.
