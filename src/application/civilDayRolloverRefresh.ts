/**
 * Whether the host should re-run the civil-day tide query because local midnight
 * crossed since the last successful load. See diagram-host-integration Stage 1.
 *
 * Suppresses repeated triggers while a load is in flight, before any successful
 * load (no baseline day), or after a failed rollover attempt for the same civil
 * day (avoids hammering the proxy every second on persistent error).
 */
export function shouldTriggerCivilDayRolloverRefresh(params: {
  hasSelectedTown: boolean;
  tideLoadIsLoading: boolean;
  currentCivilDayStartMs: number;
  lastSuccessfulLoadCivilDayStartMs: number | undefined;
  lastRolloverAttemptCivilDayStartMs: number | undefined;
}): boolean {
  const {
    hasSelectedTown,
    tideLoadIsLoading,
    currentCivilDayStartMs,
    lastSuccessfulLoadCivilDayStartMs,
    lastRolloverAttemptCivilDayStartMs
  } = params;

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
