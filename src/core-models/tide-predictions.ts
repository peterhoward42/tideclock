/**
 * Shared tide domain types and factory for the in-memory model the UI and datapipelines pass around.
 */

export type TideExtremeType = "high" | "low";

/** One predicted high or low water: type, height in metres, instant in UTC ISO-8601. */
export interface TideExtreme {
  type: TideExtremeType;
  height: number;
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

/** Returns an empty model (no extremes; `expiresAt` unset until a successful load). */
export function createTidePredictionsModel(): TidePredictionsModel {
  return { extremes: [] };
}
