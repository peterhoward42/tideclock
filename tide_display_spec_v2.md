# Tide Display --- Conceptual Specification (v2)

## Frame

-   Define a 2D plane with a central point **C**
-   Define a scalar **R** as the primary radius
-   All elements are positioned relative to **C** and **R**

------------------------------------------------------------------------

## Outer Circle

-   Draw a circle:
    -   center: **C**
    -   radius: **R**

------------------------------------------------------------------------

## Ticks

-   Define 12 equally spaced angles over 360°

-   For each angle **θ**:

    -   Draw a radial line:
        -   start: radius **R**
        -   end: radius **R − (R × 0.09)**
        -   angle: **θ**

-   The set of these lines is **ticks**

------------------------------------------------------------------------

## Hour Annotation

-   For each tick angle **θ**:

    -   Place a label at:
        -   radius: **R − (R × 0.18)**
        -   angle: **θ**

-   Labels map angular position to clock hour values

------------------------------------------------------------------------

## High Mark

-   Define an angle **θ_high**

-   Place a mark:

    -   type: point
    -   radius: **R**
    -   angle: **θ_high**

------------------------------------------------------------------------

## Low Mark

-   Define an angle **θ_low**

-   Place a mark:

    -   type: point
    -   radius: **R**
    -   angle: **θ_low**

------------------------------------------------------------------------

## Radial Height Profile

-   Define a set of angles **θ ∈ \[0, 360°)** sampled at small intervals

-   For each angle **θ**:

    -   Define a radius **r(θ)**\
        (a continuous function describing tide height over time)

    -   Draw a radial line:

        -   start: radius **R × 0.07**
        -   end: radius **r(θ)**
        -   angle: **θ**

-   The set of these lines is **radial height profile**

-   The envelope formed by the endpoints of these lines defines an
    implied perimeter shape

------------------------------------------------------------------------

## Notes on Interpretation

-   Angular position corresponds directly to clock time
-   Radius within the radial height profile encodes tide height
-   Only future tide events are represented by **high mark** and **low
    mark**
-   No requirement that **r(θ)** be symmetric or periodic in this
    representation

------------------------------------------------------------------------

## Why this format works

-   Provides a stable abstraction layer above SVG
-   Supports multiple rendering targets (SVG, Canvas, etc.)
-   Maps directly to shared design handles
