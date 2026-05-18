/**
 * proxyV1Types.ts — Type aliases for Tide Proxy API v1 response JSON (`GET …/v1/tides`).
 * Kind: Definition. No runtime logic.
 */

export type ProxyV1ExtremeType = 'High' | 'Low';

export interface ProxyV1Extreme {
  readonly type: ProxyV1ExtremeType;
  readonly time: string;
  readonly heightMetres: number;
}

export interface TideProxyV1Response {
  readonly tides: readonly ProxyV1Extreme[];
  readonly datum: 'CD';
  readonly windowStart: string;
  readonly expiresAt: string;
  readonly attribution: string;
}

/** Tide Proxy API `APIError.error.code` values (OpenAPI enum). */
export const PROXY_V1_ERROR_CODES = [
  'INVALID_QUERY',
  'UPSTREAM_ERROR',
  'UPSTREAM_CREDITS_EXHAUSTED',
  'INTERNAL_ERROR'
] as const;

export type ProxyV1ErrorCode = (typeof PROXY_V1_ERROR_CODES)[number];

export interface ProxyV1ErrorResponse {
  readonly error: {
    readonly code: ProxyV1ErrorCode | string;
    readonly message: string;
  };
}

/** Operator monthly WorldTides credits exhausted (`503` + `UPSTREAM_CREDITS_EXHAUSTED`). */
export class ProxyQuotaExhaustedError extends Error {
  readonly code: ProxyV1ErrorCode = 'UPSTREAM_CREDITS_EXHAUSTED';
  readonly status = 503;

  constructor(message = 'Monthly API credits exhausted') {
    super(message);
    this.name = 'ProxyQuotaExhaustedError';
  }
}
