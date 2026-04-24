import { describe, expect, it } from "vitest";
import {
  detectInstallPlatform,
  HOME_INSTALL_BENEFIT_LINES,
  manualInstallStepsForPlatform,
  promptForInstall,
  type BeforeInstallPromptEventLike,
} from "./homeRouteInstallFlow";

describe("homeRouteInstallFlow", () => {
  it("detects iOS user agent", () => {
    expect(
      detectInstallPlatform(
        "Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X)",
      ),
    ).toBe("ios");
  });

  it("returns manual steps for Android", () => {
    expect(manualInstallStepsForPlatform("android")).toEqual([
      "Open browser menu (three dots).",
      "Choose Install app or Add to Home screen.",
      "Confirm Install.",
    ]);
  });

  it("includes install benefits copy used by the flow", () => {
    expect(HOME_INSTALL_BENEFIT_LINES).toContain(
      "Fits better on screen with less browser chrome.",
    );
  });

  it("returns accepted when install prompt is accepted", async () => {
    const promptEvent = {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    } as BeforeInstallPromptEventLike;

    await expect(promptForInstall(promptEvent)).resolves.toBe("accepted");
  });
});
