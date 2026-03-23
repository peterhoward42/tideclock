import { fetchTideProxyV1Data } from './fetchTideProxyV1Data';
import { buildTideExtremesAtLocationFromTideProxyV1Response } from './toTideExtremes';
import type { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import {
  serializeTideExtremesAtLocation,
  TIDE_EXTREMES_LOCAL_STORAGE_KEY,
  type TideExtremesStorer
} from './tideExtremesSnapshotStorage';

interface FetchAndStoreTideExtremesAtLocationParams {
  lat: number;
  lon: number;
  baseUrl: string;
  fetchImpl: typeof fetch;
  storer: TideExtremesStorer;
  storageKey: string;
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
