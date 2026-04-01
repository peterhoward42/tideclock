import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { subscribeSemanticMinuteCadence } from './semanticMinuteCadence';

describe('subscribeSemanticMinuteCadence', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('fires immediately with current minute epoch by default', () => {
    const t0 = 1_700_000_000_000; // arbitrary fixed instant
    vi.setSystemTime(t0);
    const ticks: number[] = [];
    subscribeSemanticMinuteCadence((e) => ticks.push(e), { now: () => t0 });
    expect(ticks).toEqual([Math.floor(t0 / 60_000)]);
  });

  it('skips immediate fire when fireImmediately is false', () => {
    const t0 = 1_700_000_000_000;
    vi.setSystemTime(t0);
    const ticks: number[] = [];
    subscribeSemanticMinuteCadence((e) => ticks.push(e), { now: () => Date.now(), fireImmediately: false });
    expect(ticks).toEqual([]);
  });

  it('fires on the next minute boundary then each minute', () => {
    const start = new Date('2026-04-01T12:00:30.000Z').getTime();
    vi.setSystemTime(start);
    const ticks: number[] = [];
    const unsub = subscribeSemanticMinuteCadence((e) => ticks.push(e), { fireImmediately: true });

    const epochAtStart = Math.floor(start / 60_000);
    expect(ticks).toEqual([epochAtStart]);

    vi.advanceTimersByTime(29_999);
    expect(ticks).toEqual([epochAtStart]);

    vi.advanceTimersByTime(2);
    expect(ticks).toEqual([epochAtStart, epochAtStart + 1]);

    vi.advanceTimersByTime(60_000);
    expect(ticks).toEqual([epochAtStart, epochAtStart + 1, epochAtStart + 2]);

    unsub();
  });

  it('unsubscribe clears pending timeout and interval', () => {
    const start = new Date('2026-04-01T12:00:10.000Z').getTime();
    vi.setSystemTime(start);
    const ticks: number[] = [];
    const unsub = subscribeSemanticMinuteCadence((e) => ticks.push(e), { fireImmediately: false });

    unsub();
    vi.advanceTimersByTime(120_000);
    expect(ticks).toEqual([]);
  });
});
