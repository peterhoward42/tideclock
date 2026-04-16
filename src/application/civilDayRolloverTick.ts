/**
 * civilDayRolloverTick.ts — Host tick: map shell snapshot to a rollover refresh decision.
 * Composes {@link shouldTriggerCivilDayRolloverRefresh}; no I/O. Kind: Application policy.
 */
import type { Town } from "../data/townSchema";
import {
  shouldTriggerCivilDayRolloverRefresh,
  type CivilDayRolloverRefreshInput,
} from "./civilDayRolloverRefresh";

export type CivilDayRolloverTickSnapshot = {
  readonly town: Town | undefined;
  readonly tideLoadIsLoading: boolean;
  readonly currentCivilDayStartMs: number;
  readonly civilDayWindowStartMsAtLastSuccessfulLoad: number | undefined;
  readonly lastRolloverAttemptCivilDayStartMs: number | undefined;
};

export type CivilDayRolloverTickDecision =
  | { readonly action: "none" }
  | {
      readonly action: "refresh";
      readonly town: Town;
      readonly markRolloverAttemptCivilDayStartMs: number;
    };

/**
 * Decide whether the clock tick should start a civil-day rollover tide reload.
 * Caller keeps storage subscription and {@link createTideExtremesRefreshController} refresh wiring.
 */
export function decideCivilDayRolloverTideRefresh(
  snapshot: CivilDayRolloverTickSnapshot
): CivilDayRolloverTickDecision {
  if (snapshot.town === undefined) {
    return { action: "none" };
  }
  const rolloverInput: CivilDayRolloverRefreshInput = {
    hasSelectedTown: true,
    tideLoadIsLoading: snapshot.tideLoadIsLoading,
    currentCivilDayStartMs: snapshot.currentCivilDayStartMs,
    lastSuccessfulLoadCivilDayStartMs: snapshot.civilDayWindowStartMsAtLastSuccessfulLoad,
    lastRolloverAttemptCivilDayStartMs: snapshot.lastRolloverAttemptCivilDayStartMs,
  };
  if (!shouldTriggerCivilDayRolloverRefresh(rolloverInput)) {
    return { action: "none" };
  }
  return {
    action: "refresh",
    town: snapshot.town,
    markRolloverAttemptCivilDayStartMs: snapshot.currentCivilDayStartMs,
  };
}
