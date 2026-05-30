/**
 * Post-fullscreen browser guidance: where the Fullscreen API is missing or only partial
 * (notably iOS), suggest environments where “Really fullscreen” works as intended.
 */

export type FullscreenExperience = "full" | "limited" | "unsupported";

export type FullscreenBrowserAdvice = {
  readonly experience: FullscreenExperience;
  readonly browserLabel: string;
  readonly betterBrowserLabel: string;
};

const WALL_DISPLAY_BETTER_BROWSER = "Chrome on a Mac or Android tablet";

export function isIosPhoneUserAgent(userAgent: string): boolean {
  return /iPhone|iPod/i.test(userAgent);
}

export function isIosTabletUserAgent(
  userAgent: string,
  maxTouchPoints: number,
): boolean {
  if (/iPad/i.test(userAgent)) return true;
  return /Macintosh/i.test(userAgent) && maxTouchPoints > 1;
}

function isIosUserAgent(userAgent: string, maxTouchPoints: number): boolean {
  return (
    isIosPhoneUserAgent(userAgent) ||
    isIosTabletUserAgent(userAgent, maxTouchPoints)
  );
}

/** Human-readable label for the browser the visitor is using now. */
export function browserLabelFromUserAgent(userAgent: string, maxTouchPoints: number): string {
  const onIosPhone = isIosPhoneUserAgent(userAgent);
  const onIosTablet = isIosTabletUserAgent(userAgent, maxTouchPoints);
  const onIos = onIosPhone || onIosTablet;
  const iosPlace = onIosPhone ? "iPhone" : onIosTablet ? "iPad" : null;

  if (/CriOS/i.test(userAgent)) {
    return iosPlace != null ? `Chrome on ${iosPlace}` : /Android/i.test(userAgent) ? "Chrome on Android" : "Chrome";
  }
  if (/FxiOS/i.test(userAgent)) {
    return iosPlace != null ? `Firefox on ${iosPlace}` : "Firefox";
  }
  if (/EdgiOS/i.test(userAgent)) {
    return iosPlace != null ? `Edge on ${iosPlace}` : "Edge";
  }
  if (/Chrome\//i.test(userAgent) && !/Chromium|Edg\//i.test(userAgent)) {
    if (/Android/i.test(userAgent)) return "Chrome on Android";
    return "Chrome";
  }
  if (/Firefox\//i.test(userAgent)) {
    return "Firefox";
  }
  if (/Edg\//i.test(userAgent)) {
    return "Edge";
  }
  if (/Safari\//i.test(userAgent) && !/Chrome|CriOS|Chromium/i.test(userAgent)) {
    if (iosPlace != null) return `Safari on ${iosPlace}`;
    if (/Macintosh/i.test(userAgent)) return "Safari on Mac";
    return "Safari";
  }
  if (onIos) return iosPlace != null ? `this browser on ${iosPlace}` : "this browser on iOS";
  return "this browser";
}

/**
 * Classifies how close the platform gets to hiding all browser chrome for arbitrary HTML.
 * Returns null when no post-action advice is needed.
 */
export function detectFullscreenBrowserAdvice(
  userAgent: string,
  maxTouchPoints: number,
  elementSupportsFullscreen: boolean,
): FullscreenBrowserAdvice | null {
  const onIosPhone = isIosPhoneUserAgent(userAgent);
  const onIosTablet = isIosTabletUserAgent(userAgent, maxTouchPoints);
  const onIos = onIosPhone || onIosTablet;

  if (onIosPhone || (!elementSupportsFullscreen && onIos)) {
    return {
      experience: "unsupported",
      browserLabel: browserLabelFromUserAgent(userAgent, maxTouchPoints),
      betterBrowserLabel: WALL_DISPLAY_BETTER_BROWSER,
    };
  }

  if (onIosTablet && elementSupportsFullscreen) {
    return {
      experience: "limited",
      browserLabel: browserLabelFromUserAgent(userAgent, maxTouchPoints),
      betterBrowserLabel: WALL_DISPLAY_BETTER_BROWSER,
    };
  }

  if (!elementSupportsFullscreen) {
    return {
      experience: "unsupported",
      browserLabel: browserLabelFromUserAgent(userAgent, maxTouchPoints),
      betterBrowserLabel: WALL_DISPLAY_BETTER_BROWSER,
    };
  }

  return null;
}

export function formatFullscreenBrowserAdviceMessage(
  advice: FullscreenBrowserAdvice,
  enteredFullscreen: boolean,
): { readonly lead: string; readonly body: string } {
  const { browserLabel, betterBrowserLabel, experience } = advice;

  if (enteredFullscreen && experience === "limited") {
    return {
      lead: "You've gone fullscreen.",
      body: `You're using ${browserLabel}, which only allows a partial fullscreen — you may still see browser controls, and it's easy to leave by accident. For a wall display that stays really fullscreen, try ${betterBrowserLabel}.`,
    };
  }

  if (enteredFullscreen) {
    return {
      lead: "You've gone fullscreen.",
      body: `You're using ${browserLabel}, which can't hide all of the browser for a web page, so this isn't quite really fullscreen. For the cleanest wall display, try ${betterBrowserLabel}.`,
    };
  }

  return {
    lead: "Really fullscreen isn't available here.",
    body: `${browserLabel} can't hide the browser completely for a web page. For a wall display, open TideDial in ${betterBrowserLabel} instead.`,
  };
}
