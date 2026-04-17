import { describe, expect, it } from 'vitest';
import { TideExtreme } from './TideExtreme';
import { requireTimeOrderedTideExtrema, toTimeOrderedTideExtrema } from './TimeOrderedTideExtrema';

describe('toTimeOrderedTideExtrema', () => {
  it('sorts unsorted rows into strictly ascending UTC order', () => {
    const ordered = toTimeOrderedTideExtrema([
      new TideExtreme('high', '2026-03-23T10:45:00.000Z', 4.7),
      new TideExtreme('low', '2026-03-23T04:15:00.000Z', 0.94),
      new TideExtreme('low', '2026-03-23T16:59:24.000Z', 0.89),
    ]);

    expect(ordered.map((e) => e.timeUtc)).toEqual([
      '2026-03-23T04:15:00.000Z',
      '2026-03-23T10:45:00.000Z',
      '2026-03-23T16:59:24.000Z',
    ]);
  });

  it('rejects duplicate UTC instants', () => {
    expect(() =>
      toTimeOrderedTideExtrema([
        new TideExtreme('high', '2026-03-23T10:45:00.000Z', 4.7),
        new TideExtreme('low', '2026-03-23T10:45:00.000Z', 0.94),
      ]),
    ).toThrow(/duplicate extreme timeUtc/);
  });
});

describe('requireTimeOrderedTideExtrema', () => {
  it('throws when rows are not strictly ascending', () => {
    expect(() =>
      requireTimeOrderedTideExtrema([
        new TideExtreme('high', '2026-03-23T10:45:00.000Z', 4.7),
        new TideExtreme('low', '2026-03-23T04:15:00.000Z', 0.94),
      ]),
    ).toThrow(/strictly ascending time order/);
  });
});
