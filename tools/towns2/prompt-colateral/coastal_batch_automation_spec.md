# Coastal Batch Automation Specification

## Purpose
Define a repeatable, session-resumable process for generating coastal location names county-by-county in batches.

The process must:
- persist progress to files in `tools/towns2/`
- allow the same user prompt to be reused in each session
- let the assistant infer what is next without manual tracking

---

## Scope
- Input queue: `tools/towns2/prompt-colateral/coastal_county_queue.md`
- Generation method: `tools/towns2/prompt-colateral/coastal_generation_recipe.md`
- Persistence root: `tools/towns2/state/`
- Output root: `tools/towns2/results/`

---

## Batch Unit
The canonical batch unit is:
- one county
- one pass (`pass1`, `pass2`, `pass3`)

Each session may process one or more batch units, but every unit is tracked independently.

---

## Required State Files

## 1) Run Ledger (append-only)
Path: `tools/towns2/state/coastal_run_ledger.ndjson`

Format: one JSON object per line.

Each record MUST include:
- `ts` (ISO timestamp)
- `event` (`start_batch` | `complete_batch` | `skip_batch` | `revise_batch`)
- `county` (string)
- `pass` (`pass1` | `pass2` | `pass3`)
- `session_id` (string; generated per chat session)
- `notes` (string; optional but preferred)

This file is the source of truth for historical actions.

## 2) Derived Progress Snapshot (rewritable)
Path: `tools/towns2/state/coastal_progress.json`

This is a convenience summary derived from ledger history to speed resume logic.

Recommended shape:
- `version`
- `updated_at`
- `next_county`
- `next_pass`
- `completed`: object keyed by county with booleans for each pass
- `in_progress`: optional current batch metadata

If snapshot and ledger disagree, ledger wins.

---

## Required Output Files
For each batch unit:
- `tools/towns2/results/<county-slug>/<pass>.raw.md`

Example:
- `tools/towns2/results/cornwall/pass1.raw.md`

The `.raw.md` file should contain the generated list exactly as accepted for that pass, with minimal formatting.

---

## Session Resume Algorithm
At the beginning of each run:

1. Read:
   - county queue file
   - generation recipe file
   - run ledger (if present)
   - progress snapshot (if present)
2. Reconstruct completion state (prefer ledger truth).
3. Select next batch unit by queue order:
   - first county with incomplete `pass1`
   - then `pass2`
   - then `pass3` (optional; only if enabled for the workflow)
4. Announce selected batch unit before generating.
5. Write `start_batch` ledger record.
6. Generate results and persist to pass output file.
7. Write `complete_batch` ledger record.
8. Update snapshot.

If a batch fails mid-run:
- write a `skip_batch` record with reason
- do not mark as complete

---

## Idempotency Rules
- Never overwrite an existing completed pass output unless explicitly asked.
- If rerunning a completed pass intentionally, log `revise_batch` and write a new section in the same `.raw.md` file with timestamped heading, or create `passN.revision-<ts>.raw.md`.
- Repeated prompt runs must be safe; they should advance only when prior state indicates incomplete work.

---

## Prompt Stability Rules
To support identical prompts across sessions:
- Prompt should avoid hardcoding county/pass.
- County/pass selection must come from persisted state.
- Prompt should explicitly instruct:
  - "read state"
  - "infer next batch"
  - "process next batch only (or configured batch count)"
  - "write updated state"

---

## Minimal Directory Layout
Expected layout under `tools/towns2/`:

- `prompt-colateral/coastal_county_queue.md`
- `prompt-colateral/coastal_generation_recipe.md`
- `prompt-colateral/coastal_batch_automation_spec.md`
- `prompt-colateral/coastal_universal_prompt.md`
- `state/coastal_run_ledger.ndjson`
- `state/coastal_progress.json`
- `results/<county-slug>/pass1.raw.md`
- `results/<county-slug>/pass2.raw.md`
- `results/<county-slug>/pass3.raw.md` (optional)

---

## Operational Defaults
- Default batch count per run: 1 batch unit
- Default passes enabled: `pass1`, `pass2`
- `pass3` is opt-in
- Keep duplicates in generated names
- Prioritize search utility over strict geographic correctness

---

## Acceptance Criteria
A run is valid when all are true:
- The selected county/pass is deterministically inferred from state and queue.
- Output file for that batch is written.
- Ledger has matching `start_batch` and `complete_batch` events.
- Snapshot reflects new completion state.
- Next run with same prompt continues from the subsequent incomplete batch.
