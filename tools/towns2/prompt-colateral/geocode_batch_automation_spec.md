# Geocode batch automation (coastal lists → lat/lon TSV)

## Intent

- Drive **pass 1** geocoding (one TSV row per source line, merge semantics for partial ranges) as specified in `geocode_universal_prompt.md`.
- Each headless Cursor agent run is a **fresh session** that performs **at most one** line batch (or **zero** if the queue is already finished), then updates YAML state on disk.

## State

- **File:** `tools/towns2/state/geocode_queue_state.yaml`
- **`queue_exhausted`** (top-level boolean): agent sets **`true`** when every configured stem has no remaining lines. The shell orchestrator stops when this is **`true`** before invoking the agent.
- **`lines_per_batch`:** size of the 1-based inclusive range processed per iteration (`next_line_start` … `next_line_start + lines_per_batch - 1`, clamped to file length).
- **`stems`:** ordered list of stems (basenames without `.txt`). If **empty**, stems are **all** `tools/towns2/coastal/*.txt` basenames, **sorted lexicographically** (stable, reproducible).
- **`current_stem` / `next_line_start`:** next work pointer. Empty `current_stem` means the agent should initialise from the first stem that still needs work (see universal prompt).

## Outputs

- Per stem: `tools/towns2/coastal-geocoded/<stem>.tsv` — merge when the file already exists (see `geocode_universal_prompt.md`).

## CLI orchestration

- **Script:** `tools/towns2/scripts/run-geocode-agent-loop.sh` — run from the **repository root** (or set `TIDECLOCK_REPO_ROOT`). It loops until **`queue_exhausted`** is true in `geocode_queue_state.yaml`, or exits immediately if already true.
- **Happy stop:** `queue_exhausted: true` → script exits **0**.
- **Failure stop:** non-zero exit from the configured agent command → script exits with that code.
- **Resume:** adjust `current_stem`, `next_line_start`, `stems`, and/or `queue_exhausted: false` so the next iteration matches the TSVs on disk; see universal prompt for advancement rules.
- **Agent command:** defaults to `cursor agent -p --force` plus the short prompt. Override with **`GEOCODE_AGENT_CMD`** (whitespace-separated prefix); the script appends `--` and the prompt. Mirror of `COASTAL_AGENT_CMD` / `run-coastal-agent-loop.sh`.

## Relationship to the coastal county loop

- `run-coastal-agent-loop.sh` grows **place name lists** under `coastal/`.
- `run-geocode-agent-loop.sh` consumes those lists into `coastal-geocoded/`. Ordering defaults to lexicographic stems unless you pin an order in `stems:`.

## Resume after a manual trial

If you geocoded a slice (e.g. Cornwall lines 1–30) outside this loop, set **`current_stem`** and **`next_line_start`** in `geocode_queue_state.yaml` before the first loop run (e.g. `cornwall` / `31`). Otherwise an empty **`current_stem`** starts at the **first** stem in the configured order (lexicographic when **`stems:`** is empty — e.g. `aberdeen-city` before `cornwall`).
