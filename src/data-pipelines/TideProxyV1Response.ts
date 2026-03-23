export type TideProxyV1ExtremeType = 'High' | 'Low';

export interface TideProxyV1TideExtreme {
  type: TideProxyV1ExtremeType;
  time: string;
  heightMetres: number;
}

export interface TideProxyV1Response {
  tides: TideProxyV1TideExtreme[];
  datum: 'CD';
  windowStart: string;
  expiresAt: string;
  attribution: string;
}

export interface TideProxyV1ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}
