# Diagram dev preview catalog (frozen snapshots)

## Purpose

Cross-session notes for **developer-only** affordances that make it easy to
inspect **presentation branches** of the Home tide diagram without hunting for
the right geography, tide phase, and time of day.

This work may span multiple sessions; the **first concrete scenario** is the
only one we implement initially: **no more tides today**.

## Problem

The diagram’s visible behaviour depends jointly on:

- **Tide extremes** for the selected place and local civil day (from fetch and/or cache).
- **The current instant** (“now”), which drives canonical `timeNow`, date readout,
  and which branches fire (e.g. time-to-next-tide thresholds, “no more tides” cases).

Tests cover much of the logic, but **manual visual QA** of a given branch is
slow because the real inputs are hard to arrange.

## Agreed direction (high level)

- Treat **extremes + now** (and **place** as the selector for which extremes) as
  the semantic roots for the live Home diagram.
- Introduce a **choosable mutation** applied **just before** diagram generation
  consumes those roots: optionally replace or tweak extremes and/or the instant
  used for `timeNow` (and related derived spec fields).
- While a preview is active, **time is frozen** for that path: we care about
  **static snapshots** of presentation branching and layout quality, not a
  coherent simulation of the whole app (fetch, midnight rollover, load guards,
  etc.).

Each catalog entry may be a **dedicated bypass** with **no obligation** to
compose cleanly with other previews or with “real” orchestration. The goal is
only: *does this snapshot look the way I expect, and is the quality good?*

## Implementation stance (when coding)

- **Dev-only** (e.g. guarded by `import.meta.env.DEV` and/or explicit query
  params). Never ship as a user-facing feature without a product decision.
- Prefer patching **upstream of** `buildDiagramGenerationSpec` (in Home or a
  small helper it calls) so the **same pipeline** runs: spec build →
  `deriveNextTideSemantics` → diagram generation → SVG. Avoid patching DOM or
  generated SVG for branch logic.
- Keep the **live clock readout** consistent with the **same frozen instant**
  used for spec generation so geometry and labels do not drift.
- While a preview is active, **ignore wall-clock advancement** for diagram regen
  for that consumer (semantic minute / `Date.now()` sampling for spec purposes),
  or treat bumps as no-ops until the preview is cleared.

## Catalog (extensible)

| Id (working) | Intent | Status |
| --- | --- | --- |
| `no-more-tides-today` | After last extreme of the day; exercise copy/layout for “no further tides” (or equivalent) presentation. | **First implementation target** |
| `time-delta-short` | `timeNow` very close to next tide; exercise the strict short-window occlusion where both Now label and Now radial line are omitted (`Δt` strictly less than 5 minutes). | Implemented |
| `time-delta-medium` | `timeNow` in the short window before next tide where the Now label is omitted but the Now radial line remains (`5 minutes ≤ Δt < 1 hour`). | Implemented |
| `atypical-tide-day` | Day’s extrema pattern is atypical; exercise summary / wording branch. See `atypical-tide-story.md`. | Implemented |

## First scenario: no more tides today

**Driving use case** for the initial slice of work.

**Rough behaviour:** with preview active, extremes should still be a valid
civil-day list, but **now** should sit **after** the last extreme’s local time
(so the “no more tides today” branch can fire). Exact semantics should match
whatever the app already defines for that case (tests and spec copy are the
source of truth when implementing).

**Data approach (starter):** simplest path is a **pure function** that takes
`(extremesAtLocation, nowMs)` and returns `(patchedExtremes, patchedNowMs)` for
this scenario only, or builds synthetic extremes + a fixed `timeNow` string—
whichever is smallest and still hits `buildDiagramGenerationSpec` honestly.

**UX (starter):** minimal is enough: e.g. a dev-only query param and/or a tiny
toggle surfaced only in DEV, plus a visible hint that the view is frozen
(“Preview: no more tides today”).

## Non-goals (for this catalog)

- A single global fake clock that all fetch, cache, and rollover logic obey.
- Validating proxy behaviour, storage keys, or out-of-order response handling
  through these previews.
- Guaranteeing that previews compose with each other.

## References in repo

- Home orchestration: `src/ui/routes/Home.svelte` (spec build, minute cadence,
  `Date.now()` today for regen).
- Spec mapping: `src/application/buildDiagramGenerationSpec.ts`,
  `src/application/nextTideSemantics.ts`.
- Tide load seams (optional later if previews need civil-day alignment):
  `src/application/tideExtremesForCivilDayQuery.ts` (`timeNowProvider`).
- Semantic minute injectable clock: `src/application/semanticMinuteCadence.ts`.

## Branch

Work for this initiative is hedged on local branch **`wip/diagram-dev-preview-catalog`**
(created for multi-session use; merge or delete when the approach is settled).
