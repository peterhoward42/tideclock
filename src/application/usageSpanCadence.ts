/**
 * usageSpanCadence.ts — Pure retention/PWA milestone evaluation for the minute tick.
 * Kind: Application policy. No I/O.
 */

import type { TelemetryEventType } from '../infrastructure/analytics/eventType';
import {
  LAUNCHED_AS_PWA_MILESTONE_ID,
  USAGE_SPAN_MILESTONES,
} from '../infrastructure/analytics/usageSpanEvents';

export type UsageSpanTickInput = Readonly<{
  nowUtcMs: number;
  firstVisitUtcMs: number | undefined;
  firstCustomLocUtcMs: number | undefined;
  emittedMilestoneIds: ReadonlySet<string>;
  standalonePwa: boolean;
}>;

export type UsageSpanTickResult = Readonly<{
  eventsToTrack: readonly TelemetryEventType[];
  newlyEmittedIds: readonly string[];
}>;

export function ensureFirstVisitAnchor(
  nowUtcMs: number,
  firstVisitUtcMs: number | undefined,
): Readonly<{ firstVisitUtcMs: number; seeded: boolean }> {
  if (firstVisitUtcMs !== undefined) {
    return { firstVisitUtcMs, seeded: false };
  }
  return { firstVisitUtcMs: nowUtcMs, seeded: true };
}

function anchorUtcMs(
  anchor: 'v' | 'c',
  input: UsageSpanTickInput,
): number | undefined {
  return anchor === 'v' ? input.firstVisitUtcMs : input.firstCustomLocUtcMs;
}

export function evaluateUsageSpanMilestones(input: UsageSpanTickInput): UsageSpanTickResult {
  const eventsToTrack: TelemetryEventType[] = [];
  const newlyEmittedIds: string[] = [];

  for (const milestone of USAGE_SPAN_MILESTONES) {
    if (input.emittedMilestoneIds.has(milestone.id)) {
      continue;
    }
    const anchorMs = anchorUtcMs(milestone.anchor, input);
    if (anchorMs === undefined) {
      continue;
    }
    if (input.nowUtcMs - anchorMs < milestone.minElapsedMs) {
      continue;
    }
    eventsToTrack.push(milestone.id);
    newlyEmittedIds.push(milestone.id);
  }

  if (
    input.standalonePwa &&
    !input.emittedMilestoneIds.has(LAUNCHED_AS_PWA_MILESTONE_ID)
  ) {
    eventsToTrack.push(LAUNCHED_AS_PWA_MILESTONE_ID);
    newlyEmittedIds.push(LAUNCHED_AS_PWA_MILESTONE_ID);
  }

  return { eventsToTrack, newlyEmittedIds };
}

export function isStandaloneDisplayMode(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  try {
    return window.matchMedia('(display-mode: standalone)').matches;
  } catch {
    return false;
  }
}
