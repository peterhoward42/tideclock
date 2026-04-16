import { describe, expect, it } from "vitest";
import { decideCivilDayRolloverTideRefresh } from "./civilDayRolloverTick";
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

describe("decideCivilDayRolloverTideRefresh", () => {
  it("returns none when no town is selected", () => {
    expect(
      decideCivilDayRolloverTideRefresh({
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
      decideCivilDayRolloverTideRefresh({
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
      decideCivilDayRolloverTideRefresh({
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
