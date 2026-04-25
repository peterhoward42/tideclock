import { describe, expect, it } from "vitest";
import { get } from "svelte/store";
import {
  createHomeInstallObserverStore,
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
      "Uses more of the screen, without browser bars taking up space.",
    );
  });

  it("returns accepted when install prompt is accepted", async () => {
    const promptEvent = {
      prompt: async () => {},
      userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
    } as BeforeInstallPromptEventLike;

    await expect(promptForInstall(promptEvent)).resolves.toBe("accepted");
  });

  it("captures and clears beforeinstallprompt via shared observer store", () => {
    const eventTarget = new EventTarget();
    const observer = createHomeInstallObserverStore({
      eventTarget,
      userAgent: "Mozilla/5.0 (Android 15)",
    });
    let snapshot = get(observer);
    const unsubscribe = observer.subscribe((value) => {
      snapshot = value;
    });
    const promptEvent = Object.assign(
      new Event("beforeinstallprompt", { cancelable: true }),
      {
        prompt: async () => {},
        userChoice: Promise.resolve({ outcome: "dismissed", platform: "web" }),
      },
    ) as BeforeInstallPromptEventLike;

    eventTarget.dispatchEvent(promptEvent);

    expect(promptEvent.defaultPrevented).toBe(true);
    expect(snapshot.promptEvent).toBe(promptEvent);

    observer.clearPromptEvent();
    expect(snapshot.promptEvent).toBeNull();

    unsubscribe();
  });

  it("increments install count and clears prompt event on appinstalled", () => {
    const eventTarget = new EventTarget();
    const observer = createHomeInstallObserverStore({
      eventTarget,
      userAgent: "Mozilla/5.0 (Android 15)",
    });
    let snapshot = get(observer);
    const unsubscribe = observer.subscribe((value) => {
      snapshot = value;
    });

    const promptEvent = Object.assign(
      new Event("beforeinstallprompt", { cancelable: true }),
      {
        prompt: async () => {},
        userChoice: Promise.resolve({ outcome: "accepted", platform: "web" }),
      },
    ) as BeforeInstallPromptEventLike;
    eventTarget.dispatchEvent(promptEvent);
    eventTarget.dispatchEvent(new Event("appinstalled"));

    expect(snapshot.promptEvent).toBeNull();
    expect(snapshot.appInstalledCount).toBe(1);

    unsubscribe();
  });
});
