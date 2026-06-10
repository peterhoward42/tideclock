import { describe, expect, it } from 'vitest';
import { TideExtreme } from '../../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../../core-models/TideExtremesAtLocation';
import {
  buildDiagramSpec,
  FIXTURE_SHARE_URL,
  utcIsoToLocalCanonicalTimeUtc,
} from '../buildDiagramSpec';
import { buildNoMoreTidesTodayClock } from './noMoreTidesToday';
import { deriveNextTideSemantics } from '../nextTideSemantics';

describe('buildNoMoreTidesTodayClock', () => {
  it('returns a clock after the last marker so deriveNextTideSemantics has no next tide', () => {
    const extremes = TideExtremesAtLocation.fromPossiblyUnordered(50, -1, [
      new TideExtreme('low', '2025-06-01T10:00:00.000Z', 1),
      new TideExtreme('high', '2025-06-01T22:00:00.000Z', 5),
    ]);
    const preview = buildNoMoreTidesTodayClock({
      extremesAtLocation: extremes,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
    });
    expect(preview.kind).toBe('active');
    if (preview.kind !== 'active') return;

    const spec = buildDiagramSpec({
      extremesAtLocation: extremes,
      timeNow: preview.timeNow,
      brhcDatePrefix: preview.brhcDatePrefix,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Test',
      shareUrl: FIXTURE_SHARE_URL,
    });
    expect(deriveNextTideSemantics(spec).nextTide).toBeNull();
  });

  it('returns inactive when the last marker leaves no civil-day instant after it', () => {
    const extremes = TideExtremesAtLocation.fromPossiblyUnordered(50, -1, [
      new TideExtreme('high', '2025-06-01T23:59:59.000Z', 5),
    ]);
    const preview = buildNoMoreTidesTodayClock({
      extremesAtLocation: extremes,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
    });
    expect(preview).toEqual({
      kind: 'inactive',
      reason: 'last-marker-at-end-of-civil-day',
    });
  });
});
