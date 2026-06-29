import { describe, expect, it } from "vitest";
import {
  browserLabelFromUserAgent,
  detectFullscreenBrowserAdvice,
  formatFullscreenBrowserAdviceMessage,
  isIosPhoneUserAgent,
  isIosTabletUserAgent,
} from "./fullscreenBrowserAdvice";

const IPHONE_SAFARI =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
const IPHONE_CHROME =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/120.0.6099.119 Mobile/15E148 Safari/604.1";
const IPAD_SAFARI =
  "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Mobile/15E148 Safari/604.1";
const MAC_CHROME =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
const ANDROID_CHROME =
  "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.144 Mobile Safari/537.36";

describe("isIosPhoneUserAgent", () => {
  it("detects iPhone", () => {
    expect(isIosPhoneUserAgent(IPHONE_SAFARI)).toBe(true);
    expect(isIosPhoneUserAgent(MAC_CHROME)).toBe(false);
  });
});

describe("isIosTabletUserAgent", () => {
  it("detects iPad UA", () => {
    expect(isIosTabletUserAgent(IPAD_SAFARI, 5)).toBe(true);
  });

  it("detects iPad desktop UA via touch points", () => {
    const ipadDesktop =
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.2 Safari/605.1.15";
    expect(isIosTabletUserAgent(ipadDesktop, 5)).toBe(true);
    expect(isIosTabletUserAgent(ipadDesktop, 0)).toBe(false);
  });
});

describe("browserLabelFromUserAgent", () => {
  it("names Safari on iPhone and Chrome on iPhone distinctly", () => {
    expect(browserLabelFromUserAgent(IPHONE_SAFARI, 5)).toBe("Safari on iPhone");
    expect(browserLabelFromUserAgent(IPHONE_CHROME, 5)).toBe("Chrome on iPhone");
  });

  it("names Chrome on Android", () => {
    expect(browserLabelFromUserAgent(ANDROID_CHROME, 5)).toBe("Chrome on Android");
  });
});

describe("detectFullscreenBrowserAdvice", () => {
  it("advises on iPhone by platform, not browser", () => {
    const advice = detectFullscreenBrowserAdvice(IPHONE_SAFARI, 5, false);
    expect(advice).toEqual({ experience: "unsupported", platform: "iphone" });
  });

  it("advises on iPhone Chrome the same as Safari", () => {
    const advice = detectFullscreenBrowserAdvice(IPHONE_CHROME, 5, false);
    expect(advice).toEqual({ experience: "unsupported", platform: "iphone" });
  });

  it("advises on iPad when API is present but limited", () => {
    const advice = detectFullscreenBrowserAdvice(IPAD_SAFARI, 5, true);
    expect(advice).toEqual({ experience: "limited", platform: "ipad" });
  });

  it("advises on iPad without fullscreen API", () => {
    const advice = detectFullscreenBrowserAdvice(IPAD_SAFARI, 5, false);
    expect(advice).toEqual({ experience: "unsupported", platform: "ipad" });
  });

  it("returns null for Chrome on Mac with API support", () => {
    expect(detectFullscreenBrowserAdvice(MAC_CHROME, 0, true)).toBeNull();
  });

  it("returns null for Chrome on Android with API support", () => {
    expect(detectFullscreenBrowserAdvice(ANDROID_CHROME, 5, true)).toBeNull();
  });
});

describe("formatFullscreenBrowserAdviceMessage", () => {
  it("explains the iPhone platform limit without suggesting another device", () => {
    const advice = detectFullscreenBrowserAdvice(IPHONE_SAFARI, 5, false)!;
    const msg = formatFullscreenBrowserAdviceMessage(advice, false);
    expect(msg.lead).toMatch(/isn't available/i);
    expect(msg.body).toMatch(/On iPhone/);
    expect(msg.body).toMatch(/no browser can change that/i);
    expect(msg.body).toMatch(/TideDial still works normally/i);
    expect(msg.body).not.toMatch(/Mac|Android tablet|instead/i);
  });

  it("explains partial iPad fullscreen without suggesting another device", () => {
    const ipadAdvice = detectFullscreenBrowserAdvice(IPAD_SAFARI, 5, true)!;
    const msg = formatFullscreenBrowserAdviceMessage(ipadAdvice, true);
    expect(msg.lead).toMatch(/You've gone fullscreen/i);
    expect(msg.body).toMatch(/On iPad/);
    expect(msg.body).toMatch(/only partial/i);
    expect(msg.body).not.toMatch(/Mac|Android tablet|instead/i);
  });

  it("names Windows when describing browsers that support really fullscreen", () => {
    const advice = detectFullscreenBrowserAdvice(MAC_CHROME, 0, false)!;
    const msg = formatFullscreenBrowserAdviceMessage(advice, false);
    expect(msg.body).toMatch(/Windows PC/);
    expect(msg.body).toMatch(/Mac/);
    expect(msg.body).toMatch(/Android tablet/);
  });
});
