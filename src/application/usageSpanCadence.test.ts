import { describe, expect, it } from 'vitest';

import {
  ensureFirstVisitAnchor,
  evaluateUsageSpanMilestones,
} from './usageSpanCadence';

const MS_DAY = 86_400_000;
const ANCHOR_MS = 1_000_000;

describe('ensureFirstVisitAnchor', () => {
  it('Given no prior anchor When seeding Then uses now and marks seeded', () => {
    const result = ensureFirstVisitAnchor(ANCHOR_MS + 5, undefined);

    expect(result).toEqual({ firstVisitUtcMs: ANCHOR_MS + 5, seeded: true });
  });

  it('Given an existing anchor When seeding Then preserves it', () => {
    const result = ensureFirstVisitAnchor(ANCHOR_MS + 99, ANCHOR_MS);

    expect(result).toEqual({ firstVisitUtcMs: ANCHOR_MS, seeded: false });
  });
});

describe('evaluateUsageSpanMilestones', () => {
  it('Given week-one elapsed on visit anchor When ticking Then emits v_w1 only once', () => {
    const emitted = new Set<string>();
    const input = {
      nowUtcMs: ANCHOR_MS + 7 * MS_DAY,
      firstVisitUtcMs: ANCHOR_MS,
      firstCustomLocUtcMs: undefined,
      emittedMilestoneIds: emitted,
      standalonePwa: false,
    };

    const first = evaluateUsageSpanMilestones(input);
    const second = evaluateUsageSpanMilestones({
      ...input,
      emittedMilestoneIds: new Set([...emitted, ...first.newlyEmittedIds]),
    });

    expect(first.eventsToTrack).toEqual(['v_w1']);
    expect(first.newlyEmittedIds).toEqual(['v_w1']);
    expect(second.eventsToTrack).toEqual([]);
  });

  it('Given month-three elapsed on custom anchor When ticking Then emits c_m3 not day-bucket ids', () => {
    const customAnchorMs = ANCHOR_MS + 100;
    const result = evaluateUsageSpanMilestones({
      nowUtcMs: customAnchorMs + 90 * MS_DAY,
      firstVisitUtcMs: ANCHOR_MS,
      firstCustomLocUtcMs: customAnchorMs,
      emittedMilestoneIds: new Set([
        'v_w1',
        'v_w2',
        'v_w3',
        'v_m1',
        'v_m2',
        'v_m3',
        'c_w1',
        'c_w2',
        'c_w3',
        'c_m1',
        'c_m2',
      ]),
      standalonePwa: false,
    });

    expect(result.eventsToTrack).toEqual(['c_m3']);
    expect(result.newlyEmittedIds).toEqual(['c_m3']);
  });

  it('Given standalone display and no prior PWA milestone When ticking Then emits launched_as_pwa', () => {
    const result = evaluateUsageSpanMilestones({
      nowUtcMs: ANCHOR_MS,
      firstVisitUtcMs: ANCHOR_MS,
      firstCustomLocUtcMs: undefined,
      emittedMilestoneIds: new Set<string>(),
      standalonePwa: true,
    });

    expect(result.eventsToTrack).toContain('launched_as_pwa');
    expect(result.newlyEmittedIds).toContain('launched_as_pwa');
  });
});
