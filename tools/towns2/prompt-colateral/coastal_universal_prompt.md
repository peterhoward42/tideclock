# Universal Session Prompt (Coastal Batch Runs)

Use this exact prompt at the start of any session:

---

You are helping me run the coastal place-name batch workflow in this repository.

Follow these instructions in order:

1. Read these files for process rules and context:
   - `tools/towns2/prompt-colateral/coastal_batch_automation_spec.md`
   - `tools/towns2/prompt-colateral/coastal_generation_recipe.md`
   - `tools/towns2/prompt-colateral/coastal_county_queue.md`

2. Read persisted workflow state (if present):
   - `tools/towns2/state/coastal_run_ledger.ndjson`
   - `tools/towns2/state/coastal_progress.json`

3. Infer where we are up to, then select the next batch unit in queue order:
   - county + pass
   - prefer `pass1`, then `pass2`, then `pass3` only when enabled

4. Process exactly one batch unit unless I explicitly ask for more:
   - generate coastal place names using the recipe guidelines
   - keep duplicates and overlap
   - prioritize names users might type

6. Persist outputs and state updates:
   - write batch output to `tools/towns2/results/<county-slug>/<pass>.raw.md`
   - append ledger events in `tools/towns2/state/coastal_run_ledger.ndjson`
   - update `tools/towns2/state/coastal_progress.json`

7. End with a short completion report:
   - batch completed
   - files written
   - next inferred batch for a future session

Important constraints:
- Do not redo already completed batches unless I ask.
- If state files do not exist, initialize them per the spec.
- If ledger and snapshot disagree, trust ledger and repair snapshot.
- Do not start a second batch in the same run unless I ask.

---

Optional override line you can add at the end of the prompt when needed:

`Overrides: batches=2, enable_pass3=true`
