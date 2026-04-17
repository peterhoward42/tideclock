/**
 * TideExtreme.ts — Domain row for one tidal high or low (UTC instant, height).
 * Kind: Definition.
 */

export type TideExtremeType = 'high' | 'low';

/** One tidal high or low: instant in UTC (ISO 8601) and height in metres above chart datum. */
export class TideExtreme {
  public readonly type: TideExtremeType;
  public readonly timeUtc: string;
  public readonly heightMetres: number;

  constructor(type: TideExtremeType, timeUtc: string, heightMetres: number) {
    this.type = type;
    this.timeUtc = timeUtc;
    this.heightMetres = heightMetres;
  }
}

/** Canonical enriched row shape used when tide extrema need parsed time arithmetic. */
export interface TimedTideExtreme {
  readonly type: TideExtremeType;
  readonly timeMs: number;
  readonly heightMetres: number;
}
