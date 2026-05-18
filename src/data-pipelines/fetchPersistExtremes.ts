/**
 * fetchPersistExtremes.ts — One proxy fetch, map to domain, persist snapshot in one flow.
 * Kind: Pipeline stage (network → model → storage). Does not slice civil days.
 */

import { extremesFromProxyWire } from './buildFromProxy';
import { fetchProxyV1Tides } from './fetchProxyV1Tides';
import type { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import { serializeExtremesSnapshot, type ExtremesStorer } from './extremesSnapshot';

/** Injectable network and persistence seams; tests use fakes here. */
export interface FetchPersistExtremesDeps {
  readonly fetchImpl: typeof fetch;
  readonly storer: ExtremesStorer;
}

export interface FetchPersistExtremesInput extends FetchPersistExtremesDeps {
  readonly lat: number;
  readonly lon: number;
  /** Non-empty tide proxy origin (e.g. from env). */
  readonly baseUrl: string;
  readonly storageKey: string;
}

/**
 * Fetches raw tide proxy data, maps it into the domain model,
 * persists it as a JSON snapshot, then returns the mapped value.
 */
export async function fetchPersistExtremes({
  lat,
  lon,
  baseUrl,
  fetchImpl,
  storer,
  storageKey
}: FetchPersistExtremesInput): Promise<TideExtremesAtLocation> {
  // ProxyQuotaExhaustedError propagates unchanged; no snapshot is written.
  const tideProxyResponse = await fetchProxyV1Tides({
    lat,
    lon,
    baseUrl,
    fetchImpl
  });

  const mappedTideExtremes = extremesFromProxyWire({
    latitude: lat,
    longitude: lon,
    response: tideProxyResponse
  });

  storer.setItem(storageKey, serializeExtremesSnapshot(mappedTideExtremes));
  return mappedTideExtremes;
}
