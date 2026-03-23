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
