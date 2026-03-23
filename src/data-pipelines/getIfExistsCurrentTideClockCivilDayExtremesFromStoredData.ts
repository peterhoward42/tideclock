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

interface GetIfExistsCurrentTideClockCivilDayExtremesFromSnapshotParams {
  requiredLatitude: number;
  requiredLongitude: number;
  stored: TideExtremesAtLocation;
  timeNowProvider?: TimeNowProvider;
}

interface GetIfExistsCurrentTideClockCivilDayExtremesFromStoredDataParams {
  requiredLatitude: number;
  requiredLongitude: number;
  loader: TideExtremesLoader;
  storageKey?: string;
  timeNowProvider?: TimeNowProvider;
}

export function getIfExistsCurrentTideClockCivilDayExtremesFromSnapshot({
  requiredLatitude,
  requiredLongitude,
  stored,
  timeNowProvider = new SystemTimeNowProvider()
}: GetIfExistsCurrentTideClockCivilDayExtremesFromSnapshotParams): TideExtremesAtLocation | undefined {
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

export function getIfExistsCurrentTideClockCivilDayExtremesFromStoredData({
  requiredLatitude,
  requiredLongitude,
  loader,
  storageKey = TIDE_EXTREMES_LOCAL_STORAGE_KEY,
  timeNowProvider = new SystemTimeNowProvider()
}: GetIfExistsCurrentTideClockCivilDayExtremesFromStoredDataParams): TideExtremesAtLocation | undefined {
  const rawSnapshot = loader.getItem(storageKey);
  if (rawSnapshot === null) {
    return undefined;
  }

  const stored = deserializeTideExtremesAtLocation(rawSnapshot);
  if (!stored) {
    return undefined;
  }

  return getIfExistsCurrentTideClockCivilDayExtremesFromSnapshot({
    requiredLatitude,
    requiredLongitude,
    stored,
    timeNowProvider
  });
}
