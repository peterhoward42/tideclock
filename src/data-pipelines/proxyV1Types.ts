/** JSON values returned by Tide Proxy API v1 (`GET …/v1/tides`). */

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
