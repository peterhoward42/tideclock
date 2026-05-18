/**
 * fetchProxyV1Tides.ts — Single GET to Tide Proxy API v1; returns typed JSON or throws.
 * Kind: Adapter / boundary (HTTP). Does not map into domain models.
 */

import {
  ProxyQuotaExhaustedError,
  type ProxyV1ErrorResponse,
  type TideProxyV1Response
} from './proxyV1Types';

export interface FetchProxyV1TidesParams {
  lat: number;
  lon: number;
  /** Non-empty tide proxy origin (e.g. from `import.meta.env.VITE_TIDE_PROXY_BASE_URL`). */
  baseUrl: string;
  fetchImpl: typeof fetch;
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
  baseUrl,
  fetchImpl
}: FetchProxyV1TidesParams): Promise<TideProxyV1Response> {
  assertValidCoordinates(lat, lon);
  if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
    throw new Error('Missing tide proxy base URL. Pass a non-empty baseUrl.');
  }

  // Absolute path `/v1/tides` would drop a function prefix like `/tides-proxy`; resolve relative to base instead.
  const baseWithSlash = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`;
  const endpoint = new URL('v1/tides', baseWithSlash);
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

  const proxyError = readProxyErrorBody(payload);
  if (
    response.status === 503 &&
    proxyError?.code === 'UPSTREAM_CREDITS_EXHAUSTED'
  ) {
    throw new ProxyQuotaExhaustedError(proxyError.message);
  }

  if (proxyError) {
    throw new Error(`Tide proxy request failed (${response.status}): ${proxyError.message}`);
  }

  throw new Error(`Tide proxy request failed (${response.status}).`);
}

function readProxyErrorBody(
  payload: unknown
): { code: string; message: string } | undefined {
  if (
    typeof payload !== 'object' ||
    payload === null ||
    !('error' in payload) ||
    !payload.error ||
    typeof payload.error !== 'object'
  ) {
    return undefined;
  }

  const { code, message } = payload.error as { code?: unknown; message?: unknown };
  if (typeof code !== 'string' || typeof message !== 'string') {
    return undefined;
  }

  return { code, message };
}
