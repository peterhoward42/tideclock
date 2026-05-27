# Repo hygiene plan

Prepare the repository for more public attention from fellow developers. Work in three phases; use a simple checklist as you go.

**`docs/planning/`** — keep this directory (and `@see` links into it) until **Phase 1 and Phase 2 are complete**. README and other outsider-facing surfaces should point at `docs/specs/` and in-app Tide/Software Nerd only; planning notes are for contributors during the passes.

## Phase 0 — Repo surface

Whole-repo pass on what people see before reading code.

- [x] Tracked files: nothing embarrassing or accidental (except `docs/planning/log.txt` — keep for now; remove manually later)
- [x] `.env.example` for `VITE_TIDE_PROXY_BASE_URL` (`.env` stays gitignored)
- [x] README: accurate, no duplicate blocks, clone → test → build path clear
- [ ] Clear out `docs/planning/` **after Phase 1 and Phase 2** (keep `log.txt` until you remove it manually)
- [x] Docs for outsiders: normative `docs/specs/` and in-app Tide/Software Nerd only (README table)
- [x] `tools/towns2/`: short note that this is location data tooling, not runtime app
- [ ] Commit messages: no need to rewrite history; just avoid vague ones (`log`, `tweak`) going forward

## Phase 1 — Architecture slices

One slice at a time, end to end. Suggested order:

1. Data pathway — fetch, cache, localStorage, quota, civil-day rollover
2. Application — refresh, diagram build, dev previews
3. Presentation — clock, diagram config/generation
4. Time & location — civil day, location services
5. UI & routing — home, PWA, operator notice, menus, other routes
6. Build & deploy — Vite, Vercel, env injection, `buildCommit`
7. Town data tooling — `tools/towns2/` (for contributors extending locations)

Per slice, briefly check:

- [x] Responsibilities clear *(Data pathway, Application — see slice notes below)*
- [x] Tests cover real contracts (gap-hunt only; suite already substantial)
- [x] Names match roles
- [x] Dead code — unused modules, files, functions, types
- [x] Anything worth documenting in README or specs?

**Data pathway** (slice 1): boundaries already clean; no code changes required.

**Application** (slice 2): `buildDiagramSpecWithDerivedNextTide` consolidates Home’s two-pass spec build; `src/application/README.md` maps refresh vs diagram vs dev previews; gap tests for diagram preview catalog and `resolveForHome`.

**Presentation** (slice 3): removed unused `homeScreenModel.ts`; tightened `diagram-generation/index.mjs` to the collaborator barrel; `README.md` in `diagram-generation/`; removed unmounted `TideClock` / `ClockDivisionDial` and orphaned `clock-presentation/` + `clockPathMapping` stack.

**Time & location** (slice 4): moved `minuteCadence` into `time-services/`; `README.md` in `time-services/`, `data/`, and `data-pipelines/`; gap tests for `CivilDayWindow` invariants and `civilDayWindowFromHostClock`; cross-linked `application/README.md`.

**UI & routing** (slice 5): removed unused `dialFrame.js`; `README.md` in `ui/` and `infrastructure/`; gap tests for `formatPwaWakeStatusLine` branches and `isStandaloneDisplayMode`; root README doc table links contributor map.

**Build & deploy** (slice 6): extracted `build/resolveBuildCommitShort.mjs` with unit tests; `build/README.md` for Vite env, `vercel.json` cache policy, and `buildCommit` wiring; slimmed `vite.config.js`.

**Town data tooling** (slice 7): isolated location corpus generation in `tools/towns2/` with a contributor README and source-of-truth pipeline note; `npm run build-towns2-data` compiles curated coastal TSVs into `src/data/towns2.compact.json`, which feeds the baked towns schema, query helpers, and tests (`bakedTowns2.ts`, `townSchema.ts`, `townPickerDisplay.ts`).

## Phase 2 — Cross-cutting (only where needed)

After Phase 0–1, or if something obvious appears:

- [ ] Security / privacy — proxy URL, no secrets in repo, localStorage, attribution
- [ ] Accessibility — home and menus if UI slice flagged gaps
- [ ] Licensing — MIT app + tide data wording + generated town data
- [ ] Consistency — naming, errors, copy — only if drift showed up in Phase 1

## Approach

- **Phase 0 first** — quick trust wins on GitHub.
- **Phase 1 primary** — matches `src/` layout; catches boundary issues.
- **Phase 2 surgical** — not a full-repo sweep of every dimension.

Avoid a dimensions-only pass across all files (naming, tests, docs separately everywhere) — high context-switch, misses integration bugs. Avoid architecture-only — misses repo surface and policy items.

## Out of scope (for this plan)

- Rewriting git history
- Large refactors or test rewrites for their own sake
- tideproxy repo (separate project)
