import { describe, expect, it } from 'vitest';
import { TideExtreme } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import {
  TideClockCivilDayDisplayWindow,
  type TimeNowProvider
} from '../time-services/TideClockCivilDayDisplayWindow';
import {
  extremesForCivilDayInWindow,
  extremesForCurrentCivilDay,
  loadExtremesForCurrentCivilDay
} from './civilDayExtremes';
import { EXTREMES_SNAPSHOT_KEY, type ExtremesLoader } from './extremesSnapshot';

class FakeTimeNowProvider implements TimeNowProvider {
  private readonly fixedNow: Date;

  constructor(fixedNow: Date) {
    this.fixedNow = fixedNow;
  }

  now(): Date {
    return new Date(this.fixedNow.getTime());
  }
}

function utcIsoForLocal(year: number, monthIndex: number, day: number, hour: number, minute: number): string {
  return new Date(year, monthIndex, day, hour, minute, 0, 0).toISOString();
}

class FakeExtremesLoader implements ExtremesLoader {
  private readonly byKey: Record<string, string | null>;

  constructor(byKey: Record<string, string | null>) {
    this.byKey = byKey;
  }

  getItem(key: string): string | null {
    return this.byKey[key] ?? null;
  }
}

describe('extremesForCurrentCivilDay', () => {
  const nowProvider = new FakeTimeNowProvider(new Date(2026, 2, 23, 10, 30, 0, 0));

  it('returns undefined when stored location does not match required location', () => {
    const stored = TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
      new TideExtreme('high', utcIsoForLocal(2026, 2, 22, 23, 30), 3.1),
      new TideExtreme('low', utcIsoForLocal(2026, 2, 23, 2, 30), 0.5),
      new TideExtreme('high', utcIsoForLocal(2026, 2, 24, 0, 15), 3.2)
    ]);

    const result = extremesForCurrentCivilDay({
      requiredLatitude: 51.0,
      requiredLongitude: -1.1,
      stored,
      timeNowProvider: nowProvider
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined when there is no extreme before window start', () => {
    const stored = TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
      new TideExtreme('low', utcIsoForLocal(2026, 2, 23, 1, 15), 0.4),
      new TideExtreme('high', utcIsoForLocal(2026, 2, 23, 14, 20), 3.3),
      new TideExtreme('low', utcIsoForLocal(2026, 2, 24, 1, 10), 0.6)
    ]);

    const result = extremesForCurrentCivilDay({
      requiredLatitude: 50.8,
      requiredLongitude: -1.1,
      stored,
      timeNowProvider: nowProvider
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined when there is no extreme after window end', () => {
    const stored = TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
      new TideExtreme('high', utcIsoForLocal(2026, 2, 22, 22, 50), 3.0),
      new TideExtreme('low', utcIsoForLocal(2026, 2, 23, 7, 30), 0.4),
      new TideExtreme('high', utcIsoForLocal(2026, 2, 23, 23, 50), 3.4)
    ]);

    const result = extremesForCurrentCivilDay({
      requiredLatitude: 50.8,
      requiredLongitude: -1.1,
      stored,
      timeNowProvider: nowProvider
    });

    expect(result).toBeUndefined();
  });

  it('returns only in-window extremes when stored data is adequate', () => {
    const beforeStart = new TideExtreme('high', utcIsoForLocal(2026, 2, 22, 23, 40), 3.1);
    const atStart = new TideExtreme('low', utcIsoForLocal(2026, 2, 23, 0, 0), 0.5);
    const midDay = new TideExtreme('high', utcIsoForLocal(2026, 2, 23, 12, 10), 3.3);
    const atEndExclusive = new TideExtreme('low', utcIsoForLocal(2026, 2, 24, 0, 0), 0.4);
    const afterEnd = new TideExtreme('high', utcIsoForLocal(2026, 2, 24, 0, 20), 3.0);

    const stored = TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
      beforeStart,
      atStart,
      midDay,
      atEndExclusive,
      afterEnd
    ]);

    const result = extremesForCurrentCivilDay({
      requiredLatitude: 50.8,
      requiredLongitude: -1.1,
      stored,
      timeNowProvider: nowProvider
    });

    expect(result).toEqual(
      TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
        atStart,
        midDay
      ])
    );
  });

  it('matches explicit civil-day window when passed to extremesForCivilDayInWindow', () => {
    const civilDay = new TideClockCivilDayDisplayWindow(
      new Date(2026, 2, 23, 0, 0, 0, 0),
      new Date(2026, 2, 24, 0, 0, 0, 0)
    );
    const beforeStart = new TideExtreme('high', utcIsoForLocal(2026, 2, 22, 23, 40), 3.1);
    const atStart = new TideExtreme('low', utcIsoForLocal(2026, 2, 23, 0, 0), 0.5);
    const midDay = new TideExtreme('high', utcIsoForLocal(2026, 2, 23, 12, 10), 3.3);
    const afterEnd = new TideExtreme('high', utcIsoForLocal(2026, 2, 24, 0, 20), 3.0);

    const stored = TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [beforeStart, atStart, midDay, afterEnd]);

    const result = extremesForCivilDayInWindow({
      requiredLatitude: 50.8,
      requiredLongitude: -1.1,
      stored,
      civilDayDisplayWindow: civilDay
    });

    expect(result).toEqual(TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [atStart, midDay]));
  });
});

