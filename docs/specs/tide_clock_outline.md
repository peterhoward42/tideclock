# Tide Clock Application – High Level Outline

## Purpose
A single-purpose, always-on “information appliance” that presents tidal state for a fixed UK location using a clock-like radial display.

---

## Core Concept

The system models the tide as a **set of timestamped extrema (high and low events)** within a defined time interval, rather than as a fully continuous function.

The display is a **24-hour analogue dial** representing:

- the current civil day `[00:00, 24:00)`  
- the current time  
- all tide extrema occurring within that day  

---

### 3. Time Model

- Primary interval: **current civil day in local time**
  - `[today 00:00, tomorrow 00:00)`
- Interval is half-open:
  - includes `00:00`, excludes next `00:00`

- All time computations must:
  - use consistent timezone
  - handle DST transitions correctly

- The system explicitly acknowledges:
  - physical tide continuity across midnight
  - visual clipping at day boundaries

---

### 8. Technology

- Svelte (SPA)
- Static hosting
- SVG rendering
- Client-side routing

---
