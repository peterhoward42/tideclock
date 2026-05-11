/**
 * displayOptimisation.ts — Single place for viewport-derived display policy (device class, aspect class,
 * handheld phone vs slate). Downstream layout should read from here rather than re-implementing breakpoints.
 * Kind: UI policy + thin browser adapter (`displayOptimisation` store). Pure core is testable without `window`.
 */

import { readable, type Readable } from "svelte/store";

/**
 * Inclusive upper bound for the shorter `window.screen` edge (CSS px) to count as a handheld phone.
 * Independent of landscape viewport width (which can exceed {@link DISPLAY_DEVICE_BREAKPOINTS_CSS_PX.mobileMaxWidth}).
 * Typical tablets are ≥ ~744 on the short edge.
 */
export const PHONE_HANDHELD_MAX_MIN_SCREEN_EDGE_CSS_PX = 640;

/** Width buckets use CSS pixels of the layout viewport (`window.innerWidth` in the browser adapter). */
export const DISPLAY_DEVICE_BREAKPOINTS_CSS_PX = {
  /** Inclusive upper bound for {@link DeviceClass} `"mobile"`. */
  mobileMaxWidth: 767,
  /** Inclusive upper bound for {@link DeviceClass} `"tablet"` (desktop begins the next pixel). */
  tabletMaxWidth: 1023
} as const;

/**
 * Half-width of the "square" band around a 1:1 aspect ratio: aspect is "square" when
 * {@code abs(width/height - 1) <= DISPLAY_ASPECT_SQUARE_TOLERANCE}.
 */
export const DISPLAY_ASPECT_SQUARE_TOLERANCE = 0.05;

export type DeviceClass = "mobile" | "tablet" | "desktop";

export type AspectClass = "portrait" | "square" | "landscape";

export interface DisplayOptimisationInput {
  readonly viewportWidthPx: number;
  readonly viewportHeightPx: number;
  /**
   * When `true`, the primary input is hover-capable with a fine pointer (typical mouse on desktop).
   * Narrow desktop browser windows still use width-based {@link DeviceClass} `"mobile"`/`"tablet"`;
   * this flag is the extra signal that home landscape encouragement must stay off.
   */
  readonly primaryInputFineAndHoverCapable?: boolean;
  /** `window.screen` dimensions in CSS px; short edge distinguishes phone from typical tablet. */
  readonly screenWidthCssPx: number;
  readonly screenHeightCssPx: number;
  /** `matchMedia("(pointer: coarse)").matches` — handheld touch primary input. */
  readonly primaryInputCoarse: boolean;
}

export interface DisplayOptimisationSnapshot {
  readonly viewportWidthPx: number;
  readonly viewportHeightPx: number;
  readonly deviceClass: DeviceClass;
  readonly aspectClass: AspectClass;
  /** Width divided by height of the layout viewport (CSS px). */
  readonly aspectRatio: number;
  /**
   * When `false`, do not show the home landscape hint: primary input looks like a desktop browser
   * (`(hover: hover)` and `(pointer: fine)`), regardless of width bucket.
   */
  readonly homeLandscapeEncouragementPrimaryInputInScope: boolean;
  /**
   * Coarse primary pointer and a small physical screen (short edge ≤ {@link PHONE_HANDHELD_MAX_MIN_SCREEN_EDGE_CSS_PX}).
   * Unlike {@link DeviceClass}, does not flip to `"tablet"` when a phone is held landscape (wide viewport).
   */
  readonly likelyHandheldPhoneFormFactor: boolean;
}

export function deviceClassFromViewportWidthPx(viewportWidthPx: number): DeviceClass {
  if (!Number.isFinite(viewportWidthPx)) {
    throw new RangeError("deviceClassFromViewportWidthPx: width must be finite");
  }
  if (viewportWidthPx <= 0) {
    throw new RangeError("deviceClassFromViewportWidthPx: width must be positive");
  }
  if (viewportWidthPx <= DISPLAY_DEVICE_BREAKPOINTS_CSS_PX.mobileMaxWidth) return "mobile";
  if (viewportWidthPx <= DISPLAY_DEVICE_BREAKPOINTS_CSS_PX.tabletMaxWidth) return "tablet";
  return "desktop";
}

export function aspectClassFromViewportPx(viewportWidthPx: number, viewportHeightPx: number): AspectClass {
  if (!Number.isFinite(viewportWidthPx) || !Number.isFinite(viewportHeightPx)) {
    throw new RangeError("aspectClassFromViewportPx: width and height must be finite");
  }
  if (viewportWidthPx <= 0 || viewportHeightPx <= 0) {
    throw new RangeError("aspectClassFromViewportPx: width and height must be positive");
  }
  const aspectRatio = viewportWidthPx / viewportHeightPx;
  if (aspectRatio < 1 - DISPLAY_ASPECT_SQUARE_TOLERANCE) return "portrait";
  if (aspectRatio > 1 + DISPLAY_ASPECT_SQUARE_TOLERANCE) return "landscape";
  return "square";
}

/**
 * Handheld phone (not typical slate): touch-first and small screen short edge.
 * @throws RangeError when screen dimensions are non-finite or non-positive
 */
