import { describe, expect, it } from "vitest";
import {
  DISPLAY_ASPECT_SQUARE_TOLERANCE,
  DISPLAY_DEVICE_BREAKPOINTS_CSS_PX,
  PHONE_HANDHELD_MAX_MIN_SCREEN_EDGE_CSS_PX,
  aspectClassFromViewportPx,
  deriveDisplayOptimisation,
  deviceClassFromViewportWidthPx,
  likelyHandheldPhoneFormFactorFromScreenAndPointer
} from "./displayOptimisation";

describe("deviceClassFromViewportWidthPx", () => {
  it("classifies mobile at the upper breakpoint", () => {
    expect(deviceClassFromViewportWidthPx(DISPLAY_DEVICE_BREAKPOINTS_CSS_PX.mobileMaxWidth)).toBe("mobile");
  });

  it("classifies tablet immediately above mobile", () => {
    expect(deviceClassFromViewportWidthPx(DISPLAY_DEVICE_BREAKPOINTS_CSS_PX.mobileMaxWidth + 1)).toBe("tablet");
  });

  it("classifies tablet at the upper breakpoint", () => {
    expect(deviceClassFromViewportWidthPx(DISPLAY_DEVICE_BREAKPOINTS_CSS_PX.tabletMaxWidth)).toBe("tablet");
  });

  it("classifies desktop immediately above tablet", () => {
    expect(deviceClassFromViewportWidthPx(DISPLAY_DEVICE_BREAKPOINTS_CSS_PX.tabletMaxWidth + 1)).toBe("desktop");
  });

  it("rejects non-positive width", () => {
    expect(() => deviceClassFromViewportWidthPx(0)).toThrow(RangeError);
    expect(() => deviceClassFromViewportWidthPx(-1)).toThrow(RangeError);
  });

  it("rejects non-finite width", () => {
    expect(() => deviceClassFromViewportWidthPx(Number.NaN)).toThrow(RangeError);
  });
});

describe("aspectClassFromViewportPx", () => {
  it("classifies portrait when width is clearly less than height", () => {
    expect(aspectClassFromViewportPx(400, 900)).toBe("portrait");
  });

  it("classifies landscape when width is clearly greater than height", () => {
    expect(aspectClassFromViewportPx(900, 400)).toBe("landscape");
  });

  it("classifies square inside the tolerance band", () => {
    const w = 800;
    const h = w / (1 + DISPLAY_ASPECT_SQUARE_TOLERANCE * 0.5);
    expect(aspectClassFromViewportPx(w, h)).toBe("square");
  });

  it("rejects non-positive dimensions", () => {
    expect(() => aspectClassFromViewportPx(0, 100)).toThrow(RangeError);
    expect(() => aspectClassFromViewportPx(100, 0)).toThrow(RangeError);
  });
});

const typicalPhoneScreen = {
  screenWidthCssPx: 390,
  screenHeightCssPx: 844,
  primaryInputCoarse: true
} as const;

describe("deriveDisplayOptimisation", () => {
  it("returns consistent fields for a typical phone portrait viewport", () => {
    const s = deriveDisplayOptimisation({
      viewportWidthPx: 390,
      viewportHeightPx: 844,
      ...typicalPhoneScreen
    });
    expect(s.deviceClass).toBe("mobile");
    expect(s.aspectClass).toBe("portrait");
    expect(s.aspectRatio).toBeCloseTo(390 / 844, 10);
    expect(s.viewportWidthPx).toBe(390);
    expect(s.viewportHeightPx).toBe(844);
    expect(s.homeLandscapeEncouragementPrimaryInputInScope).toBe(true);
    expect(s.likelyHandheldPhoneFormFactor).toBe(true);
  });

  it("returns landscape mobile when width stays within the mobile breakpoint", () => {
    const s = deriveDisplayOptimisation({
      viewportWidthPx: 740,
      viewportHeightPx: 360,
      ...typicalPhoneScreen
    });
    expect(s.deviceClass).toBe("mobile");
    expect(s.aspectClass).toBe("landscape");
    expect(s.likelyHandheldPhoneFormFactor).toBe(true);
  });

  it("keeps likelyHandheldPhoneFormFactor when landscape viewport is wide but screen stays phone-sized", () => {
    const s = deriveDisplayOptimisation({
      viewportWidthPx: 844,
      viewportHeightPx: 390,
      ...typicalPhoneScreen
    });
    expect(s.deviceClass).toBe("tablet");
    expect(s.aspectClass).toBe("landscape");
    expect(s.likelyHandheldPhoneFormFactor).toBe(true);
  });

  it("treats fine-pointer + hover primary input as out of scope for home landscape encouragement", () => {
    const s = deriveDisplayOptimisation({
      viewportWidthPx: 400,
      viewportHeightPx: 900,
      primaryInputFineAndHoverCapable: true,
      screenWidthCssPx: 1920,
      screenHeightCssPx: 1080,
      primaryInputCoarse: false
    });
    expect(s.deviceClass).toBe("mobile");
    expect(s.aspectClass).toBe("portrait");
    expect(s.homeLandscapeEncouragementPrimaryInputInScope).toBe(false);
    expect(s.likelyHandheldPhoneFormFactor).toBe(false);
  });
});

describe("likelyHandheldPhoneFormFactorFromScreenAndPointer", () => {
  it("is false for a typical tablet screen even with coarse pointer", () => {
    expect(
      likelyHandheldPhoneFormFactorFromScreenAndPointer({
        screenWidthCssPx: 768,
        screenHeightCssPx: 1024,
        primaryInputCoarse: true
      })
    ).toBe(false);
  });

  it("is false without coarse primary pointer", () => {
    expect(
      likelyHandheldPhoneFormFactorFromScreenAndPointer({
        screenWidthCssPx: 390,
        screenHeightCssPx: 844,
        primaryInputCoarse: false
      })
    ).toBe(false);
  });

  it(`is false when the short edge is just above ${PHONE_HANDHELD_MAX_MIN_SCREEN_EDGE_CSS_PX}px`, () => {
    expect(
      likelyHandheldPhoneFormFactorFromScreenAndPointer({
        screenWidthCssPx: PHONE_HANDHELD_MAX_MIN_SCREEN_EDGE_CSS_PX + 1,
        screenHeightCssPx: 1200,
        primaryInputCoarse: true
      })
    ).toBe(false);
  });

  it(`is true when the short edge equals ${PHONE_HANDHELD_MAX_MIN_SCREEN_EDGE_CSS_PX}px`, () => {
    expect(
      likelyHandheldPhoneFormFactorFromScreenAndPointer({
        screenWidthCssPx: PHONE_HANDHELD_MAX_MIN_SCREEN_EDGE_CSS_PX,
        screenHeightCssPx: 1200,
        primaryInputCoarse: true
      })
    ).toBe(true);
  });

  it("rejects non-finite screen dimensions", () => {
    expect(() =>
      likelyHandheldPhoneFormFactorFromScreenAndPointer({
        screenWidthCssPx: Number.NaN,
        screenHeightCssPx: 800,
        primaryInputCoarse: true
      })
    ).toThrow(RangeError);
  });
});
