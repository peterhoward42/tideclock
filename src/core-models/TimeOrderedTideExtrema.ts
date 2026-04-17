/**
 * TimeOrderedTideExtrema.ts — Canonical collection type for tide extremes ordered by UTC time.
 * Kind: Definition + constructor gate.
 */

import { TideExtreme } from './TideExtreme';

declare const timeOrderedTideExtremaBrand: unique symbol;

/**
 * Domain collection invariant: rows are strictly ascending by parsed `timeUtc`.
 * This type should be produced only through constructor helpers in this module.
 */
export type TimeOrderedTideExtrema = readonly TideExtreme[] & {
  readonly [timeOrderedTideExtremaBrand]: 'TimeOrderedTideExtrema';
};

function parseExtremeTimeOrThrow(extreme: TideExtreme, index: number, context: string): number {
  const parsed = Date.parse(extreme.timeUtc);
  if (Number.isNaN(parsed)) {
    throw new Error(`${context}: extremes[${index}] has invalid timeUtc "${extreme.timeUtc}"`);
  }
  return parsed;
}

/**
 * Canonical constructor for domain-level extrema collections.
 * Accepts unsorted rows, validates timestamps, sorts ascending, and rejects duplicate instants.
 */
export function toTimeOrderedTideExtrema(extremes: readonly TideExtreme[]): TimeOrderedTideExtrema {
  const withTime = extremes.map((extreme, index) => ({
    extreme,
    timeMs: parseExtremeTimeOrThrow(extreme, index, 'toTimeOrderedTideExtrema')
  }));
  withTime.sort((a, b) => a.timeMs - b.timeMs);
  for (let i = 1; i < withTime.length; i += 1) {
    if (withTime[i].timeMs === withTime[i - 1].timeMs) {
      throw new Error(
        `toTimeOrderedTideExtrema: duplicate extreme timeUtc "${withTime[i].extreme.timeUtc}"`,
      );
    }
  }
  return withTime.map(({ extreme }) => extreme) as TimeOrderedTideExtrema;
}

/**
 * Strict constructor for call sites that claim input is already ordered.
 * Throws if order is not strictly ascending or if any timestamp is invalid.
 */
export function requireTimeOrderedTideExtrema(
  extremes: readonly TideExtreme[],
  context = 'requireTimeOrderedTideExtrema',
): TimeOrderedTideExtrema {
  const result: TideExtreme[] = [];
  let previousTimeMs: number | undefined;
  for (let i = 0; i < extremes.length; i += 1) {
    const extreme = extremes[i];
    const timeMs = parseExtremeTimeOrThrow(extreme, i, context);
    if (previousTimeMs !== undefined && timeMs <= previousTimeMs) {
      throw new Error(`${context}: extremes must be in strictly ascending time order`);
    }
    previousTimeMs = timeMs;
    result.push(extreme);
  }
  return result as TimeOrderedTideExtrema;
}
