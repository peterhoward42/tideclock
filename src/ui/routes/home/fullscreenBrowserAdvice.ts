/**
 * Post-fullscreen browser guidance: where the Fullscreen API is missing or only partial
 * (notably iOS), explain the platform limit honestly without implying a different device is required.
 */

export type FullscreenExperience = "full" | "limited" | "unsupported";

export type IosDevice = "iphone" | "ipad";

export type FullscreenBrowserAdvice =
  | { readonly experience: "unsupported"; readonly platform: IosDevice }
  | { readonly experience: "limited"; readonly platform: "ipad" }
  | { readonly experience: "unsupported"; readonly browserLabel: string };

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

/** Human-readable label for non-iOS browsers that lack fullscreen support. */
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

  if (onIosPhone) {
    return { experience: "unsupported", platform: "iphone" };
  }

  if (!elementSupportsFullscreen && onIosTablet) {
    return { experience: "unsupported", platform: "ipad" };
  }

  if (onIosTablet && elementSupportsFullscreen) {
    return { experience: "limited", platform: "ipad" };
  }

  if (!elementSupportsFullscreen) {
    return {
      experience: "unsupported",
      browserLabel: browserLabelFromUserAgent(userAgent, maxTouchPoints),
    };
  }

  return null;
}

export function formatFullscreenBrowserAdviceMessage(
  advice: FullscreenBrowserAdvice,
  enteredFullscreen: boolean,
): { readonly lead: string; readonly body: string } {
  if ("platform" in advice) {
    if (advice.platform === "iphone") {
      if (enteredFullscreen) {
        return {
          lead: "You've gone fullscreen.",
          body: "On iPhone, this still isn't really fullscreen — no browser can hide all of its controls for a web page.",
        };
      }
      return {
        lead: "Really fullscreen isn't available here.",
        body: "On iPhone, web pages can't use fullscreen mode — no browser can change that. TideDial still works normally; only Really fullscreen is unavailable.",
      };
    }

    if (enteredFullscreen && advice.experience === "limited") {
      return {
        lead: "You've gone fullscreen.",
        body: "On iPad, fullscreen is only partial — you may still see browser controls, and it's easy to leave by accident. That's an iPad limit, not something TideDial can fix.",
      };
    }

    if (enteredFullscreen) {
      return {
        lead: "You've gone fullscreen.",
        body: "On iPad, this still isn't really fullscreen — the browser can't hide all of its controls for a web page.",
      };
    }

    return {
      lead: "Really fullscreen isn't available here.",
      body: "On iPad, this browser can't use fullscreen mode for web pages. TideDial still works normally; only Really fullscreen is unavailable.",
    };
  }

  const { browserLabel } = advice;

  if (enteredFullscreen) {
    return {
      lead: "You've gone fullscreen.",
      body: `${browserLabel} can't hide all of the browser for a web page, so this isn't quite really fullscreen. Really fullscreen works in recent Chrome, Edge, or Firefox on a Windows PC, Mac, or Android tablet.`,
    };
  }

  return {
    lead: "Really fullscreen isn't available here.",
    body: `${browserLabel} can't hide the browser completely for a web page. Really fullscreen works in recent Chrome, Edge, or Firefox on a Windows PC, Mac, or Android tablet.`,
  };
}
