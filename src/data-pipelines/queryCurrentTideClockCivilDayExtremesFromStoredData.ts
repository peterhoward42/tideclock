import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import {
  SystemTimeNowProvider,
  type TimeNowProvider
} from '../time-services/TideClockCivilDayDisplayWindow';
import { getCurrentTideClockCivilDayDisplayWindow } from '../time-services/getCurrentTideClockCivilDayDisplayWindow';
import {
  deserializeTideExtremesAtLocation,
  TIDE_EXTREMES_LOCAL_STORAGE_KEY,
  type TideExtremesLoader
} from './tideExtremesSnapshotStorage';

interface QueryCurrentTideClockCivilDayExtremesFromSnapshotParams {
  requiredLatitude: number;
  requiredLongitude: number;
  stored: TideExtremesAtLocation;
  timeNowProvider?: TimeNowProvider;
}

interface QueryCurrentTideClockCivilDayExtremesFromStoredDataParams {
  requiredLatitude: number;
  requiredLongitude: number;
  loader: TideExtremesLoader;
  storageKey?: string;
  timeNowProvider?: TimeNowProvider;
}

export function queryCurrentTideClockCivilDayExtremesFromSnapshot({
  requiredLatitude,
  requiredLongitude,
  stored,
  timeNowProvider = new SystemTimeNowProvider()
}: QueryCurrentTideClockCivilDayExtremesFromSnapshotParams): TideExtremesAtLocation | undefined {
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

export function queryCurrentTideClockCivilDayExtremesFromStoredData({
  requiredLatitude,
  requiredLongitude,
  loader,
  storageKey = TIDE_EXTREMES_LOCAL_STORAGE_KEY,
  timeNowProvider = new SystemTimeNowProvider()
}: QueryCurrentTideClockCivilDayExtremesFromStoredDataParams): TideExtremesAtLocation | undefined {
  const rawSnapshot = loader.getItem(storageKey);
  if (rawSnapshot === null) {
    return undefined;
  }

  const stored = deserializeTideExtremesAtLocation(rawSnapshot);
  if (!stored) {
    return undefined;
  }

  return queryCurrentTideClockCivilDayExtremesFromSnapshot({
    requiredLatitude,
    requiredLongitude,
    stored,
    timeNowProvider
  });
}
