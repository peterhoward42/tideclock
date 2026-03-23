import { fetchProxyV1Tides } from './fetchProxyV1Tides';
import { buildExtremesFromProxy } from './buildFromProxy';
import type { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import { serializeExtremesSnapshot, type ExtremesStorer } from './extremesSnapshot';

interface FetchStoreExtremesParams {
  lat: number;
  lon: number;
  baseUrl: string;
  fetchImpl: typeof fetch;
  storer: ExtremesStorer;
  storageKey: string;
}

/**
 * Fetches raw tide proxy data, maps it into the domain model,
 * persists it as a JSON snapshot, then returns the mapped value.
 */
export async function fetchStoreExtremes({
  lat,
  lon,
  baseUrl,
  fetchImpl,
  storer,
  storageKey
}: FetchStoreExtremesParams): Promise<TideExtremesAtLocation> {
  const tideProxyResponse = await fetchProxyV1Tides({
    lat,
    lon,
    baseUrl,
    fetchImpl
  });

  const mappedTideExtremes = buildExtremesFromProxy({
    latitude: lat,
    longitude: lon,
    response: tideProxyResponse
  });

  storer.setItem(storageKey, serializeExtremesSnapshot(mappedTideExtremes));
  return mappedTideExtremes;
}
