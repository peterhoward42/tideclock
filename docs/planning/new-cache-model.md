# Tide Data Flow Model (Simplified)

## Core Principle

The system answers a single question:

> Do we currently have the exact data required to render the clock *right now*?

Everything else is derived from this.

---

## Definitions

- **Query**
  - Location
  - Current local time (including DST)
  - Implied 12-hour window (either 00:00–12:00 or 12:00–24:00, local)

- **Store**
  - A single persisted snapshot of tide data
  - Sourced from the external tide service
  - The only client-side source of truth

---

## Model

1. The app requests tide data for the current query.

2. The system checks whether the store contains the required data for:
   - the requested location
   - the required 12-hour window

3. If the store satisfies the query:
   - return the required subset of data

4. If the store does not satisfy the query:
   - fetch fresh data from the external service (covers now → ~3 days)
   - completely replace the store
   - return the required subset of data

---

## Properties

- No cache invalidation logic
- No event-driven fetching
- No partial updates
- No lifecycle complexity

The system does not maintain data. It ensures that the current query can be satisfied.

---

## Notes

- The store is not treated as a cache. It is a replaceable snapshot.
- Future data is not preserved intentionally. The system always reasons from the current query.
- All time interpretation is derived from local time at the moment of the query.
- Validation rules and data shape are intentionally unspecified and can be defined later.
