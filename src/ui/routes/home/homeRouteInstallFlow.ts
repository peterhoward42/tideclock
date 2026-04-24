/**
 * Home-route install flow helpers.
 * Keeps install capability detection and copy selection explicit and testable.
 */

export type InstallPlatform = "ios" | "android" | "desktop";

export type InstallPromptOutcome = "accepted" | "dismissed" | "unknown";

export type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export const HOME_INSTALL_BENEFIT_LINES: readonly string[] = [
  "Fits better on screen with less browser chrome.",
  "Works better for immersive tide-clock viewing.",
  "Makes keep-awake behavior easier to use and understand.",
];

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

export async function promptForInstall(
  promptEvent: BeforeInstallPromptEventLike,
): Promise<InstallPromptOutcome> {
  await promptEvent.prompt();
  try {
    const result = await promptEvent.userChoice;
    if (result.outcome === "accepted") return "accepted";
    if (result.outcome === "dismissed") return "dismissed";
    return "unknown";
  } catch {
    return "unknown";
  }
}
