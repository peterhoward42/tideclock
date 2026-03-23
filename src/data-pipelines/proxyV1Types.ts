export type ProxyV1ExtremeType = 'High' | 'Low';

export interface ProxyV1Extreme {
  type: ProxyV1ExtremeType;
  time: string;
  heightMetres: number;
}

export interface TideProxyV1Response {
  tides: ProxyV1Extreme[];
  datum: 'CD';
  windowStart: string;
  expiresAt: string;
  attribution: string;
}

export interface ProxyV1ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
