/**
 * civilDayRolloverRefresh.ts — Pure predicate: should the host reload tides after local civil midnight rolled.
 * Fed by shell refresh state; no I/O. Kind: Pure logic. Does not call the proxy or advance clocks.
 *
 * Whether the host should re-run the civil-day tide query because local midnight
 * crossed since the last successful load. See diagram-host-integration Stage 1.
 *
 * Suppresses repeated triggers while a load is in flight, before any successful
 * load (no baseline day), or after a failed rollover attempt for the same civil
 * day (avoids hammering the proxy every second on persistent error).
 */
export type CivilDayRolloverRefreshInput = {
  readonly hasSelectedTown: boolean;
  readonly tideLoadIsLoading: boolean;
  readonly currentCivilDayStartMs: number;
  readonly lastSuccessfulLoadCivilDayStartMs: number | undefined;
  readonly lastRolloverAttemptCivilDayStartMs: number | undefined;
};

/** True when civil day advanced since last success and no rollover attempt yet for the current day. */
export function shouldTriggerCivilDayRolloverRefresh({
  hasSelectedTown,
  tideLoadIsLoading,
  currentCivilDayStartMs,
  lastSuccessfulLoadCivilDayStartMs,
  lastRolloverAttemptCivilDayStartMs,
}: CivilDayRolloverRefreshInput): boolean {
  if (!hasSelectedTown || tideLoadIsLoading) {
    return false;
  }
  if (lastSuccessfulLoadCivilDayStartMs === undefined) {
    return false;
  }
  if (currentCivilDayStartMs === lastSuccessfulLoadCivilDayStartMs) {
    return false;
  }
  if (lastRolloverAttemptCivilDayStartMs === currentCivilDayStartMs) {
    return false;
  }
  return true;
}