export function likelyHandheldPhoneFormFactorFromScreenAndPointer(input: {
  readonly screenWidthCssPx: number;
  readonly screenHeightCssPx: number;
  readonly primaryInputCoarse: boolean;
}): boolean {
  const { screenWidthCssPx, screenHeightCssPx, primaryInputCoarse } = input;
  if (!primaryInputCoarse) {
    return false;
  }
  if (!Number.isFinite(screenWidthCssPx) || !Number.isFinite(screenHeightCssPx)) {
    throw new RangeError("likelyHandheldPhoneFormFactorFromScreenAndPointer: screen dimensions must be finite");
  }
  if (screenWidthCssPx <= 0 || screenHeightCssPx <= 0) {
    throw new RangeError("likelyHandheldPhoneFormFactorFromScreenAndPointer: screen dimensions must be positive");
  }
  const minEdge = Math.min(screenWidthCssPx, screenHeightCssPx);
  return minEdge <= PHONE_HANDHELD_MAX_MIN_SCREEN_EDGE_CSS_PX;
}

/**
 * Derives the full snapshot used by UI and future diagram layout policy.
 * @throws RangeError when dimensions are non-finite or non-positive
 */
export function deriveDisplayOptimisation(input: DisplayOptimisationInput): DisplayOptimisationSnapshot {
  const {
    viewportWidthPx,
    viewportHeightPx,
    primaryInputFineAndHoverCapable,
    screenWidthCssPx,
    screenHeightCssPx,
    primaryInputCoarse
  } = input;
  const deviceClass = deviceClassFromViewportWidthPx(viewportWidthPx);
  const aspectClass = aspectClassFromViewportPx(viewportWidthPx, viewportHeightPx);
  const aspectRatio = viewportWidthPx / viewportHeightPx;
  const homeLandscapeEncouragementPrimaryInputInScope =
    primaryInputFineAndHoverCapable !== true;
  const likelyHandheldPhoneFormFactor = likelyHandheldPhoneFormFactorFromScreenAndPointer({
    screenWidthCssPx,
    screenHeightCssPx,
    primaryInputCoarse
  });
  return {
    viewportWidthPx,
    viewportHeightPx,
    deviceClass,
    aspectClass,
    aspectRatio,
    homeLandscapeEncouragementPrimaryInputInScope,
    likelyHandheldPhoneFormFactor
  };
}

function readPrimaryInputFineAndHoverCapable(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return (
      window.matchMedia("(hover: hover)").matches &&
      window.matchMedia("(pointer: fine)").matches
    );
  } catch {
    return false;
  }
}

function readPrimaryInputCoarse(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

function readDisplayOptimisationFromInnerDimensions(
  viewportWidthPx: number,
  viewportHeightPx: number,
): DisplayOptimisationSnapshot {
  const hasWindow = typeof window !== "undefined";
  const screenWidthCssPx = hasWindow ? window.screen.width : viewportWidthPx;
  const screenHeightCssPx = hasWindow ? window.screen.height : viewportHeightPx;
  return deriveDisplayOptimisation({
    viewportWidthPx,
    viewportHeightPx,
    primaryInputFineAndHoverCapable: hasWindow ? readPrimaryInputFineAndHoverCapable() : false,
    screenWidthCssPx,
    screenHeightCssPx,
    primaryInputCoarse: hasWindow ? readPrimaryInputCoarse() : false
  });
}

/**
 * Browser: subscribe to receive updates on resize and orientation change.
 * In non-browser contexts the initial value is a neutral desktop landscape placeholder; the store never updates.
 */
export const displayOptimisation: Readable<DisplayOptimisationSnapshot> = readable(
  typeof window !== "undefined"
    ? readDisplayOptimisationFromInnerDimensions(window.innerWidth, window.innerHeight)
    : readDisplayOptimisationFromInnerDimensions(1024, 768),
  (set) => {
    if (typeof window === "undefined") return;
    const update = (): void => {
      set(readDisplayOptimisationFromInnerDimensions(window.innerWidth, window.innerHeight));
    };
    let mqlHover: MediaQueryList | null = null;
    let mqlPointer: MediaQueryList | null = null;
    const onMediaChange = (): void => {
      update();
    };
    let mqlCoarse: MediaQueryList | null = null;
    try {
      mqlHover = window.matchMedia("(hover: hover)");
      mqlPointer = window.matchMedia("(pointer: fine)");
      mqlCoarse = window.matchMedia("(pointer: coarse)");
      mqlHover.addEventListener("change", onMediaChange);
      mqlPointer.addEventListener("change", onMediaChange);
      mqlCoarse.addEventListener("change", onMediaChange);
    } catch {
      // ignore (very old engines): resize/orientation still refresh dimensions
    }
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      if (mqlHover !== null) {
        mqlHover.removeEventListener("change", onMediaChange);
      }
      if (mqlPointer !== null) {
        mqlPointer.removeEventListener("change", onMediaChange);
      }
      if (mqlCoarse !== null) {
        mqlCoarse.removeEventListener("change", onMediaChange);
      }
    };
  }
);
