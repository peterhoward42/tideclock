# Home route: header space and landscape diagram layout

## Purpose

Capture options for reducing vertical (and layout) space consumed by the top header on the **home** route—especially on **simulated or real mobile landscape**—so the tide diagram region below the horizontal rule can use more of the viewport. This doc supports future design and implementation chats without re-deriving context.

Related direction: after header/chrome decisions, improve **space utilisation inside the diagram** based on the **aspect ratio** of the area available to the instrument (separate work; not detailed here).

## Current layout anchors (repo)

- **Shell:** `src/ui/App.svelte` always renders `AppHeader` when `$route === "home"` (dark tone, `center: { kind: "location", town }`), then `<section class="content content--home">` with `Home`.
- **Header component:** `src/ui/components/AppHeader.svelte` — brand (Tide Dial), centre location control (`#/location2`), menu `<details>`.
- **Home instrument:** `src/ui/routes/Home.svelte` — `.home-route` / `.home-panel` / `.home-instrument`; SVG is absolutely positioned to fill the panel.
- **Global content padding:** `src/app.css` — `.content` uses `padding: 1.5rem 1rem 2rem`. `.content--home` currently overrides **background** only (`#000`), not padding, so home still pays the same vertical padding as other routes unless changed later.

## Problem statement (UX)

On wide-short viewports, the semi-circular dial leaves unused black regions; the **header strip** and **content padding** compound the “letterboxed” feel by shrinking the flex area available to the diagram.

## Strategies: reducing header (or chrome) impact on home only

### 1. Conditional full hide (e.g. home + landscape / wide aspect)

- Skip rendering `AppHeader` when on home and the viewport meets a landscape or min-aspect threshold.
- **Requires:** relocating “change location” and “menu” (corner FAB, tap-to-reveal bar, edge hit targets, or duplicating controls inside the diagram margin).
- **Tradeoff:** Discoverability and accessibility need explicit design; safe-area insets still required for notched devices.

### 2. Overlay header (no flex height consumed)

- Keep controls but use `position: fixed` or absolute positioning over the top **safe area**, with optional translucent/gradient scrim so dial ticks stay legible.
- **Tradeoff:** Top of the SVG may be covered unless the diagram layout later reserves top inset—or unless overlay is very slim.

### 3. Compact header variant

- Same `AppHeader` with a `density` / `variant` prop for home+landscape: reduced padding, smaller type, hide brand text and keep location + compact menu icon, etc.
- **Tradeoff:** Still uses some pixels; simpler mental model than full hide.

### 4. Auto-hide / “peek” header

- Show full header briefly, then collapse to a thin handle or top-edge target; expand restores full navigation.
- **Tradeoff:** Extra state and interaction design; strong “max dial” story.

### 5. Fold header actions into existing home chrome

- Home already shows contextual copy near the diagram (e.g. town name, tide phase). Location could become a control in that row; menu could move to a corner—reducing what the top bar must carry or allowing removal.
- **Tradeoff:** Busier instrument region; touch targets must stay adequate.

### 6. Home-only content padding trim

- Override `.content--home` to reduce or remove top/bottom (and optionally horizontal) padding from the global `.content` rule.
- **Tradeoff:** Does not shrink the header itself; pairs well with overlay or compact header.

### 7. Safe-area-first minimal chrome

- Prefer `env(safe-area-inset-*)` padding plus inline controls instead of a full decorative band, so system UI + app chrome do not stack into two thick strips.

## Suggested sequencing

1. **Quick win:** (6) trim `.content--home` padding where it does not harm tap targets or readability.
2. **Choose navigation model:** (3) compact bar vs (1) hide or (2) overlay for home+landscape, depending on tolerance for relocating location/menu.
3. **Later:** diagram layout that respects **available width/height aspect** (coordinate with (2) or (5) so the flex child can approach full viewport height minus safe area).

## Non-goals (for this note)

- Prescribing exact breakpoints or CSS values.
- Implementing diagram-internal aspect-ratio fitting (only flagged as follow-on).

## Open questions for future sessions

- Should “no header” apply only to landscape, or also to small-height portrait?
- Where should “menu” and “change location” live if the top bar is hidden?
- How to satisfy screen-reader and keyboard flows when chrome is hidden or overlayed?
