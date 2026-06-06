/**
 * usageSpanEvents.ts — Short enum-style retention milestone ids and elapsed thresholds.
 * Kind: Definition. `v_*` = since first visit; `c_*` = since first custom location.
 */

const MS_PER_DAY = 86_400_000;

export type UsageSpanAnchor = 'v' | 'c';

export type UsageSpanMilestoneDef = Readonly<{
  /** Same string passed to Vercel `track()`. */
  readonly id: UsageSpanEventType;
  readonly anchor: UsageSpanAnchor;
  readonly minElapsedMs: number;
}>;

const WEEK_THRESHOLDS = [
  ['w1', 1],
  ['w2', 2],
  ['w3', 3],
] as const;

const MONTH_COUNT = 12;

function spanIdsForAnchor(anchor: UsageSpanAnchor): string[] {
  const weekIds = WEEK_THRESHOLDS.map(([suffix]) => `${anchor}_${suffix}`);
  const monthIds = Array.from({ length: MONTH_COUNT }, (_, index) => {
    return `${anchor}_m${index + 1}`;
  });
  return [...weekIds, ...monthIds];
}

/** All retention span event names (`v_w1` … `c_m12`). */
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
        minElapsedMs: month * 30 * MS_PER_DAY,
      };
    },
  );

  return [...weekMilestones, ...monthMilestones];
}

/** Ordered catalog used by the cadence tick (weeks then months per anchor). */
export const USAGE_SPAN_MILESTONES: readonly UsageSpanMilestoneDef[] = [
  ...milestonesForAnchor('v'),
  ...milestonesForAnchor('c'),
];

export const LAUNCHED_AS_PWA_MILESTONE_ID = 'launched_as_pwa' as const;
