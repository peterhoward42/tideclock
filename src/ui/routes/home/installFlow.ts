/**
 * Browser-led install advice only: platform-specific hints for the menu.
 * Does not intercept `beforeinstallprompt` or call `prompt()` — the browser owns add/install UX.
 */

export type InstallPlatform = "ios" | "android" | "desktop";

export function detectInstallPlatform(userAgent: string): InstallPlatform {
  const ua = userAgent.toLowerCase();
  if (/(iphone|ipad|ipod)/.test(ua)) return "ios";
  if (ua.includes("android")) return "android";
  return "desktop";
}

export function manualInstallStepsForPlatform(
  platform: InstallPlatform,
): readonly string[] {
  if (platform === "ios") {
    return [
      "Open browser Share menu.",
      "Choose Add to Home Screen.",
      "Confirm Add.",
    ];
  }
  if (platform === "android") {
    return [
      "Open browser menu (three dots).",
      "Choose Install app or Add to Home screen.",
      "Confirm Install.",
    ];
  }
  return [
    "Open browser menu.",
    "Choose Install app.",
    "Confirm Install.",
  ];
}

/** Steps for in-app install help, from `navigator.userAgent` or null (defaults to desktop copy). */
export function manualInstallStepsFromUserAgent(
  userAgent: string | null,
): readonly string[] {
  if (userAgent != null && userAgent !== "") {
    return manualInstallStepsForPlatform(detectInstallPlatform(userAgent));
  }
  return manualInstallStepsForPlatform("desktop");
}
