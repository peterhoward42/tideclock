import { fetchTideProxyV1Data } from './fetchTideProxyV1Data';
import { buildTideExtremesAtLocationFromTideProxyV1Response } from './toTideExtremes';
import type { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';

export const TIDE_EXTREMES_LOCAL_STORAGE_KEY = 'tide-extremes-at-location';

export interface TideExtremesStorer {
  setItem(key: string, value: string): void;
}

interface FetchAndStoreTideExtremesAtLocationParams {
  lat: number;
  lon: number;
  baseUrl: string;
  fetchImpl: typeof fetch;
  storer: TideExtremesStorer;
  storageKey: string;
}

function serializeTideExtremesAtLocation(data: TideExtremesAtLocation): string {
  return JSON.stringify(data);
}

/**
 * Fetches raw tide proxy data, maps it into the domain model,
 * persists it as a JSON snapshot, then returns the mapped value.
 */
export async function fetchAndStoreTideExtremesAtLocation({
  lat,
  lon,
  baseUrl,
  fetchImpl,
  storer,
  storageKey
}: FetchAndStoreTideExtremesAtLocationParams): Promise<TideExtremesAtLocation> {
  const tideProxyResponse = await fetchTideProxyV1Data({
    lat,
    lon,
    baseUrl,
    fetchImpl
  });

  const mappedTideExtremes = buildTideExtremesAtLocationFromTideProxyV1Response({
    latitude: lat,
    longitude: lon,
    response: tideProxyResponse
  });

  storer.setItem(storageKey, serializeTideExtremesAtLocation(mappedTideExtremes));
  return mappedTideExtremes;
}
