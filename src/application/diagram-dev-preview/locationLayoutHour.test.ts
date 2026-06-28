import { describe, expect, it } from 'vitest';
import { TideExtreme } from '../../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../../core-models/TideExtremesAtLocation';
import {
  buildDiagramSpecWithDerivedNextTide,
  FIXTURE_SHARE_URL,
  utcIsoToLocalCanonicalTimeUtc,
} from '../buildDiagramSpec';
import { localBrhcDatePrefix, localCanonicalTimeNow } from '../localTimeStrings';
import { createDiagramCollaborator, renderSceneSvg } from '../diagramCollaborator';
import { loadStyleModel } from '../../diagram-generation/index.mjs';
import { homeStyleModel } from '../../diagram-config';
import { buildLocationLayoutHourClock } from './locationLayoutHour';

function fixtureExtremes(): TideExtremesAtLocation {
  return TideExtremesAtLocation.fromPossiblyUnordered(50, -1, [
    new TideExtreme('low', '2025-06-01T10:00:00.000Z', 1),
    new TideExtreme('high', '2025-06-01T22:00:00.000Z', 5),
  ]);
}

describe('buildLocationLayoutHourClock', () => {
  it('freezes timeNow at the requested whole hour', () => {
    const clock = buildLocationLayoutHourClock({
      hour: 10,
      extremesAtLocation: fixtureExtremes(),
    });
    expect(clock.kind).toBe('active');
    if (clock.kind !== 'active') return;
    expect(clock.timeNow).toBe('10:00:00');
    expect(clock.frozenEpochMs).toBeTypeOf('number');
    expect(clock.brhcDatePrefix).toMatch(/\S/);
  });

  it('supports late-evening hours', () => {
    const clock = buildLocationLayoutHourClock({
      hour: 23,
      extremesAtLocation: fixtureExtremes(),
    });
    expect(clock.kind).toBe('active');
    if (clock.kind !== 'active') return;
    expect(clock.timeNow).toBe('23:00:00');
  });

  it('timeNowHour preview path flips instrument icons across the dial like LocationLabel', () => {
    const extremesAtLocation = fixtureExtremes();
    const collaborator = createDiagramCollaborator();
    const styleRuntime = loadStyleModel(homeStyleModel);

    function bundleForPreviewHour(hour: number) {
      const clock = buildLocationLayoutHourClock({ hour, extremesAtLocation });
      expect(clock.kind).toBe('active');
      if (clock.kind !== 'active') {
        throw new Error('expected active clock');
      }
      const timeNow = localCanonicalTimeNow(clock.frozenEpochMs);
      expect(timeNow).toBe(clock.timeNow);
      const spec = buildDiagramSpecWithDerivedNextTide({
        extremesAtLocation,
        timeNow,
        brhcDatePrefix: localBrhcDatePrefix(clock.frozenEpochMs),
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
        townName: 'Lymington',
        shareUrl: FIXTURE_SHARE_URL,
      });
      return collaborator.generate(spec);
    }

    const morning = bundleForPreviewHour(1);
    const afternoon = bundleForPreviewHour(13);

    expect(morning.diagram.locationLabel[0].anchor.x).not.toBeCloseTo(
      afternoon.diagram.locationLabel[0].anchor.x,
      6,
    );
    expect(morning.diagram.fullScreenIcon.center.x).toBeGreaterThan(0);
    expect(afternoon.diagram.fullScreenIcon.center.x).toBeLessThan(0);
    expect(morning.diagram.fullScreenIcon.center.x).not.toBeCloseTo(
      afternoon.diagram.fullScreenIcon.center.x,
      6,
    );

    const morningSvg = renderSceneSvg(morning.scene, { styleRuntime });
    const afternoonSvg = renderSceneSvg(afternoon.scene, { styleRuntime });
    const morningHitFrame = morningSvg.match(
      /data-name="FullScreenIcon\.HitFrame"[\s\S]*?x="([^"]+)"/,
    );
    const afternoonHitFrame = afternoonSvg.match(
      /data-name="FullScreenIcon\.HitFrame"[\s\S]*?x="([^"]+)"/,
    );
    expect(morningHitFrame?.[1]).toBeDefined();
    expect(afternoonHitFrame?.[1]).toBeDefined();
    expect(morningHitFrame![1]).not.toBe(afternoonHitFrame![1]);
  });

  it('is inactive without extremes or for invalid hours', () => {
    expect(
      buildLocationLayoutHourClock({
        hour: 10,
        extremesAtLocation: TideExtremesAtLocation.fromPossiblyUnordered(50, -1, []),
      }),
    ).toEqual({ kind: 'inactive', reason: 'no-extremes' });
    expect(
      buildLocationLayoutHourClock({
        hour: 24,
        extremesAtLocation: fixtureExtremes(),
      }),
    ).toEqual({ kind: 'inactive', reason: 'invalid-hour' });
  });
});
