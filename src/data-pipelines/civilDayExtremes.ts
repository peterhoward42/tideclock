import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import {
  SystemTimeNowProvider,
  type TimeNowProvider
} from '../time-services/TideClockCivilDayDisplayWindow';
import { getCurrentTideClockCivilDayDisplayWindow } from '../time-services/getCurrentTideClockCivilDayDisplayWindow';
import {
  deserializeExtremesSnapshot,
  EXTREMES_SNAPSHOT_KEY,
  type ExtremesLoader
} from './extremesSnapshot';

function civilDayExtremesDiag(...args: unknown[]): void {
  if (!import.meta.env.DEV || import.meta.env.MODE === 'test') {
    return;
  }
  console.log('[tideclock] civil-day-extremes:', ...args);
}

interface CivilDayFromSnapshotParams {
  requiredLatitude: number;
  requiredLongitude: number;
  stored: TideExtremesAtLocation;
  timeNowProvider?: TimeNowProvider;
}

interface LoadCivilDayExtremesParams {
  requiredLatitude: number;
  requiredLongitude: number;
  loader: ExtremesLoader;
  storageKey?: string;
  timeNowProvider?: TimeNowProvider;
}

export function extremesForCurrentCivilDay({
  requiredLatitude,
  requiredLongitude,
  stored,
  timeNowProvider = new SystemTimeNowProvider()
}: CivilDayFromSnapshotParams): TideExtremesAtLocation | undefined {
  if (stored.latitude !== requiredLatitude || stored.longitude !== requiredLongitude) {
    civilDayExtremesDiag('snapshot rejected — location mismatch', {
      requiredLatitude,
      requiredLongitude,
      storedLatitude: stored.latitude,
      storedLongitude: stored.longitude
    });
    return undefined;
  }

  const window = getCurrentTideClockCivilDayDisplayWindow(timeNowProvider);
  const windowStartMs = window.startLocal.getTime();
  const windowEndExclusiveMs = window.endLocalExclusive.getTime();

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
      windowStartLocal: window.startLocal.toString(),
      windowEndExclusiveLocal: window.endLocalExclusive.toString(),
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

  return new TideExtremesAtLocation(stored.latitude, stored.longitude, inWindowExtremes);
}

export function loadExtremesForCurrentCivilDay({
  requiredLatitude,
  requiredLongitude,
  loader,
  storageKey = EXTREMES_SNAPSHOT_KEY,
  timeNowProvider = new SystemTimeNowProvider()
}: LoadCivilDayExtremesParams): TideExtremesAtLocation | undefined {
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
