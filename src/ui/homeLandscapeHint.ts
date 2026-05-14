/**
 * homeLandscapeHint.ts — Pure helpers for the home-route landscape encouragement (letterbox slack + display policy).
 * Predicate wiring lives in Home.svelte; thresholds stay fixed and unit-tested here.
 */

import type { DisplayOptimisationSnapshot } from "./displayOptimisation";

/** Enough for readable type and touch-safe margins inside each vertical letterbox band. */
export const HOME_LANDSCAPE_HINT_MIN_VERTICAL_SLACK_CSS_PX = 44;

/**
 * Vertical padding above and below the uniformly scaled viewBox content for
 * `preserveAspectRatio="xMidYMid meet"` in a rectangular container.
 */
export function verticalLetterboxSlackMidMeetPx(
  containerWidthPx: number,
  containerHeightPx: number,
  viewBoxWidth: number,
  viewBoxHeight: number,
): number {
  if (
    !Number.isFinite(containerWidthPx) ||
    !Number.isFinite(containerHeightPx) ||
    !Number.isFinite(viewBoxWidth) ||
    !Number.isFinite(viewBoxHeight)
  ) {
    return 0;
  }
  if (
    containerWidthPx <= 0 ||
    containerHeightPx <= 0 ||
    viewBoxWidth <= 0 ||
    viewBoxHeight <= 0
  ) {
    return 0;
  }
  const scale = Math.min(
    containerWidthPx / viewBoxWidth,
    containerHeightPx / viewBoxHeight,
  );
  const renderedHeight = viewBoxHeight * scale;
  return Math.max(0, (containerHeightPx - renderedHeight) / 2);
}

export function homeLandscapeHintDisplayPolicyAllows(
  snap: Pick<
    DisplayOptimisationSnapshot,
    | "aspectClass"
    | "deviceClass"
    | "homeLandscapeEncouragementPrimaryInputInScope"
  >,
): boolean {
  return (
    snap.homeLandscapeEncouragementPrimaryInputInScope &&
    snap.aspectClass === "portrait" &&
    (snap.deviceClass === "mobile" || snap.deviceClass === "tablet")
  );
}

/**
 * When true, defer the default-location + conceptual-key onboarding until the user is not in
 * portrait on a touch-classed phone/tablet viewport — same scope as the rotation encouragement.
 * @see docs/planning/onboarding.md
 */
export function onboardingDeferDefaultLocationExplainerToLandscape(
  snap: Pick<
    DisplayOptimisationSnapshot,
    | "aspectClass"
    | "deviceClass"
    | "homeLandscapeEncouragementPrimaryInputInScope"
  >,
): boolean {
  return homeLandscapeHintDisplayPolicyAllows(snap);
}

export function shouldShowHomeLandscapeHint(
  snap: Pick<
    DisplayOptimisationSnapshot,
    | "aspectClass"
    | "deviceClass"
    | "homeLandscapeEncouragementPrimaryInputInScope"
  >,
  verticalLetterboxSlackPx: number,
): boolean {
  return (
    homeLandscapeHintDisplayPolicyAllows(snap) &&
    verticalLetterboxSlackPx >= HOME_LANDSCAPE_HINT_MIN_VERTICAL_SLACK_CSS_PX
  );
}
