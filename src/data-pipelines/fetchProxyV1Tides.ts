import type { ProxyV1ErrorResponse, TideProxyV1Response } from './proxyV1Types';

interface FetchProxyV1TidesParams {
  lat: number;
  lon: number;
  baseUrl?: string;
  fetchImpl?: typeof fetch;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function assertValidCoordinates(lat: number, lon: number): void {
  if (!isFiniteNumber(lat) || lat < -90 || lat > 90) {
    throw new Error(`Invalid latitude "${lat}". Expected a number in [-90, 90].`);
  }

  if (!isFiniteNumber(lon) || lon < -180 || lon > 180) {
    throw new Error(`Invalid longitude "${lon}". Expected a number in [-180, 180].`);
  }
}

/**
 * Orchestrates one request to Tide Proxy API v1 and returns the raw payload shape.
 * No schema-to-domain transformation is performed in this pipeline helper.
 */
export async function fetchProxyV1Tides({
  lat,
  lon,
  baseUrl = import.meta.env.VITE_TIDE_PROXY_BASE_URL,
  fetchImpl = fetch
}: FetchProxyV1TidesParams): Promise<TideProxyV1Response> {
  assertValidCoordinates(lat, lon);
  if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    throw new Error('Missing VITE_TIDE_PROXY_BASE_URL.');
  }

  const endpoint = new URL('/v1/tides', baseUrl);
  endpoint.searchParams.set('lat', String(lat));
  endpoint.searchParams.set('lon', String(lon));

  const response = await fetchImpl(endpoint.toString(), {
    method: 'GET',
    headers: {
      Accept: 'application/json'
    }
  });

  const payload = (await response.json()) as TideProxyV1Response | ProxyV1ErrorResponse;
  if (response.ok) {
    return payload as TideProxyV1Response;
  }

  if (
    typeof payload === 'object' &&
    payload !== null &&
    'error' in payload &&
    payload.error &&
    typeof payload.error === 'object' &&
    'message' in payload.error &&
    typeof payload.error.message === 'string'
  ) {
    throw new Error(`Tide proxy request failed (${response.status}): ${payload.error.message}`);
  }

  throw new Error(`Tide proxy request failed (${response.status}).`);
}
