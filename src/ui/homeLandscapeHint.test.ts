import { describe, expect, it } from "vitest";
import {
  HOME_LANDSCAPE_HINT_MIN_VERTICAL_SLACK_CSS_PX,
  homeLandscapeHintDisplayPolicyAllows,
  shouldShowHomeLandscapeHint,
  verticalLetterboxSlackMidMeetPx,
} from "./homeLandscapeHint";

describe("verticalLetterboxSlackMidMeetPx", () => {
  it("returns half the unused vertical space when width limits scale (typical wide diagram in portrait)", () => {
    // Wide viewBox in a tall narrow box: scale = containerW / vbW
    const slack = verticalLetterboxSlackMidMeetPx(400, 900, 1000, 400);
    const scale = 400 / 1000;
    const renderedH = 400 * scale;
    expect(slack).toBe((900 - renderedH) / 2);
    expect(slack).toBeGreaterThan(0);
  });

  it("returns 0 when height limits scale (horizontal letterboxing only)", () => {
    const slack = verticalLetterboxSlackMidMeetPx(500, 800, 1000, 2000);
    const scale = Math.min(500 / 1000, 800 / 2000);
    expect(scale).toBe(800 / 2000);
    expect(slack).toBe(0);
  });

  it("returns 0 for non-positive or non-finite inputs", () => {
    expect(verticalLetterboxSlackMidMeetPx(0, 100, 10, 10)).toBe(0);
    expect(verticalLetterboxSlackMidMeetPx(100, 0, 10, 10)).toBe(0);
    expect(verticalLetterboxSlackMidMeetPx(100, 100, 0, 10)).toBe(0);
    expect(verticalLetterboxSlackMidMeetPx(100, 100, 10, 0)).toBe(0);
    expect(verticalLetterboxSlackMidMeetPx(Number.NaN, 100, 10, 10)).toBe(0);
  });
});

describe("homeLandscapeHintDisplayPolicyAllows", () => {
  it("allows portrait mobile and tablet only", () => {
    expect(
      homeLandscapeHintDisplayPolicyAllows({
        aspectClass: "portrait",
        deviceClass: "mobile",
      }),
    ).toBe(true);
    expect(
      homeLandscapeHintDisplayPolicyAllows({
        aspectClass: "portrait",
        deviceClass: "tablet",
      }),
    ).toBe(true);
    expect(
      homeLandscapeHintDisplayPolicyAllows({
        aspectClass: "portrait",
        deviceClass: "desktop",
      }),
    ).toBe(false);
    expect(
      homeLandscapeHintDisplayPolicyAllows({
        aspectClass: "landscape",
        deviceClass: "mobile",
      }),
    ).toBe(false);
  });
});

describe("shouldShowHomeLandscapeHint", () => {
  it("requires policy and slack threshold", () => {
    const snap = { aspectClass: "portrait" as const, deviceClass: "mobile" as const };
    expect(
      shouldShowHomeLandscapeHint(snap, HOME_LANDSCAPE_HINT_MIN_VERTICAL_SLACK_CSS_PX),
    ).toBe(true);
    expect(
      shouldShowHomeLandscapeHint(
        snap,
        HOME_LANDSCAPE_HINT_MIN_VERTICAL_SLACK_CSS_PX - 1,
      ),
    ).toBe(false);
  });
});
