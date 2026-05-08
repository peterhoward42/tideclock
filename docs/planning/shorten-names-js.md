# Plan: shorten-names-js roll-out for tideclock

This document tracks incremental application of the [shorten-names-js](cursor skill) guidance: shorten overlong JS/TS **path segments**, **filenames**, and **symbols** by dropping context already supplied by directory, module, or type — not mechanical truncation.

## Why incremental sessions

- The repo has on the order of **100+** TS/JS/MJS modules under `src/` alone; many basenames exceed the skill’s soft max (~24 chars per segment), often in **coupled families** (`homeRoute*`, `diagramDevPreview*`, `tideExtremes*`, `civilDay*`, time-services, etc.).
- Each batch touches **imports, exports, tests, and sometimes dynamic/tool references**; a single-session “whole repo” pass risks incomplete renames and is hard to validate under token limits.
- Work **one coherent family or directory at a time**, run tests (`npm test` / project script), commit, then move on.

## How to update progress here

Edit the checkboxes below in this file as steps complete:

- Use `- [x]` when a step is **done** (merged or PR landed).
- Use `- [ ]` when **not started** or **in progress**.
- Optional: append a date in parentheses after the checkbox text, e.g. `(2026-05-08)`.

Keeping status in **this same file** gives a persistent, grep-friendly ledger.

---

## Progress

### Phase 0 — Ground rules (once)

- [ ] Skim the **shorten-names-js** Cursor skill (`shorten-names-js/SKILL.md` in your skills directory) before each batch; prefer dropping **redundant** words over cryptic abbreviations.
- [ ] After each batch: full test run; fix imports; avoid renaming **generated** or **tool-contract** paths unless tooling is updated in the same change.
- [ ] Skip or defer: framework-mandated names, string keys used in persisted data, unless you migrate data.

### Phase 1 — Highest-churn filenames (long basenames)

Complete in **separate commits/PRs** if preferred; order is suggestion only.

- [ ] **Time services window API** — `getCurrentTideClockCivilDayDisplayWindow(.test).ts`, `TideClockCivilDayDisplayWindow.ts`, `isAtypicalTideExtremaPattern(.test).ts`: shorten **file basename + primary export(s)** together; grep for imports from `@/` or relative paths after renames.
- [ ] **`src/application/diagram-dev-preview/`** — `diagramDevPreview*` files (~7 modules): folder already says “diagram-dev-preview”; shorten **prefix** on files and exported symbols consistently (collision check with `diagramGeneration*` nearby).
- [ ] **`src/ui/routes/home/homeRoute*`** — long `homeRoute*` basenames (`InstrumentLetterboxObserver`, `WakeLockPresentation`, `MenuSvgTriggerWire`, etc.): `routes/home/` supplies context; shorten to **route-local** names (e.g. drop repeated `Home`/`Route` where path makes it obvious).
- [ ] **Application tide/civil naming** — `tideExtremesForCivilDayQuery`, `tideExtremesRefreshController`, `civilDayRollover*`, `semanticMinuteCadence`, `localWallClockReadoutFromMs`, `buildDiagramGenerationSpec`: shorten symbols + files as **families**; watch for cross-imports between `application/` and `time-services/` / `data-pipelines/`.
- [ ] **`src/data-pipelines/`** — review `fetchStoreExtremes`, `civilDayExtremes`, `buildFromProxy`, `currentLocationSnapshot`, etc.: directory context may allow shorter module names **without** losing distinction from similarly named concepts in `application/`.
- [ ] **`src/diagram-config/`** — `homeTideDiagram*` / `homeTideStyleModel*`: shorten only where **config preset vs types** split stays clear.
- [ ] **`src/application/tide-ux-dev-preview/`** — align with whichever convention you choose for `*-dev-preview` folders.
- [ ] **`tools/` + root configs** — only if basename length is a problem; low priority unless editing those areas anyway.

### Phase 2 — Symbols-only clean-up (optional, after Phase 1)

Use when filenames are acceptable but **exports** remain over soft max (~28 chars).

- [ ] Grep/longest-export pass: prioritize **public-ish** exports reused across packages; rename **internals** second.
- [ ] Ensure **tests** stay readable per skill — do not shorten `it(...)` descriptions just to hit length targets.

### Phase 3 — Directory names (only if clearly redundant)

- [ ] Rename directories only when the rename **plus** updated imports is straightforward (e.g. no deep links from docs/external). Prefer smaller vertical slices (`diagram-dev-preview` → shorter slug) over repo-wide churn.

---

## Batch checklist (repeat per PR)

Copy into the PR description or a scratch note:

1. Bounded scope (one family/folder)?
2. File renames **and** matching symbol renames?
3. All imports updated (including tests and `*.mjs` if applicable)?
4. Tests green?
5. This file’s Phase checkboxes updated?

---

## Reference: longest basenames observed (discovery)

Rough ordering by basename length helps pick Phase 1 order; regenerate with:

`find src -type f \( -name '*.ts' -o -name '*.mjs' \) | while read f; do b=$(basename "$f"); echo "${#b} $b"; done | sort -rn | head`

Examples that motivated Phase 1: `getCurrentTideClockCivilDayDisplayWindow*`, `diagramDevPreviewNoMoreTidesToday*`, `homeRouteInstrumentLetterboxObserver`, etc.
