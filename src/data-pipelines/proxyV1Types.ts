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

export interface ProxyV1ErrorResponse {
  readonly error: {
    readonly code: string;
    readonly message: string;
  };
}
