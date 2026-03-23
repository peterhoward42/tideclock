import type { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import {
  extremesForCurrentCivilDay,
  loadExtremesForCurrentCivilDay
} from '../data-pipelines/civilDayExtremes';
import { fetchStoreExtremes } from '../data-pipelines/fetchStoreExtremes';
import {
  EXTREMES_SNAPSHOT_KEY,
  type ExtremesLoader,
  type ExtremesStorer
} from '../data-pipelines/extremesSnapshot';
import {
  SystemTimeNowProvider,
  type TimeNowProvider
} from '../time-services/TideClockCivilDayDisplayWindow';

export interface TideExtremesForCivilDayQueryDeps {
  loader: ExtremesLoader;
  storer: ExtremesStorer;
  baseUrl: string;
  fetchImpl?: typeof fetch;
  storageKey?: string;
  timeNowProvider?: TimeNowProvider;
}

/**
 * Tries the persisted snapshot first, then fetches and replaces the store when the
 * current civil-day query is not satisfied. Used by the UI root with browser deps;
 * tests inject fakes via {@link TideExtremesForCivilDayQueryDeps}.
 */
export async function loadTideExtremesForCurrentCivilDayQuery(
  latitude: number,
  longitude: number,
  deps: TideExtremesForCivilDayQueryDeps
): Promise<TideExtremesAtLocation | undefined> {
  const { loader, storer, baseUrl } = deps;
  const fetchImpl = deps.fetchImpl ?? fetch;
  const storageKey = deps.storageKey ?? EXTREMES_SNAPSHOT_KEY;
  const timeNowProvider = deps.timeNowProvider ?? new SystemTimeNowProvider();

  const fromStore = loadExtremesForCurrentCivilDay({
    requiredLatitude: latitude,
    requiredLongitude: longitude,
    loader,
    storageKey,
    timeNowProvider
  });
  if (fromStore !== undefined) {
    return fromStore;
  }

  const fullSnapshot = await fetchStoreExtremes({
    lat: latitude,
    lon: longitude,
    baseUrl,
    fetchImpl,
    storer,
    storageKey
  });

  return extremesForCurrentCivilDay({
    requiredLatitude: latitude,
    requiredLongitude: longitude,
    stored: fullSnapshot,
    timeNowProvider
  });
}
