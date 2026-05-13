/**
 * Home-route install flow helpers.
 * Keeps install capability detection and copy selection explicit and testable.
 */

import { writable, type Readable } from "svelte/store";

export type InstallPlatform = "ios" | "android" | "desktop";

export type InstallPromptOutcome = "accepted" | "dismissed" | "unknown";

export type BeforeInstallPromptEventLike = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

export type InstallObserverSnapshot = {
  platform: InstallPlatform;
  promptEvent: BeforeInstallPromptEventLike | null;
  appInstalledCount: number;
};

export type InstallObserverStore = Readable<InstallObserverSnapshot> & {
  clearPromptEvent: () => void;
};

type InstallObserverEventTarget = {
  addEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
  removeEventListener: (type: string, listener: EventListenerOrEventListenerObject) => void;
};

type InstallObserverEnvironment = {
  eventTarget: InstallObserverEventTarget | null;
  userAgent: string | null;
};

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

function initialInstallObserverSnapshot(
  userAgent: string | null,
): InstallObserverSnapshot {
  if (userAgent != null) {
    return {
      platform: detectInstallPlatform(userAgent),
      promptEvent: null,
      appInstalledCount: 0,
    };
  }
  return {
    platform: "desktop",
    promptEvent: null,
    appInstalledCount: 0,
  };
}

function defaultInstallObserverEnvironment(): InstallObserverEnvironment {
  return {
    eventTarget: typeof window === "undefined" ? null : window,
    userAgent: typeof navigator === "undefined" ? null : navigator.userAgent,
  };
}

export function createInstallObserverStore(
  environment: InstallObserverEnvironment = defaultInstallObserverEnvironment(),
): InstallObserverStore {
  const store = writable<InstallObserverSnapshot>(
    initialInstallObserverSnapshot(environment.userAgent),
    (set, update) => {
      set(initialInstallObserverSnapshot(environment.userAgent));
      if (environment.eventTarget == null) return;

      const onBeforeInstallPrompt = (event: Event): void => {
        const promptEvent = event as BeforeInstallPromptEventLike;
        event.preventDefault();
        update((state) => ({ ...state, promptEvent }));
      };

      const onAppInstalled = (): void => {
        update((state) => ({
          ...state,
          promptEvent: null,
          appInstalledCount: state.appInstalledCount + 1,
        }));
      };

      environment.eventTarget.addEventListener(
        "beforeinstallprompt",
        onBeforeInstallPrompt,
      );
      environment.eventTarget.addEventListener("appinstalled", onAppInstalled);

      return () => {
        environment.eventTarget?.removeEventListener(
          "beforeinstallprompt",
          onBeforeInstallPrompt,
        );
        environment.eventTarget?.removeEventListener(
          "appinstalled",
          onAppInstalled,
        );
      };
    },
  );

  return {
    subscribe: store.subscribe,
    clearPromptEvent: (): void => {
      store.update((state) => ({ ...state, promptEvent: null }));
    },
  };
}

export const installObserver = createInstallObserverStore();
