# Home route: menu flyout as sibling of `figure` (spec)

**Status:** Ready to implement  
**Scope:** Home route only — the diagram-embedded “Menu” trigger stays inside the SVG; the **flyout panel** moves in the DOM so it is not clipped by `figure.home-instrument { overflow: hidden }`.  
**Out of scope:** Document routes (`PrimaryNavMenu` / `.nav-links`), header theming, install copy.

---

## Problem (one sentence)

The install flow expands the flyout height; the panel is `position: absolute` and **bottom-anchored** from the menu trigger, so it grows **upward** and its top can sit **above** the top of `figure.home-instrument`, which **clips** descendants. Inner `overflow-y: auto` on the panel does not help because the **scrollport** is itself partly outside the clip.

---

## Product constraint (unchanged)

Keep the **menu control** (SVG `HomeMenuTrigger` group) **inside the diagram** on the home route for an appliance-like feel. This change does **not** move the trigger; it only changes **where the flyout panel is mounted** in the box tree and how its position is expressed.

---

## Current DOM (simplified)

```text
div.home-panel[bind=diagramHostEl]
  figure.home-instrument[bind=homeInstrumentEl, overflow: hidden]
    svg …
    [optional] div.home-landscape-hint-strip
    [if open] div.home-menu-panel[style=left/bottom]  ← child of figure; clips here
```

**Anchor style today:** `homeRouteDiagramDom.ts` — `computeHomeMenuPanelAnchorStyle(figure, trigger)` returns `left` / `bottom` in **figure** coordinates (same as positioning relative to the figure when the panel is a child of the figure).

---

## Target DOM

```text
div.home-panel[bind=diagramHostEl, position: relative]   ← positioning context for the flyout
  figure.home-instrument[overflow: hidden]                 ← only SVG + landscape hint; clip unchanged
    svg …
    [optional] div.home-landscape-hint-strip
  [if open] div.home-menu-panel[style=left/bottom]         ← sibling of figure; not clipped by figure
```

**Invariants**

- `diagramHostEl` still points at `.home-panel` (route effects, trigger query `diagramHost.querySelector('svg g[data-name="HomeMenuTrigger"]')` unchanged).
- `homeInstrumentEl` still points at the `figure` (fullscreen, letterbox observer, other glue).
- `homeMenuPanelEl` still the flyout node for outside-click and anchor updates.

---

## Positioning math

The flyout is `position: absolute` with `left` and `bottom` in the **containing block** of `.home-panel`.

With `panelRect = diagramHost.getBoundingClientRect()` and `triggerRect = trigger.getBoundingClientRect()`:

- `left: max(0, triggerRect.left - panelRect.left)` (px)
- `bottom: max(0, panelRect.bottom - triggerRect.bottom + 8)` (px) — same **intent** as today (“just above the trigger,” 8px gap), relative to the **host bottom** instead of the figure bottom.

**Equivalence note:** While `figure` fills `home-panel` (no extra padding, full width/height flex child), `figure.getBoundingClientRect()` and `diagramHost.getBoundingClientRect()` should match on the key edges, so the **visual** anchor should match the pre-change behaviour. The important part is the **containing block** is `home-panel`, not `figure`, so the panel is no longer clipped when it extends above the figure.

**Refactor of `computeHomeMenuPanelAnchorStyle`**

- Prefer a clear signature, e.g. `computeHomeMenuPanelAnchorStyle(diagramHost: HTMLElement, trigger: SVGGElement): string` with a short JSDoc: **positioning context is the diagram host (`.home-panel`), not the figure — flyout is a sibling of the figure.**
- Remove the `figure` parameter from the public helper once call sites are updated (or keep an overload that delegates for tests only; avoid two parallel implementations).

**Call sites to update**

- `homeRouteMenuSvgTriggerWire.ts` — `updateAnchorFromDom` currently passes `figure` into the style function; it should pass **diagram host** (the `getDiagramHost()` return value) instead of `getInstrumentFigure()`.
- `HomeRoute.svelte` — the `$effect` that recomputes the anchor on install / PWA section toggles: same change (use host, not figure).

---

## CSS (`HomeRouteTidePanels.svelte`)

1. **`.home-panel`** (at least in the successful-diagram branch, or for all `home-panel` uses if safe): set `position: relative` so the absolute flyout is positioned against it. Confirm empty / loading / error `home-panel` rows do not gain weird stacking side effects; if so, only the diagram branch’s wrapper can get a class e.g. `home-panel--diagram-host` with `position: relative`.

2. **`.home-menu-panel`**: keep existing look (`z-index`, `max-height`, `overflow-y`, etc.). Ensure stacking is **above** the `figure` (sibling after `figure` in source order usually paints on top; add `z-index` if anything regresses on a target browser).

3. **`.home-instrument`:** keep `overflow: hidden` — no need to change for this fix.

---

## Wire-up checklist

- [ ] Move the `{#if homeMenuOpen} … {/if}` block from **inside** `figure` to **after** `</figure>`, still inside `div.home-panel`.
- [ ] Update `computeHomeMenuPanelAnchorStyle` and all callers to anchor against `diagramHost`.
- [ ] Run existing tests; **extend** `homeRouteDiagramDom.test.ts` (it already covers `computeHomeMenuPanelAnchorStyle`) so expectations match the new `diagramHost` signature and any renamed parameters.

---

## Manual verification (Android Chrome + one desktop)

- [ ] Open home, tap diagram menu, open **Install app** — full install narrative visible or scrollable **without** top clipping.
- [ ] Open **App display** + install in combination; re-anchor still looks correct.
- [ ] Tap outside: menu still closes; trigger still opens/closes.
- [ ] Rotate / resize: menu anchor stays near trigger (no drift against host).
- [ ] **Fullscreen** entry/exit if it touches the same nodes.

---

## Why not rely on `overflow: visible` on the figure

Product preference: avoid changing the figure’s overflow behaviour; keep clipping policy for the SVG and hint as-is. Sibling mount is a **structural** fix with a one-line “flyout is not a child of the clipped box” story.

---

## File touch list (expected)

| File | Change |
|------|--------|
| `src/ui/routes/home/HomeRouteTidePanels.svelte` | DOM order; `position: relative` on host; no logic change to props. |
| `src/ui/routes/home/homeRouteDiagramDom.ts` | Rework `computeHomeMenuPanelAnchorStyle` to use `diagramHost` + JSDoc. |
| `src/ui/routes/home/homeRouteMenuSvgTriggerWire.ts` | Pass diagram host to anchor helper. |
| `src/ui/routes/home/HomeRoute.svelte` | Re-anchor effect: pass host not figure. |
| `src/ui/routes/home/homeRouteDiagramDom.test.ts` | Update tests for the new `computeHomeMenuPanelAnchorStyle` signature. |

---

## Rollback

Revert the DOM move and restore `computeHomeMenuPanelAnchorStyle(figure, trigger)`; feature returns to pre-change clipping behaviour for tall install content.
