# Rendering Strategy Summary

## Core Decision

-   Use **inline SVG in the browser**, generated programmatically in
    client-side JavaScript.

## Structural Model

-   Single SVG with layered groups:
    -   `static-frame` (circle, ticks, labels)
    -   `tide-layer` (comb/fan radial profile, future high/low markers)
    -   `live-overlay` (current time hour-hand)

## Update Strategy

-   **Static frame**: render once (layout-dependent only)
-   **Tide layer**: update on:
    -   new tide data
    -   change in "future events" set
-   **Live overlay**: update frequently (e.g. every minute)

## Rationale

-   Separates slow vs fast-changing elements
-   Avoids unnecessary recomputation
-   Prevents visual jitter in stable geometry
-   Enables independent timing control

## Rendering Choice

-   Prefer **SVG over Canvas**:
    -   retained DOM structure
    -   precise geometry
    -   easy partial updates
    -   native text support

## Geometry Model

-   Keep geometry as pure data (center, radius, angles, heights)
-   Renderer maps geometry → SVG elements

## Comb/Fan Decision

-   Represent radial profile as multiple `<line>` elements
-   Endpoints define implied perimeter
-   Optional later addition: path overlay for silhouette (non-essential)

## Invalidation Note

-   "12 hour refresh" applies to data fetch, not strictly to all
    rendering
-   Future-event markers may require earlier updates

## Implementation Pattern

-   Pure geometry functions
-   SVG renderer layer
-   Scheduler:
    -   coarse interval (data / tide layer)
    -   fine interval (clock overlay)
