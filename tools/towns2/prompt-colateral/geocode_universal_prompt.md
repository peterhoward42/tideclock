# Universal session prompt (geocode batch — one headless iteration)

Perform **exactly one** iteration of the coastal geocoding queue, then stop. A shell loop may invoke you again in a **new session** for the next batch.

## Required reading (in order)

1. **`tools/towns2/prompt-colateral/geocode_batch_automation_spec.md`** — batch automation, state file, and TSV merge rules.
2. **This file** — orchestration rules below.

## State file

Read and update **`tools/towns2/state/geocode_queue_state.yaml`**:

- **`queue_exhausted`**
- **`lines_per_batch`**
- **`stems`** (ordered list; may be empty — see below)
- **`current_stem`**, **`next_line_start`** (1-based)

Preserve existing comments and structure when editing YAML.

## Stem list

- If **`stems`** is non-empty: use it **in order** as the list of work. Each entry is a stem **without** `.txt` (e.g. `cornwall` for `tools/towns2/coastal/cornwall.txt`).
- If **`stems`** is empty: discover every file matching **`tools/towns2/coastal/*.txt`**, take basename without `.txt`, sort **lexicographically** — that ordered list is the queue.

Skip any stem for which **`tools/towns2/coastal/<stem>.txt`** does not exist (if `stems` was hand-edited and wrong).

## One iteration — algorithm

1. If **`queue_exhausted`** is **`true`**: make no edits; stop (the orchestrator should not call you; this is idempotent safety).

2. **Resolve the active stem and start line**
   - Let `L` be the stem list (from the previous section).
   - If **`current_stem`** is empty or whitespace: set **`current_stem`** to `L[0]` and **`next_line_start`** to **`1`**. (To resume mid-county, the human sets **`current_stem`** and **`next_line_start`** explicitly.)
   - If **`current_stem`** is non-empty but **not** in `L`: set **`queue_exhausted`** to **`true`** and stop, **or** correct **`current_stem`** to a valid stem if the fix is obvious from context.
   - Let **`path`** = `tools/towns2/coastal/<current_stem>.txt`. Let **`line_count`** be the **physical** line count of that file (including blank lines). Batch ranges use **1-based** indices into those physical lines. One TSV row per **`line_index`** in the batch (blank source lines still get a row: trimmed name, appropriate **`status`** / **`notes`**).

3. **Advance past completed stems**
   - While **`next_line_start` > `line_count`** for **`current_stem`**:
     - Move to the **next** stem after **`current_stem`** in `L`. If there is none, set **`queue_exhausted`** to **`true`**, save YAML, stop.
     - Set **`current_stem`** to that stem, **`next_line_start`** to **`1`**, recompute **`line_count`**.

4. **Compute batch range**
   - Read **`lines_per_batch`** from state (default mentally **`30`** if missing — but the file should define it).
   - **`start`** = **`next_line_start`**
   - **`end`** = min(`start` + **`lines_per_batch`** − 1, **`line_count`**)

5. **Do the geocoding work** (only this batch)
   - County stem = **`current_stem`**
   - Line range = **`start`–`end`** inclusive (1-based)
   - Write/merge **`tools/towns2/coastal-geocoded/<current_stem>.tsv`** only.

6. **Update the pointer for the next run**
   - If **`end` < `line_count`**: set **`next_line_start`** = **`end` + 1`**; **`queue_exhausted`** = **`false`**.
   - If **`end` == `line_count`**: move to the **next** stem in `L` after **`current_stem`**.
     - If there is a next stem: set **`current_stem`** to it, **`next_line_start`** = **`1`**, **`queue_exhausted`** = **`false`**.
     - If there is **no** next stem: set **`queue_exhausted`** = **`true`**. Leaving **`current_stem`** as the last county processed is fine; the orchestrator only gates on **`queue_exhausted`**.

Save **`geocode_queue_state.yaml`** with the above updates in the same change set as the TSV.

## Do not

- Process more than **one** batch range in this invocation (no “also do the next county” in the same session).
- Refactor unrelated code or other counties’ inputs beyond what this batch requires.
- Change **`lines_per_batch`** unless the human asked you to (it is configuration).

## End of universal prompt
