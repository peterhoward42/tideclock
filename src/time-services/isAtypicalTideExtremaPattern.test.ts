import { describe, expect, it } from 'vitest';
import { TideExtreme, type TideExtremeType } from '../core-models/TideExtreme';
import { toTimeOrderedTideExtrema } from '../core-models/TimeOrderedTideExtrema';
import {
  isAtypicalTideExtremaPattern,
  TideExtremaPatternDetection
} from './isAtypicalTideExtremaPattern';

function utcIsoForLocal(year: number, monthIndex: number, day: number, hour: number, minute: number): string {
  return new Date(year, monthIndex, day, hour, minute, 0, 0).toISOString();
}

function fixtureExtreme(
  type: TideExtremeType,
  hour: number,
  minute: number,
  heightMetres: number,
): TideExtreme {
  return new TideExtreme(type, utcIsoForLocal(2026, 2, 23, hour, minute), heightMetres);
}

describe('isAtypicalTideExtremaPattern', () => {
  it('returns IsTypical for a clear four-extrema alternating day', () => {
    // Behavioural requirement: a visually ordinary day should remain in the simple
    // story mode rather than falling back merely because tides are not perfectly uniform.
    const extrema = [
      fixtureExtreme('low', 0, 40, 0.7),
      fixtureExtreme('high', 6, 50, 4.5),
      fixtureExtreme('low', 13, 10, 0.9),
      fixtureExtreme('high', 19, 20, 4.4)
    ];

    expect(isAtypicalTideExtremaPattern(extrema)).toBe(TideExtremaPatternDetection.IsTypical);
  });

  it('returns MoreThanFourExtrema when the civil day contains more than four extrema', () => {
    // Behavioural requirement: once the day shows extra extrema, the detector should
    // choose the cautious human-facing fallback without needing a more elaborate theory.
    const extrema = [
      fixtureExtreme('low', 0, 30, 0.8),
      fixtureExtreme('high', 5, 40, 4.3),
      fixtureExtreme('low', 9, 10, 3.9),
      fixtureExtreme('high', 11, 0, 4.4),
      fixtureExtreme('low', 17, 20, 0.7)
    ];

    expect(isAtypicalTideExtremaPattern(extrema)).toBe(
      TideExtremaPatternDetection.MoreThanFourExtrema
    );
  });

  it('returns NonAlternatingAdjacentTypes when adjacent extrema do not alternate high and low', () => {
    // Behavioural requirement: if the labels themselves stop reading as a simple
    // alternation, the app should not assert a clean "coming in / going out" story.
    const extrema = [
      fixtureExtreme('low', 1, 0, 0.7),
      fixtureExtreme('high', 7, 0, 4.6),
      fixtureExtreme('high', 11, 30, 4.4),
      fixtureExtreme('low', 18, 10, 0.8)
    ];

    expect(isAtypicalTideExtremaPattern(extrema)).toBe(
      TideExtremaPatternDetection.NonAlternatingAdjacentTypes
    );
  });

  it('returns TightlyBunchedAdjacentExtrema when adjacent extrema are bunched unusually close together', () => {
    // Behavioural requirement: very short gaps feel visually odd to a person even if
    // the labels still alternate, so the detector should prefer the safer fallback.
    const extrema = [
      fixtureExtreme('low', 0, 30, 0.9),
      fixtureExtreme('high', 6, 0, 4.5),
      fixtureExtreme('low', 8, 0, 1.1),
      fixtureExtreme('high', 14, 40, 4.4)
    ];

    expect(isAtypicalTideExtremaPattern(extrema)).toBe(
      TideExtremaPatternDetection.TightlyBunchedAdjacentExtrema
    );
  });

  it('returns WeakHesitationSwing for a tightly grouped weak swing between two same-type extrema', () => {
    // Behavioural requirement: a shallow middle dip between two nearby highs should
    // read as a double-high hesitation, not as a confidently normal alternating cycle.
    const extrema = [
      fixtureExtreme('low', 0, 20, 0.8),
      fixtureExtreme('high', 6, 0, 4.9),
      fixtureExtreme('low', 9, 30, 4.85),
      fixtureExtreme('high', 13, 30, 5.2)
    ];

    expect(isAtypicalTideExtremaPattern(extrema)).toBe(
      TideExtremaPatternDetection.WeakHesitationSwing
    );
  });

  it('returns IsTypical for three visible extrema when a likely bookend event has slipped just outside the civil day', () => {
    // Interpretative clarification rather than strictly necessary coverage: this test
    // records the policy that a day can look humanly typical even when the civil-day
    // slice misses one bookend event by a whisker.
    const extrema = [
      fixtureExtreme('low', 1, 10, 0.8),
      fixtureExtreme('high', 7, 20, 4.6),
      fixtureExtreme('low', 13, 40, 0.9)
    ];

    expect(isAtypicalTideExtremaPattern(extrema)).toBe(TideExtremaPatternDetection.IsTypical);
  });

  it('returns IsTypical for a Portsmouth-style low-high-low afternoon story', () => {
    // Interpretative clarification rather than strictly necessary coverage: the known
    // location may produce atypical days, but this particular three-event shape still
    // reads as an ordinary falling-tide story to a human viewer.
    const extrema = [
      fixtureExtreme('low', 4, 37, 1.09),
      fixtureExtreme('high', 11, 39, 4.46),
      fixtureExtreme('low', 16, 55, 0.02)
    ];

    expect(isAtypicalTideExtremaPattern(extrema)).toBe(TideExtremaPatternDetection.IsTypical);
  });

  it('returns IsTypical for sparse input that does not yet look visually odd', () => {
    // Behavioural requirement: missing data should not be treated as suspicious on its
    // own; atypical mode is for odd-looking patterns, not merely incomplete ones.
    const extrema = [
      fixtureExtreme('low', 4, 0, 0.8),
      fixtureExtreme('high', 10, 20, 4.6),
      fixtureExtreme('low', 16, 50, 0.9)
    ];

    expect(isAtypicalTideExtremaPattern(extrema)).toBe(TideExtremaPatternDetection.IsTypical);
  });

  it('returns the first atypical rule when multiple rules could match', () => {
    // Behavioural requirement: tests should rely on the declared precedence order,
    // not just on whether the final answer is "some kind of atypical".
    const extrema = [
      fixtureExtreme('low', 0, 30, 0.9),
      fixtureExtreme('high', 6, 0, 4.9),
      fixtureExtreme('low', 8, 50, 4.6),
      fixtureExtreme('high', 11, 30, 5.0),
      fixtureExtreme('low', 18, 10, 0.7)
    ];

    expect(isAtypicalTideExtremaPattern(extrema)).toBe(
      TideExtremaPatternDetection.MoreThanFourExtrema
    );
  });

  it('can consume constructor-normalized ordering from unsorted extrema input', () => {
    const extrema = [
      fixtureExtreme('low', 6, 0, 0.8),
      fixtureExtreme('high', 4, 0, 4.6)
    ];

    const ordered = toTimeOrderedTideExtrema(extrema);
    expect(isAtypicalTideExtremaPattern(ordered)).toBe(
      TideExtremaPatternDetection.TightlyBunchedAdjacentExtrema
    );
  });
});
