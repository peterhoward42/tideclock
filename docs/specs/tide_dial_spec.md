# Tide Dial (24-Hour) Rendering Specification

## 1. Time Model

- Define the display interval as the **current civil day** in station local time:
  - `[today 00:00, tomorrow 00:00)`
- Interval is **half-open**: include `00:00`, exclude next `00:00`

## 2. Dial Geometry

- Circular dial representing 24 hours
- `00:00` fixed at top (12 o'clock position)
- Time increases **clockwise**
- Map time `t` to angle:
  - `angle = 2π * (seconds since 00:00 / 86400)`

## 3. Input Data

- Tide extrema as ordered sequence:
  - Each event has:
    - `timestamp`
    - `type ∈ {high, low}`

## 4. Event Selection

- Select all events where:
  - `00:00 ≤ timestamp < 24:00` (same local day)
- Result is ordered list `E`

## 5. Cardinality

- `|E| ≥ 0`
- No assumptions about:
  - number of events
  - alternation pattern
- Typical:
  - semidiurnal: 4 events
  - diurnal: 2 events

## 6. Rendering

- For each `e ∈ E`:
  - Compute angular position from timestamp
  - Plot on dial
- No inferred or synthetic events

## 7. Temporal Classification

- Let `now` be current time (same timezone)
- For each `e ∈ E`:
  - if `e.timestamp < now` → `past`
  - else → `future`

## 8. Time Consistency

- All timestamps, `now`, and boundaries must use:
  - same timezone
  - consistent DST handling

## 9. Continuity Note

- Tide cycle is continuous across midnight
- Display clips to civil day:
  - events near `23:xx` and `00:xx` are adjacent in reality but separated by dial boundary

## 10. Design Principle

- Model is **data-driven**, not pattern-driven
- Do not assume fixed counts or pairing
- Renderer must handle any valid `E` without special casing
