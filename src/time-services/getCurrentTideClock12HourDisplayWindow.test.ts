import { describe, expect, it } from 'vitest';
import { getCurrentTideClock12HourDisplayWindow } from './getCurrentTideClock12HourDisplayWindow';
import type { TimeNowProvider } from './TideClock12HourDisplayWindow';

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

describe('getCurrentTideClock12HourDisplayWindow', () => {
  // These tests use Date(y, m, d, h, ...) local constructors on purpose, matching production logic.
  // Equality checks compare absolute instants, so local fields are converted through the current
  // runtime timezone/DST regime in both arrange and assert paths.
  it('returns 00:00 to 12:00 local window for a morning time', () => {
    const nowProvider = new FakeTimeNowProvider(new Date(2026, 2, 23, 9, 15, 0, 0));

    const result = getCurrentTideClock12HourDisplayWindow(nowProvider);

    expect(result.startLocal).toEqual(new Date(2026, 2, 23, 0, 0, 0, 0));
    expect(result.endLocalExclusive).toEqual(new Date(2026, 2, 23, 12, 0, 0, 0));
  });

  it('returns 12:00 to 00:00 next day local window for an afternoon time', () => {
    const nowProvider = new FakeTimeNowProvider(new Date(2026, 2, 23, 16, 45, 0, 0));

    const result = getCurrentTideClock12HourDisplayWindow(nowProvider);

    expect(result.startLocal).toEqual(new Date(2026, 2, 23, 12, 0, 0, 0));
    expect(result.endLocalExclusive).toEqual(new Date(2026, 2, 24, 0, 0, 0, 0));
  });

  it('uses the afternoon window at exactly 12:00 local', () => {
    const nowProvider = new FakeTimeNowProvider(new Date(2026, 2, 23, 12, 0, 0, 0));

    const result = getCurrentTideClock12HourDisplayWindow(nowProvider);

    expect(result.startLocal).toEqual(new Date(2026, 2, 23, 12, 0, 0, 0));
    expect(result.endLocalExclusive).toEqual(new Date(2026, 2, 24, 0, 0, 0, 0));
  });

  it('uses the morning window at exactly 00:00 local', () => {
    const nowProvider = new FakeTimeNowProvider(new Date(2026, 2, 23, 0, 0, 0, 0));

    const result = getCurrentTideClock12HourDisplayWindow(nowProvider);

    expect(result.startLocal).toEqual(new Date(2026, 2, 23, 0, 0, 0, 0));
    expect(result.endLocalExclusive).toEqual(new Date(2026, 2, 23, 12, 0, 0, 0));
  });
});