describe('loadExtremesForCurrentCivilDay', () => {
  const nowProvider = new FakeTimeNowProvider(new Date(2026, 2, 23, 10, 30, 0, 0));

  it('returns undefined when there is no stored snapshot', () => {
    const loader = new FakeExtremesLoader({
      [EXTREMES_SNAPSHOT_KEY]: null
    });

    const result = loadExtremesForCurrentCivilDay({
      requiredLatitude: 50.8,
      requiredLongitude: -1.1,
      loader,
      storageKey: EXTREMES_SNAPSHOT_KEY,
      timeNowProvider: nowProvider
    });

    expect(result).toBeUndefined();
  });

  it('returns undefined when stored snapshot is malformed JSON', () => {
    const loader = new FakeExtremesLoader({
      [EXTREMES_SNAPSHOT_KEY]: '{this is not json'
    });

    const result = loadExtremesForCurrentCivilDay({
      requiredLatitude: 50.8,
      requiredLongitude: -1.1,
      loader,
      storageKey: EXTREMES_SNAPSHOT_KEY,
      timeNowProvider: nowProvider
    });

    expect(result).toBeUndefined();
  });

  it('loads, validates adequacy, and returns in-window extremes', () => {
    const loader = new FakeExtremesLoader({
      [EXTREMES_SNAPSHOT_KEY]: JSON.stringify({
        latitude: 50.8,
        longitude: -1.1,
        extremes: [
          { type: 'high', timeUtc: utcIsoForLocal(2026, 2, 22, 23, 40), heightMetres: 3.1 },
          { type: 'low', timeUtc: utcIsoForLocal(2026, 2, 23, 0, 0), heightMetres: 0.5 },
          { type: 'high', timeUtc: utcIsoForLocal(2026, 2, 23, 12, 10), heightMetres: 3.3 },
          { type: 'high', timeUtc: utcIsoForLocal(2026, 2, 24, 0, 20), heightMetres: 3.0 }
        ]
      })
    });

    const result = loadExtremesForCurrentCivilDay({
      requiredLatitude: 50.8,
      requiredLongitude: -1.1,
      loader,
      storageKey: EXTREMES_SNAPSHOT_KEY,
      timeNowProvider: nowProvider
    });

    expect(result).toEqual(
      TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
        new TideExtreme('low', utcIsoForLocal(2026, 2, 23, 0, 0), 0.5),
        new TideExtreme('high', utcIsoForLocal(2026, 2, 23, 12, 10), 3.3)
      ])
    );
  });
});
