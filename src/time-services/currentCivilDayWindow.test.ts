import { describe, expect, it } from 'vitest';
import {
  civilDayWindowFromHostClock,
  getCurrentCivilDayWindow,
} from './currentCivilDayWindow';
import type { TimeNowProvider } from './civilDayWindow';

class FakeTimeNowProvider implements TimeNowProvider {
  private readonly fixedNow: Date;

  constructor(fixedNow: Date) {
    this.fixedNow = fixedNow;
  }

  now(): Date {
    // Return a clone so tests cannot mutate shared state between assertions.
    return new Date(this.fixedNow.getTime());
  }
}

describe('getCurrentCivilDayWindow', () => {
  // These tests use Date(y, m, d, h, ...) local constructors on purpose, matching
  // production logic. Equality checks compare absolute instants.
  it('returns today midnight to tomorrow midnight for a morning time', () => {
    const nowProvider = new FakeTimeNowProvider(new Date(2026, 2, 23, 9, 15, 0, 0));

    const result = getCurrentCivilDayWindow(nowProvider);

    expect(result.startLocal).toEqual(new Date(2026, 2, 23, 0, 0, 0, 0));
    expect(result.endLocalExclusive).toEqual(new Date(2026, 2, 24, 0, 0, 0, 0));
  });

  it('returns today midnight to tomorrow midnight for an afternoon time', () => {
    const nowProvider = new FakeTimeNowProvider(new Date(2026, 2, 23, 16, 45, 0, 0));

    const result = getCurrentCivilDayWindow(nowProvider);

    expect(result.startLocal).toEqual(new Date(2026, 2, 23, 0, 0, 0, 0));
    expect(result.endLocalExclusive).toEqual(new Date(2026, 2, 24, 0, 0, 0, 0));
  });

  it('returns today midnight to tomorrow midnight at exactly midnight', () => {
    const nowProvider = new FakeTimeNowProvider(new Date(2026, 2, 23, 0, 0, 0, 0));

    const result = getCurrentCivilDayWindow(nowProvider);

    expect(result.startLocal).toEqual(new Date(2026, 2, 23, 0, 0, 0, 0));
    expect(result.endLocalExclusive).toEqual(new Date(2026, 2, 24, 0, 0, 0, 0));
  });

  it('returns today midnight to tomorrow midnight at exactly 23:59', () => {
    const nowProvider = new FakeTimeNowProvider(new Date(2026, 2, 23, 23, 59, 0, 0));

    const result = getCurrentCivilDayWindow(nowProvider);

    expect(result.startLocal).toEqual(new Date(2026, 2, 23, 0, 0, 0, 0));
    expect(result.endLocalExclusive).toEqual(new Date(2026, 2, 24, 0, 0, 0, 0));
  });
});

describe('civilDayWindowFromHostClock', () => {
  it('returns a half-open window spanning the host local calendar day', () => {
    const result = civilDayWindowFromHostClock();
    const now = new Date();
    const expectedStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );
    const expectedEnd = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      0,
      0,
      0,
      0,
    );
    expect(result.startLocal).toEqual(expectedStart);
    expect(result.endLocalExclusive).toEqual(expectedEnd);
    expect(now.getTime()).toBeGreaterThanOrEqual(result.startLocal.getTime());
    expect(now.getTime()).toBeLessThan(result.endLocalExclusive.getTime());
  });
});
