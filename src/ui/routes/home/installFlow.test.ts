import { describe, expect, it } from "vitest";
import {
  detectInstallPlatform,
  manualInstallStepsForPlatform,
  manualInstallStepsFromUserAgent,
} from "./installFlow";

describe("installFlow", () => {
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

  it("manualInstallStepsFromUserAgent maps UA to steps", () => {
    expect(
      manualInstallStepsFromUserAgent("Mozilla/5.0 (Android 15)"),
    ).toEqual(manualInstallStepsForPlatform("android"));
  });

  it("manualInstallStepsFromUserAgent uses desktop copy when UA missing", () => {
    expect(manualInstallStepsFromUserAgent(null)).toEqual(
      manualInstallStepsForPlatform("desktop"),
    );
  });
});
