import { describe, expect, it } from "vitest";
import {
  DISPLAY_ASPECT_SQUARE_TOLERANCE,
  DISPLAY_DEVICE_BREAKPOINTS_CSS_PX,
  aspectClassFromViewportPx,
  deriveDisplayOptimisation,
  deviceClassFromViewportWidthPx
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

describe("deriveDisplayOptimisation", () => {
  it("returns consistent fields for a typical phone portrait viewport", () => {
    const s = deriveDisplayOptimisation({ viewportWidthPx: 390, viewportHeightPx: 844 });
    expect(s.deviceClass).toBe("mobile");
    expect(s.aspectClass).toBe("portrait");
    expect(s.aspectRatio).toBeCloseTo(390 / 844, 10);
    expect(s.viewportWidthPx).toBe(390);
    expect(s.viewportHeightPx).toBe(844);
  });

  it("returns landscape mobile when width stays within the mobile breakpoint", () => {
    const s = deriveDisplayOptimisation({ viewportWidthPx: 740, viewportHeightPx: 360 });
    expect(s.deviceClass).toBe("mobile");
    expect(s.aspectClass).toBe("landscape");
  });
});
