// tide-predictions.ts

export type TideExtremeType = "high" | "low";

export interface TideExtreme {
  type: TideExtremeType; // 'high' or 'low'
  height: number; // metres
  /** UTC instant as ISO-8601 (same form as `Date.prototype.toISOString()`). */
  time: string;
}

/**
 * Holds tide extremes for the app. Callers may read and replace `extremes`
 * directly; batch loads should assign a new array (or replace contents) in
 * chronological order — sorting policy stays with the producer.
 *
 * `expiresAt` is set by the tide proxy (ISO 8601 UTC, exclusive end of the
 * forecast window). Omitted until a successful load.
 */
export interface TidePredictionsModel {
  extremes: TideExtreme[];
  expiresAt?: string;
}

export function createTidePredictionsModel(): TidePredictionsModel {
  return { extremes: [] };
}
