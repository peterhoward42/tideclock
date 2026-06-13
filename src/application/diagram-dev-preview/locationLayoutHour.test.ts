import { describe, expect, it } from 'vitest';
import { TideExtreme } from '../../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../../core-models/TideExtremesAtLocation';
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
