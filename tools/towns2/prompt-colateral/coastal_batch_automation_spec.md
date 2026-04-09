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

- **Canonical county order** (read-only): `tools/towns2/prompt-colateral/coastal_county_queue.md`.
- **Runtime progression** (`done` per region + artefact hints only): `tools/towns2/state/coastal_queue_state.yaml` — append the finished county to the right `done` list when finishing a county (do **not** mirror `next` or `remaining` here; those follow from the canonical spec + `done`).
- **`queue_exhausted`** (top-level boolean in the same YAML file): the **agent** sets this to **`true`** when there is no next county to process, or immediately after completing the **last** county in the canonical queue. The orchestration script treats **`queue_exhausted: true`** as normal termination (no further `cursor agent` invocations). It is **not** a second queue list—only a written signal derived from the same rules you use for `done` + the canonical markdown queue.
- Persist per-county outputs under `tools/towns2/coastal/` (see `artefacts` in the state file).
- Internal working notes (segment names, gap-audit notes) may exist **outside** the final per-county list file; the **saved county file** must match the output rules above.

## CLI orchestration (optional)

- **Script:** `tools/towns2/scripts/run-coastal-agent-loop.sh` — run from the **repository root** (or set `TIDECLOCK_REPO_ROOT`). It loops until **`queue_exhausted`** is true in `coastal_queue_state.yaml`, or exits immediately if already true.
- **Happy stop:** `queue_exhausted: true` → script exits **0**.
- **Failure stop:** any **non-zero** exit from the configured agent command → script exits with that code (stderr should show the failure). No extra filesystem “error flag” is required.
- **Re-run later:** you are responsible for resetting the environment (e.g. `queue_exhausted: false`, and aligning `done` / `coastal/*.txt` with what you want redone) so the orchestrator behaves like a fresh population pass.
- **Agent command:** defaults to `cursor agent -p --force` plus the short prompt. Override with **`COASTAL_AGENT_CMD`**: a **whitespace-separated** prefix (e.g. `cursor agent -p --force`); the script appends `--` and the prompt. For unusual quoting or wrappers, edit `run-coastal-agent-loop.sh`. See [Cursor headless CLI](https://www.cursor.com/docs/cli/headless) for current flags; the full coastal rules stay in `coastal_universal_prompt.md`.
