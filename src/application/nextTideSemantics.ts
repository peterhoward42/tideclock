/**
 * Minute-scale next-tide semantics: single derivation per tick, consumed by diagram layout
 * instead of re-scanning `tideMarks.markers`. Shapes mirror diagram-generation parsers
 * (`timeCanonical.mjs`, `tideEvents.mjs`).
 *
 * @see docs/planning/dynamics-planning.md — Next-event derivation, phased plan step 1
 */

/** Parsed `spec.timeNow` in the same sense as `parseCanonicalTimeOrThrow`. */
export type DiagramParsedTimeNow = {
  readonly canonical: string;
  /** Seconds since local midnight; `86400` only when `isRightEndpoint` (24:00:00). */
  readonly seconds: number;
  /** Fractional hours from the canonical parser (`seconds / 3600`). */
  readonly hours: number;
  readonly isRightEndpoint: boolean;
};

/**
 * Next qualifying tide marker at or after `timeNow` within the civil day, plus TimeDelta text.
 * `null` when no marker qualifies (same decision as `computeNextTideEventCore` → null).
 */
export type DiagramNextTideEvent = {
  /** Absolute seconds since midnight for the marker time. */
  readonly secondsSinceMidnight: number;
  /** Marker tide kind (`highOrLow` in spec). */
  readonly kind: string;
  /**
   * Forward interval from current `timeNow` to this event (`formatIntervalHoursMinutes` in tideEvents).
   * CentreCluster TimeDelta uses this after the fixed glue segment.
   */
  readonly timeDeltaIntervalText: string;
};

/**
 * One semantic refresh worth of next-event facts for NowPointer, TimeDelta, NextPointer, and WaitArc:
 * angular layout uses `timeNow.hours` and `nextTide.secondsSinceMidnight / 3600` with `timeToTheta`.
 */
export type DerivedNextTideSemantics = {
  readonly timeNow: DiagramParsedTimeNow;
  readonly nextTide: DiagramNextTideEvent | null;
};
