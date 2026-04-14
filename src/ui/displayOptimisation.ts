/**
 * displayOptimisation.ts — Single place for viewport-derived display policy (device class, aspect class).
 * Downstream layout and diagram tuning should read from here rather than re-implementing breakpoints.
 * Kind: UI policy + thin browser adapter (`displayOptimisation` store). Pure core is testable without `window`.
 */

import { readable, type Readable } from "svelte/store";

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
}

export interface DisplayOptimisationSnapshot {
  readonly viewportWidthPx: number;
  readonly viewportHeightPx: number;
  readonly deviceClass: DeviceClass;
  readonly aspectClass: AspectClass;
  /** Width divided by height of the layout viewport (CSS px). */
  readonly aspectRatio: number;
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
 * Derives the full snapshot used by UI and future diagram layout policy.
 * @throws RangeError when dimensions are non-finite or non-positive
 */
export function deriveDisplayOptimisation(input: DisplayOptimisationInput): DisplayOptimisationSnapshot {
  const { viewportWidthPx, viewportHeightPx } = input;
  const deviceClass = deviceClassFromViewportWidthPx(viewportWidthPx);
  const aspectClass = aspectClassFromViewportPx(viewportWidthPx, viewportHeightPx);
  const aspectRatio = viewportWidthPx / viewportHeightPx;
  return {
    viewportWidthPx,
    viewportHeightPx,
    deviceClass,
    aspectClass,
    aspectRatio
  };
}

function readDisplayOptimisationFromInnerDimensions(
  viewportWidthPx: number,
  viewportHeightPx: number
): DisplayOptimisationSnapshot {
  return deriveDisplayOptimisation({ viewportWidthPx, viewportHeightPx });
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
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }
);
