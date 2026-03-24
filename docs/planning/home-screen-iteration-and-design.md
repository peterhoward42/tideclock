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


## Design Rules (decision-log worthy)

- No domain logic in Svelte components.
- No SVG `d` path construction in application layer.
- Geometry functions are pure, deterministic, and unit-tested.
- SVG mapping functions are pure and snapshot-testable.
- View components are mostly declarative and thin.
- Presentation formatting (text style/date formatting) stays in UI adapters, not in scene model.
- "Outside-clock" info stays in `HomeScreenModel`; the clock component only sees `ClockSceneModel`/layer props.



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
