/**
 * isAtypicalTideExtremaPattern.ts — Conservative detector for civil-day extrema that
 * do not fit the usual simple "two highs, two lows, clear alternation" story.
 * Kind: Pure logic service over ordered tide extrema. Does not know about UI copy.
 */
import type { TimedTideExtreme } from '../core-models/TideExtreme';
import type { TimeOrderedTideExtrema } from '../core-models/TimeOrderedTideExtrema';

function hoursToMilliseconds(hours: number): number {
  return hours * 60 * 60 * 1000;
}

export enum TideExtremaPatternDetection {
  IsTypical = 'isTypical',
  MoreThanFourExtrema = 'moreThanFourExtrema',
  NonAlternatingAdjacentTypes = 'nonAlternatingAdjacentTypes',
  TightlyBunchedAdjacentExtrema = 'tightlyBunchedAdjacentExtrema',
  WeakHesitationSwing = 'weakHesitationSwing'
}

/**
 * Below roughly three hours, adjacent extrema are visually bunched rather than reading
 * like separate phases of a normal tide day.
 */
const MIN_TYPICAL_EXTREMA_GAP_HOURS = 3;

/**
 * When the middle swing in a same-type triplet is much smaller than its neighbours,
 * people tend to perceive a hesitation or double-top/double-bottom rather than a clean
 * alternating cycle. This is intentionally conservative.
 */
const WEAK_SWING_RATIO_THRESHOLD = 0.2;

/**
 * The hesitation rule is only intended for tightly grouped same-type triplets such as
 * Bournemouth-style double highs. Wider spacing can still be a normal pair of tides.
 */
const MAX_HESITATION_SPAN_HOURS = 8;

function toTimedExtremes(extremes: TimeOrderedTideExtrema): TimedTideExtreme[] {
  return extremes.map((extreme, index) => {
    const timeMs = Date.parse(extreme.timeUtc);
    if (Number.isNaN(timeMs)) {
      throw new Error(`isAtypicalTideExtremaPattern: extremes[${index}] has invalid timeUtc`);
    }
    return {
      type: extreme.type,
      timeMs,
      heightMetres: extreme.heightMetres
    };
  });
}

function hasNonAlternatingAdjacentTypes(extremes: readonly TimedTideExtreme[]): boolean {
  for (let i = 1; i < extremes.length; i += 1) {
    if (extremes[i - 1].type === extremes[i].type) {
      return true;
    }
  }
  return false;
}

function hasTightlyBunchedExtrema(extremes: readonly TimedTideExtreme[]): boolean {
  for (let i = 1; i < extremes.length; i += 1) {
    const gapMs = extremes[i].timeMs - extremes[i - 1].timeMs;
    if (gapMs < hoursToMilliseconds(MIN_TYPICAL_EXTREMA_GAP_HOURS)) {
      return true;
    }
  }
  return false;
}

function hasWeakHesitationSwing(extremes: readonly TimedTideExtreme[]): boolean {
  for (let i = 0; i <= extremes.length - 3; i += 1) {
    const first = extremes[i];
    const middle = extremes[i + 1];
    const third = extremes[i + 2];

    if (first.type !== third.type || first.type === middle.type) {
      continue;
    }

    const tripletSpanMs = third.timeMs - first.timeMs;
    if (tripletSpanMs > hoursToMilliseconds(MAX_HESITATION_SPAN_HOURS)) {
      continue;
    }

    const firstSwing = Math.abs(first.heightMetres - middle.heightMetres);
    const secondSwing = Math.abs(third.heightMetres - middle.heightMetres);
    const strongerSwing = Math.max(firstSwing, secondSwing);
    const weakerSwing = Math.min(firstSwing, secondSwing);

    if (strongerSwing === 0) {
      return true;
    }

    if (weakerSwing / strongerSwing <= WEAK_SWING_RATIO_THRESHOLD) {
      return true;
    }
  }
  return false;
}

/**
 * Returns the first rule that fires while scanning from "ordinary enough" toward
 * "visually odd to a person". `IsTypical` means no atypical rule fired.
 *
 * The policy intentionally prefers a few safe false positives over confidently telling
 * a simple story on days whose plotted extrema look visually odd.
 */
export function isAtypicalTideExtremaPattern(
  extremes: TimeOrderedTideExtrema,
): TideExtremaPatternDetection {
  if (extremes.length <= 1) {
    return TideExtremaPatternDetection.IsTypical;
  }

  const timedExtremes = toTimedExtremes(extremes);

  if (timedExtremes.length > 4) {
    return TideExtremaPatternDetection.MoreThanFourExtrema;
  }

  if (hasNonAlternatingAdjacentTypes(timedExtremes)) {
    return TideExtremaPatternDetection.NonAlternatingAdjacentTypes;
  }

  if (hasTightlyBunchedExtrema(timedExtremes)) {
    return TideExtremaPatternDetection.TightlyBunchedAdjacentExtrema;
  }

  if (hasWeakHesitationSwing(timedExtremes)) {
    return TideExtremaPatternDetection.WeakHesitationSwing;
  }

  return TideExtremaPatternDetection.IsTypical;
}
