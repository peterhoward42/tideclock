# Tide Data Flow Model

## Core Principle

The system answers a single question:

> Do we currently have the exact data required to render the dial *for today*?

Everything else is derived from this.

---

## Definitions

- **Query**
  - Location
  - Current local time (including DST)
  - Implied civil day interval:
    - `[today 00:00, tomorrow 00:00)` (local)

- **Store**
  - A single persisted snapshot of tide data
  - Sourced from the external tide service
  - The only client-side source of truth

---

## Model

1. The app requests tide data for the current query.

2. The system checks whether the store contains the required data for:
   - the requested location
   - the current civil day `[00:00, 24:00)`

3. If the store satisfies the query:
   - return all tide extrema events within the civil day

4. If the store does not satisfy the query:
   - fetch fresh data from the external service (covers now → ~3 days)
   - completely replace the store
   - return all tide extrema events within the civil day

---

## Required Data

- Tide extrema events `E` such that:
  - `00:00 ≤ timestamp < 24:00` (same local day)
- Each event has:
  - `timestamp`
  - `type ∈ {high, low}`

No assumptions about:
- number of events
- alternation pattern

---

## Notes

- The store is not treated as a cache. It is a replaceable snapshot.
- Future data is not preserved intentionally. The system always reasons from the current query.
- All time interpretation is derived from local time at the moment of the query.
- Rendering is strictly data-driven (no inferred or synthetic events).
- Events near midnight belong to adjacent days even though the tide cycle is continuous.
- Validation rules and data shape are intentionally unspecified and can be defined later.
