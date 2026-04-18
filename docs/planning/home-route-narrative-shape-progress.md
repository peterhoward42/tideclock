# Home route: narrative shape — progress log

## Purpose

**Living checklist and session log** for work toward [`home-route-narrative-shape.md`](./home-route-narrative-shape.md), using the strategy order in [`home-route-narrative-shape-strategies.md`](./home-route-narrative-shape-strategies.md).

**How to use:** At the end of each session that touches this initiative, update **Session log** (one row or bullet) and tick or adjust **Phase checklist** so the next session does not re-derive state from memory or git archaeology alone.

## Current snapshot

| Field | Value |
|--------|--------|
| **Last updated** | 2026-04-18 |
| **Phases touched** | Phases 1–4 |
| **Notes** | Phase 1: URL/query helpers in `homeRouteUrlQuery.ts`. Phase 2: `Home.svelte` script grouped. Phase 3: presentational children under `src/ui/routes/home/`. Phase 4: diagram DOM + menu SVG wiring + letterbox observer in `homeRouteDiagramDom.ts`, `homeRouteInstrumentLetterboxObserver.ts`, `homeRouteMenuSvgTriggerWire.ts` (`homeRouteDiagramDom.test.ts` for anchor math). |

## Phase checklist (strategy doc)

Use phase names from [`home-route-narrative-shape-strategies.md`](./home-route-narrative-shape-strategies.md).

- [x] **Phase 1** — Pure / policy logic in `.ts` (+ tests where valuable)
- [x] **Phase 2** — Script narrative: grouping and skim-oriented structure inside `Home.svelte`
- [x] **Phase 3** — Presentational child components for major template regions
- [x] **Phase 4** — Orchestration-heavy regions (effects, collaborators, DOM) behind clear seams
- [ ] **Phase 5** — Optional thin route shell / extra modules (only if still warranted)

Optional **sub-targets** (fill in and tick as you go; replace when stale):

- [x] Dev preview effective search string + dev debug query flags → `src/ui/homeRouteUrlQuery.ts`
- [x] Script skim order + section comments in `src/ui/routes/Home.svelte`
- [x] Dev preview banners → `src/ui/routes/home/HomeRouteDevPreviewBanners.svelte`
- [x] Dev DOM dump panel → `src/ui/routes/home/HomeRouteDomDebugPanel.svelte`
- [x] Tide body (loading / errors / empty / diagram + overlays) → `src/ui/routes/home/HomeRouteTidePanels.svelte`
- [x] Diagram host dev paint + clock patch DOM + menu anchor math → `src/ui/routes/home/homeRouteDiagramDom.ts`
- [x] Instrument letterbox `ResizeObserver` → `src/ui/routes/home/homeRouteInstrumentLetterboxObserver.ts`
- [x] SVG menu trigger wire (RAF attach, listeners) → `src/ui/routes/home/homeRouteMenuSvgTriggerWire.ts`

## Session log

Newest first.

| Date | Focus | Outcome / links |
|------|--------|------------------|
| 2026-04-18 | Phase 4 | Extracted diagram-host dev presentation, clock text patch, menu panel anchor style, instrument letterbox observer, and menu SVG trigger wiring from `Home.svelte` into colocated `homeRoute*.ts` under `src/ui/routes/home/`; unit tests for `computeHomeMenuPanelAnchorStyle`. |
| 2026-04-18 | Phase 3 | Split `Home.svelte` template into `HomeRouteDevPreviewBanners`, `HomeRouteDomDebugPanel`, and `HomeRouteTidePanels` (`$bindable` for `diagramHostEl` / `homeInstrumentEl` / `homeMenuPanelEl` so route effects unchanged). Styles colocated with each child. |
| 2026-04-17 | Phase 2 | Reordered `Home.svelte` `<script>`: file-level skim blurb; sections for route inputs, collaborator, `$state`, `$derived`, `onMount`, `$effect`, then handlers. Consolidated dev debug `$state` with other route state; `displayOptimisation` subscribe `onMount` grouped with other mounts. |
| 2026-04-17 | Phase 1 | Extracted `effectiveSearchStringFromLocationParts` and `homeRouteDevDebugFlagsFromSearch` to `src/ui/homeRouteUrlQuery.ts`; `Home.svelte` imports them. Added `homeRouteUrlQuery.test.ts`. |
| 2026-04-17 | Planning | Added mission doc, strategies doc, and this progress tracker. No code refactors yet. |

---

## Blockers and open questions

_Use this section for decisions that should survive the next session (e.g. “defer Phase 5”, “prefer colocated tests in `src/ui/` for …”). Remove items when resolved._

- _(none)_
