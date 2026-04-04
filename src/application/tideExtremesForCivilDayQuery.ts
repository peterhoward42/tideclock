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

function tideQueryDiag(...args: unknown[]): void {
  if (!import.meta.env.DEV || import.meta.env.MODE === 'test') {
    return;
  }
  console.log('[tideclock] tide-query:', ...args);
}

/** Loader, storer, and proxy origin — required on every call. */
export interface TideExtremesForCivilDayQueryCoreDeps {
  readonly loader: ExtremesLoader;
  readonly storer: ExtremesStorer;
  /** Non-empty tide proxy origin (e.g. from env in the app shell). */
  readonly baseUrl: string;
}

/**
 * Optional replacement for browser defaults. Omitting a field selects the production
 * meaning: global `fetch`, {@link EXTREMES_SNAPSHOT_KEY}, {@link SystemTimeNowProvider}.
 * Tests pass stubs here; the UI root typically omits the whole group.
 */
export interface TideExtremesForCivilDayQuerySeams {
  readonly fetchImpl?: typeof fetch;
  readonly storageKey?: string;
  readonly timeNowProvider?: TimeNowProvider;
}

export type TideExtremesForCivilDayQueryDeps = TideExtremesForCivilDayQueryCoreDeps &
  TideExtremesForCivilDayQuerySeams;

function resolveTideExtremesQuerySeams(
  seams: TideExtremesForCivilDayQuerySeams
): {
  fetchImpl: typeof fetch;
  storageKey: string;
  timeNowProvider: TimeNowProvider;
} {
  return {
    fetchImpl: seams.fetchImpl ?? fetch,
    storageKey: seams.storageKey ?? EXTREMES_SNAPSHOT_KEY,
    timeNowProvider: seams.timeNowProvider ?? new SystemTimeNowProvider()
  };
}

/**
 * Tries the persisted snapshot first, then fetches and replaces the store when the
 * current civil-day query is not satisfied. Used by the UI root with
 * {@link TideExtremesForCivilDayQueryCoreDeps} only; tests supply
 * {@link TideExtremesForCivilDayQuerySeams}.
 */
export async function loadTideExtremesForCurrentCivilDayQuery(
  latitude: number,
  longitude: number,
  deps: TideExtremesForCivilDayQueryDeps
): Promise<TideExtremesAtLocation | undefined> {
  const { loader, storer, baseUrl } = deps;
  const { fetchImpl, storageKey, timeNowProvider } = resolveTideExtremesQuerySeams(deps);

  tideQueryDiag('start', {
    latitude,
    longitude,
    storageKey,
    baseUrl
  });

  const fromStore = loadExtremesForCurrentCivilDay({
    requiredLatitude: latitude,
    requiredLongitude: longitude,
    loader,
    storageKey,
    timeNowProvider
  });
  if (fromStore !== undefined) {
    tideQueryDiag('store hit — using persisted snapshot for civil day', {
      extremeCount: fromStore.extremes.length
    });
    return fromStore;
  }

  tideQueryDiag('store miss — fetching proxy and replacing snapshot');

  const fullSnapshot = await fetchStoreExtremes({
    lat: latitude,
    lon: longitude,
    baseUrl,
    fetchImpl,
    storer,
    storageKey
  });

  tideQueryDiag('fetch stored — full snapshot extreme count', fullSnapshot.extremes.length);

  const sliced = extremesForCurrentCivilDay({
    requiredLatitude: latitude,
    requiredLongitude: longitude,
    stored: fullSnapshot,
    timeNowProvider
  });

  tideQueryDiag('civil-day slice after fetch', {
    extremeCount: sliced?.extremes.length ?? null,
    defined: sliced !== undefined
  });

  return sliced;
}
