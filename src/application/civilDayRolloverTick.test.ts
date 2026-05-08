import { describe, expect, it } from "vitest";
import { decideRolloverTideRefresh } from "./civilDayRolloverTick";
import type { Town } from "../data/townSchema";

const aTown = {
  id: "t1",
  name: "Test",
  lat: 1,
  lon: 2,
  localType: "town",
  county: "C",
  postcodeDistrict: "AB1",
  region: "R",
  country: "UK",
} satisfies Town;

describe("decideRolloverTideRefresh", () => {
  it("returns none when no town is selected", () => {
    expect(
      decideRolloverTideRefresh({
        town: undefined,
        tideLoadIsLoading: false,
        currentCivilDayStartMs: 2,
        civilDayWindowStartMsAtLastSuccessfulLoad: 1,
        lastRolloverAttemptCivilDayStartMs: undefined,
      })
    ).toEqual({ action: "none" });
  });

  it("returns none when civil day has not advanced since last successful load", () => {
    expect(
      decideRolloverTideRefresh({
        town: aTown,
        tideLoadIsLoading: false,
        currentCivilDayStartMs: 1,
        civilDayWindowStartMsAtLastSuccessfulLoad: 1,
        lastRolloverAttemptCivilDayStartMs: undefined,
      })
    ).toEqual({ action: "none" });
  });

  it("returns refresh with suppression mark when rollover should run", () => {
    expect(
      decideRolloverTideRefresh({
        town: aTown,
        tideLoadIsLoading: false,
        currentCivilDayStartMs: 2,
        civilDayWindowStartMsAtLastSuccessfulLoad: 1,
        lastRolloverAttemptCivilDayStartMs: undefined,
      })
    ).toEqual({
      action: "refresh",
      town: aTown,
      markRolloverAttemptCivilDayStartMs: 2,
    });
  });
});
