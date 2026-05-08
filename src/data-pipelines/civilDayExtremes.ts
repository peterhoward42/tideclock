/**
 * civilDayExtremes.ts — Slices stored extremes to the active local civil window with bookend validation.
 * Fed by snapshots and civil-day bounds; consumed by the tide query façade. Kind: Query / selector.
 * Does not perform HTTP.
 */

import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import {
  type CivilDayLocalInterval,
  type TimeNowProvider
} from '../time-services/civilDayWindow';
import { getCurrentCivilDayWindow } from '../time-services/currentCivilDayWindow';
import {
  deserializeExtremesSnapshot,
  type ExtremesLoader
} from './extremesSnapshot';

function civilDayExtremesDiag(...args: unknown[]): void {
  if (!import.meta.env.DEV || import.meta.env.MODE === 'test') {
    return;
  }
  console.log('[tideclock] civil-day-extremes:', ...args);
}

/** Coordinates, persisted snapshot, and the local civil-day window used to slice extremes. */
export interface CivilWindowExtremesParams {
  readonly requiredLatitude: number;
  readonly requiredLongitude: number;
  readonly stored: TideExtremesAtLocation;
  readonly civilDayDisplayWindow: CivilDayLocalInterval;
}

/** Same coordinates and snapshot as {@link extremesInCivilWindow}; window from `timeNowProvider`. */
export interface LiveCivilExtremesParams {
  readonly requiredLatitude: number;
  readonly requiredLongitude: number;
  readonly stored: TideExtremesAtLocation;
  readonly timeNowProvider: TimeNowProvider;
}

export interface LoadStoredExtremesParams {
  readonly requiredLatitude: number;
  readonly requiredLongitude: number;
  readonly loader: ExtremesLoader;
  readonly storageKey: string;
  readonly timeNowProvider: TimeNowProvider;
}

/**
 * Keeps extremes that fall in `[startLocal, endLocalExclusive)` and rejects the snapshot
 * unless bookending extremes exist strictly before start and at/after end (same rules as before).
 */
export function extremesInCivilWindow({
  requiredLatitude,
  requiredLongitude,
  stored,
  civilDayDisplayWindow
}: CivilWindowExtremesParams): TideExtremesAtLocation | undefined {
  if (stored.latitude !== requiredLatitude || stored.longitude !== requiredLongitude) {
    civilDayExtremesDiag('snapshot rejected — location mismatch', {
      requiredLatitude,
      requiredLongitude,
      storedLatitude: stored.latitude,
      storedLongitude: stored.longitude
    });
    return undefined;
  }

  const windowStartMs = civilDayDisplayWindow.startLocal.getTime();
  const windowEndExclusiveMs = civilDayDisplayWindow.endLocalExclusive.getTime();

  const extremesWithTime = stored.extremes.map((extreme) => ({
    extreme,
    timeMs: Date.parse(extreme.timeUtc)
  }));

  const hasExtremeBeforeWindowStart = extremesWithTime.some(({ timeMs }) => timeMs < windowStartMs);
  const hasExtremeAfterWindowEnd = extremesWithTime.some(({ timeMs }) => timeMs >= windowEndExclusiveMs);

  if (!hasExtremeBeforeWindowStart || !hasExtremeAfterWindowEnd) {
    const sorted = [...extremesWithTime].sort((a, b) => a.timeMs - b.timeMs);
    const rejectReason =
      !hasExtremeBeforeWindowStart && !hasExtremeAfterWindowEnd
        ? 'missing_before_and_after'
        : !hasExtremeBeforeWindowStart
          ? 'missing_before'
          : 'missing_after';
    civilDayExtremesDiag('snapshot rejected — bookends', {
      rejectReason,
      hasExtremeBeforeWindowStart,
      hasExtremeAfterWindowEnd,
      windowStartLocal: civilDayDisplayWindow.startLocal.toString(),
      windowEndExclusiveLocal: civilDayDisplayWindow.endLocalExclusive.toString(),
      windowStartMs: windowStartMs,
      windowEndExclusiveMs: windowEndExclusiveMs,
      extremeCount: stored.extremes.length,
      earliestExtremeTimeUtc: sorted[0]?.extreme.timeUtc,
      latestExtremeTimeUtc: sorted[sorted.length - 1]?.extreme.timeUtc
    });
    return undefined;
  }

  const inWindowExtremes = extremesWithTime
    .filter(({ timeMs }) => timeMs >= windowStartMs && timeMs < windowEndExclusiveMs)
    .map(({ extreme }) => extreme);

  return TideExtremesAtLocation.fromPossiblyUnordered(
    stored.latitude,
    stored.longitude,
    inWindowExtremes,
  );
}

export function extremesForCurrentCivilDay({
  requiredLatitude,
  requiredLongitude,
  stored,
  timeNowProvider
}: LiveCivilExtremesParams): TideExtremesAtLocation | undefined {
  const window = getCurrentCivilDayWindow(timeNowProvider);
  return extremesInCivilWindow({
    requiredLatitude,
    requiredLongitude,
    stored,
    civilDayDisplayWindow: window
  });
}

export function loadStoredCivilExtremes({
  requiredLatitude,
  requiredLongitude,
  loader,
  storageKey,
  timeNowProvider
}: LoadStoredExtremesParams): TideExtremesAtLocation | undefined {
  const rawSnapshot = loader.getItem(storageKey);
  if (rawSnapshot === null) {
    return undefined;
  }

  const stored = deserializeExtremesSnapshot(rawSnapshot);
  if (!stored) {
    return undefined;
  }

  return extremesForCurrentCivilDay({
    requiredLatitude,
    requiredLongitude,
    stored,
    timeNowProvider
  });
}
