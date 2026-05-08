/**
 * civilDayRolloverTick.ts — Host tick: map shell snapshot to a rollover refresh decision.
 * Composes {@link shouldTriggerRolloverRefresh}; no I/O. Kind: Application policy.
 */
import type { Town } from "../data/townSchema";
import {
  shouldTriggerRolloverRefresh,
  type RolloverRefreshInput,
} from "./civilDayRolloverRefresh";

export type RolloverTickSnapshot = {
  readonly town: Town | undefined;
  readonly tideLoadIsLoading: boolean;
  readonly currentCivilDayStartMs: number;
  readonly civilDayWindowStartMsAtLastSuccessfulLoad: number | undefined;
  readonly lastRolloverAttemptCivilDayStartMs: number | undefined;
};

export type RolloverTickDecision =
  | { readonly action: "none" }
  | {
      readonly action: "refresh";
      readonly town: Town;
      readonly markRolloverAttemptCivilDayStartMs: number;
    };

/**
 * Decide whether the clock tick should start a civil-day rollover tide reload.
 * Caller keeps storage subscription and {@link createTideRefreshController} refresh wiring.
 */
export function decideRolloverTideRefresh(
  snapshot: RolloverTickSnapshot
): RolloverTickDecision {
  if (snapshot.town === undefined) {
    return { action: "none" };
  }
  const rolloverInput: RolloverRefreshInput = {
    hasSelectedTown: true,
    tideLoadIsLoading: snapshot.tideLoadIsLoading,
    currentCivilDayStartMs: snapshot.currentCivilDayStartMs,
    lastSuccessfulLoadCivilDayStartMs: snapshot.civilDayWindowStartMsAtLastSuccessfulLoad,
    lastRolloverAttemptCivilDayStartMs: snapshot.lastRolloverAttemptCivilDayStartMs,
  };
  if (!shouldTriggerRolloverRefresh(rolloverInput)) {
    return { action: "none" };
  }
  return {
    action: "refresh",
    town: snapshot.town,
    markRolloverAttemptCivilDayStartMs: snapshot.currentCivilDayStartMs,
  };
}
