/**
 * usageSpanEvents.ts — Retention milestone vocabulary for Vercel Web Analytics.
 * Kind: Definition.
 *
 * **Objective.** Product telemetry needs stable, compact event names that fire once
 * when a user crosses elapsed-time thresholds from two independent starting points:
 * first app visit, and first use of a custom tide location. This file owns that
 * naming scheme and the threshold catalog.
 *
 * **Naming (kept short on purpose).** Each event id is `{anchor}_{suffix}`:
 * - `v` — anchored to first visit (`firstVisitUtcMs`).
 * - `c` — anchored to first custom location (`firstCustomLocUtcMs`).
 * - `w1`…`w3` — week bands (1, 2, 3 weeks elapsed from the anchor).
 * - `m1`…`m12` — month bands (1…12 nominal months; see `minElapsedMs` below).
 *
 * **Downstream contract.** Event strings are unioned into `TelemetryEventType` and
 * emitted at most once per user (deduped via persisted `emittedMilestoneIds`).
 */

const MS_PER_DAY = 86_400_000;

/** Which clock starts the elapsed-time window for a milestone. */
export type UsageSpanAnchor = 'v' | 'c';

/** One retention threshold: when to fire, and which anchor clock it measures from. */
export type UsageSpanMilestoneDef = Readonly<{
  /** Same string passed to Vercel `track()`; stable across dashboards. */
  readonly id: UsageSpanEventType;
  readonly anchor: UsageSpanAnchor;
  /** Minimum elapsed ms from the anchor instant before this milestone may emit. */
  readonly minElapsedMs: number;
}>;

/** Week suffixes and their week count — paired with an anchor to form `v_w2`, `c_w2`, etc. */
const WEEK_THRESHOLDS = [
  ['w1', 1],
  ['w2', 2],
  ['w3', 3],
] as const;

/** Month suffixes run `m1`…`m{MONTH_COUNT}` per anchor family. */
const MONTH_COUNT = 12;

/** Builds ordered event ids for one anchor: three week events, then twelve month events. */
function spanIdsForAnchor(anchor: UsageSpanAnchor): string[] {
  const weekIds = WEEK_THRESHOLDS.map(([suffix]) => `${anchor}_${suffix}`);
  const monthIds = Array.from({ length: MONTH_COUNT }, (_, index) => {
    return `${anchor}_m${index + 1}`;
  });
  return [...weekIds, ...monthIds];
}

/** Closed set of all retention span event names (`v_w1` … `c_m12`). */
export const USAGE_SPAN_EVENT_NAMES = [
  ...spanIdsForAnchor('v'),
  ...spanIdsForAnchor('c'),
] as const;

export type UsageSpanEventType = (typeof USAGE_SPAN_EVENT_NAMES)[number];

function milestonesForAnchor(anchor: UsageSpanAnchor): UsageSpanMilestoneDef[] {
  const weekMilestones: UsageSpanMilestoneDef[] = WEEK_THRESHOLDS.map(([suffix, weeks]) => ({
    id: `${anchor}_${suffix}` as UsageSpanEventType,
    anchor,
    minElapsedMs: weeks * 7 * MS_PER_DAY,
  }));

  const monthMilestones: UsageSpanMilestoneDef[] = Array.from(
    { length: MONTH_COUNT },
    (_, index) => {
      const month = index + 1;
      return {
        id: `${anchor}_m${month}` as UsageSpanEventType,
        anchor,
        // Nominal 30-day months — approximate calendar months for a simple cadence.
        minElapsedMs: month * 30 * MS_PER_DAY,
      };
    },
  );

  return [...weekMilestones, ...monthMilestones];
}

/**
 * Ordered catalog for the cadence tick: visit-anchored milestones first, then
 * custom-location-anchored; within each anchor, weeks then months.
 */
export const USAGE_SPAN_MILESTONES: readonly UsageSpanMilestoneDef[] = [
  ...milestonesForAnchor('v'),
  ...milestonesForAnchor('c'),
];

/** One-shot PWA install signal; evaluated separately from elapsed-span milestones. */
export const LAUNCHED_AS_PWA_MILESTONE_ID = 'launched_as_pwa' as const;
