/**
 * civilDayExtremesQuery.ts — Application façade: civil-day slice of stored extremes plus fetch when needed.
 * Orchestrates data-pipelines and time-services for the shell. Kind: Service / orchestrator.
 * Does not render SVG or build diagram specs.
 */

import type { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import {
  extremesForCurrentCivilDay,
  loadStoredCivilExtremes
} from '../data-pipelines/civilDayExtremes';
import { fetchPersistExtremes } from '../data-pipelines/fetchPersistExtremes';
import { ProxyQuotaExhaustedError } from '../data-pipelines/proxyV1Types';
import {
  EXTREMES_SNAPSHOT_KEY,
  type ExtremesLoader,
  type ExtremesStorer
} from '../data-pipelines/extremesSnapshot';
import {
  SystemTimeNowProvider,
  type TimeNowProvider
} from '../time-services/civilDayWindow';

function queryDiag(...args: unknown[]): void {
  if (!import.meta.env.DEV || import.meta.env.MODE === 'test') {
    return;
  }
  console.log('[tideclock] tide-query:', ...args);
}

/** Loader, storer, and proxy origin — required on every call. */
export interface ExtremesQueryCoreDeps {
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
export interface CivilDayExtremesQuerySeams {
  readonly fetchImpl?: typeof fetch;
  readonly storageKey?: string;
  readonly timeNowProvider?: TimeNowProvider;
}

/** Session-scoped gate: after quota exhaustion, bypass store until the shell clears on success. */
export interface QuotaSessionGate {
  readonly isSessionQuotaExhausted: () => boolean;
  readonly setSessionQuotaExhausted: () => void;
  readonly clearSessionQuotaExhausted: () => void;
}

export function createQuotaSessionGate(): QuotaSessionGate {
  let sessionQuotaExhausted = false;
  return {
    isSessionQuotaExhausted: () => sessionQuotaExhausted,
    setSessionQuotaExhausted: () => {
      sessionQuotaExhausted = true;
    },
    clearSessionQuotaExhausted: () => {
      sessionQuotaExhausted = false;
    }
  };
}

export type CivilDayExtremesQueryDeps = ExtremesQueryCoreDeps &
  CivilDayExtremesQuerySeams & {
    readonly quotaSession: QuotaSessionGate;
  };

function resolveQuerySeams(
  seams: CivilDayExtremesQuerySeams
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
 * {@link ExtremesQueryCoreDeps} only; tests supply
 * {@link CivilDayExtremesQuerySeams}.
 */
export async function loadCivilDayExtremes(
  latitude: number,
  longitude: number,
  deps: CivilDayExtremesQueryDeps
): Promise<TideExtremesAtLocation | undefined> {
  const { loader, storer, baseUrl, quotaSession } = deps;
  const { fetchImpl, storageKey, timeNowProvider } = resolveQuerySeams(deps);

  queryDiag('start', {
    latitude,
    longitude,
    storageKey,
    baseUrl,
    sessionQuotaExhausted: quotaSession.isSessionQuotaExhausted()
  });

  // When quota was detected this session, always fetch so recovery is a real 200.
  // @see docs/planning/quota-response.md (operator notes: reload vs civil-day rollover).
  if (!quotaSession.isSessionQuotaExhausted()) {
    const fromStore = loadStoredCivilExtremes({
      requiredLatitude: latitude,
      requiredLongitude: longitude,
      loader,
      storageKey,
      timeNowProvider
    });
    if (fromStore !== undefined) {
      queryDiag('store hit — using persisted snapshot for civil day', {
        extremeCount: fromStore.extremes.length
      });
      return fromStore;
    }
  } else {
    queryDiag('quota session — bypassing persisted snapshot');
  }

  queryDiag('store miss or quota bypass — fetching proxy');

  try {
    const fullSnapshot = await fetchPersistExtremes({
      lat: latitude,
      lon: longitude,
      baseUrl,
      fetchImpl,
      storer,
      storageKey
    });

    queryDiag('fetch stored — full snapshot extreme count', fullSnapshot.extremes.length);

    const sliced = extremesForCurrentCivilDay({
      requiredLatitude: latitude,
      requiredLongitude: longitude,
      stored: fullSnapshot,
      timeNowProvider
    });

    queryDiag('civil-day slice after fetch', {
      extremeCount: sliced?.extremes.length ?? null,
      defined: sliced !== undefined
    });

    return sliced;
  } catch (error) {
    if (error instanceof ProxyQuotaExhaustedError) {
      quotaSession.setSessionQuotaExhausted();
    }
    throw error;
  }
}
