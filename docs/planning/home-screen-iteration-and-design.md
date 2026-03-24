# Home Screen Iteration and Design

## Recommended Separation

You are really dealing with four distinct concerns, and separating them early will prevent SVG code from becoming the new business-logic layer.

1. **Clock Semantics (what exists)**
   - Time divisions (24h ring, hour ticks, quarter ticks)
   - Tide events (high/low markers at instants)
   - Tide interpolation shape inputs (the "breathing" signal over time)
   - "Now" position
   - This is pure model space, no SVG strings/DOM.

2. **Scene Geometry (where things are)**
   - Convert semantics to geometry primitives in normalized coordinates.
   - Example outputs: angles, radii, points, arc segments, polylines/path control points.
   - Still no SVG elements, no Svelte.

3. **SVG Mapping (how geometry becomes SVG attrs)**
   - Translate geometry primitives to SVG-friendly values:
     - `d` strings, `transform`, stroke/fill params, viewBox scaling.
   - This is where SVG knowledge lives.
   - Keep pure/deterministic for testability.

4. **UI Composition (how it enters DOM)**
   - Svelte components that bind attrs and render layers.
   - Handles interaction, accessibility wiring, theme class selection.
   - Should not re-derive domain/geometry logic.

## Concrete Module Layout (fits current layering)

Use this naming pattern:

- `src/application/clockSceneModelQuery.ts`
  - Produces `ClockSceneModel` from domain inputs.
- `src/application/clockGeometry.ts`
  - Semantic model -> normalized geometry primitives.
- `src/ui/svg/clockPathMapping.ts`
  - Geometry -> SVG attrs (`d`, transforms, etc.).
- `src/ui/components/tide-clock/`
  - `TideClockRoot.svelte` (composition)
  - `DialLayer.svelte`
  - `MarkersLayer.svelte`
  - `BreathingLayer.svelte`
  - `NowLayer.svelte`

And screen-level:

- `src/application/homeScreenModelQuery.ts`
  - Builds `HomeScreenModel` with `clockScene` + outside-clock data (location, status, current time instant).

## Key Data Contracts (terminology to keep stable)

- `HomeScreenModel`
  - `location`
  - `clockNowInstant`
  - `loadState`
  - `clockScene: ClockSceneModel`

- `ClockSceneModel` (semantic, not presentational)
  - `window` (24h reference)
  - `divisions` (semantic ticks)
  - `extremeMarkers` (kind + instant + magnitude metadata)
  - `breathingSignal` (time-series / control points in semantic time)
  - `nowInstant`

- `ClockGeometry`
  - normalized coordinates + angles/radii only

- `ClockSvgLayerProps`
  - concrete SVG attrs consumed by layer components

This keeps "model" meaning clear:
- **Scene Model** = render-intent semantics
- **Geometry** = spatial representation
- **SVG Props** = view tech representation

## Design Rules (decision-log worthy)

- No domain logic in Svelte components.
- No SVG `d` path construction in application layer.
- Geometry functions are pure, deterministic, and unit-tested.
- SVG mapping functions are pure and snapshot-testable.
- View components are mostly declarative and thin.
- Presentation formatting (text style/date formatting) stays in UI adapters, not in scene model.
- "Outside-clock" info stays in `HomeScreenModel`; the clock component only sees `ClockSceneModel`/layer props.

## Suggested Iteration Plan (across sessions)

1. Freeze interfaces first (`ClockSceneModel`, `HomeScreenModel`).
2. Implement geometry for one layer (time divisions) + tests.
3. Add marker layer geometry + tests.
4. Add breathing layer geometry + tests.
5. Add SVG mapping helpers + snapshot tests.
6. Wire Svelte layered components.
7. Add interaction/accessibility (hover/focus labels, current-time announcement).

This allows incremental progress without entangling concerns.

## Stashable Reference (ADR seed)

**Title:** Tide Clock Rendering Architecture  
**Status:** Accepted (provisional)  
**Decision:**
- Adopt 4-layer pipeline: `Semantics -> Geometry -> SVG Mapping -> DOM Composition`.
- Use `HomeScreenModel` for route data and `ClockSceneModel` for clock-only semantics.
- Keep SVG generation out of application layer; keep domain logic out of UI components.
- Build clock as layered SVG components consuming mapped layer props.

**Consequences:**
- Higher upfront structure, lower long-term coupling.
- Better unit-test granularity (semantics/geometry/mapping independently).
- Easier to evolve visuals without touching domain query logic.
