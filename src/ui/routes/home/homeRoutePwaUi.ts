/**
 * PWA “App display / keep awake” UI state: user preference, live home-route wake line, and status copy.
 */
import { get, writable, type Readable } from "svelte/store";
import { isWakeLockApiSupported } from "./homeRouteWakeLockSupport";
import {
  readKeepScreenAwakeUserEnabled,
  writeKeepScreenAwakeUserEnabled,
} from "./homeRoutePwaPreferences";
import type { HomeWakeLockPresentation } from "./homeRouteWakeLockPresentation";

const storage: Storage | null =
  typeof globalThis !== "undefined" &&
  typeof (globalThis as unknown as { localStorage?: Storage }).localStorage !== "undefined"
    ? (globalThis as unknown as { localStorage: Storage }).localStorage
    : null;

function readInitialUserEnabled(): boolean {
  if (storage === null) return false;
  return readKeepScreenAwakeUserEnabled(storage);
}

/** User intent: when true, the home tide view should request a screen wake lock when foregrounded. */
const keepScreenAwakeUserEnabled = writable(readInitialUserEnabled());

export const keepScreenAwakeUserEnabledStore: Readable<boolean> = {
  subscribe: keepScreenAwakeUserEnabled.subscribe,
};

export function getKeepScreenAwakeUserEnabled(): boolean {
  return get(keepScreenAwakeUserEnabled);
}

export function setKeepScreenAwakeUserEnabled(next: boolean): void {
  keepScreenAwakeUserEnabled.set(next);
  if (storage !== null) {
    writeKeepScreenAwakeUserEnabled(storage, next);
  }
}

/** Set only while {@link mountHomeRouteScreenWakeLock} is mounted; otherwise null. */
const tideViewWakePresentation = writable<HomeWakeLockPresentation | null>(null);

export const tideViewWakePresentationStore: Readable<HomeWakeLockPresentation | null> = {
  subscribe: tideViewWakePresentation.subscribe,
};

export function setTideViewWakePresentation(
  value: HomeWakeLockPresentation | null,
): void {
  tideViewWakePresentation.set(value);
}

export function isWakeLockApiSupportedRuntime(): boolean {
  return isWakeLockApiSupported();
}

/**
 * One-line status for menus and the setup panel (route-aware: when not on home, lock cannot be live).
 */
export function formatPwaWakeStatusLine(
  isHomeRoute: boolean,
  userWants: boolean,
  homePresentation: HomeWakeLockPresentation | null,
): string {
  if (!isWakeLockApiSupported()) {
    return "Keep screen awake is not supported in this browser.";
  }
  if (!userWants) {
    return "Keep screen awake is off.";
  }
  if (!isHomeRoute) {
    return "On: open the home tide view to keep the screen from sleeping.";
  }
  if (homePresentation === null) {
    return "Waking: requesting screen lock…";
  }
  if (homePresentation.kind === "not_supported") {
    return "Keep screen awake is not supported in this browser.";
  }
  if (homePresentation.kind === "active") {
    return "Screen stays awake while this view is open and visible.";
  }
  switch (homePresentation.reason) {
    case "user_off":
      return "Keep screen awake is off.";
    case "background":
      return "Paused: screen sleep prevention resumes when you return to this tab.";
    case "request_failed":
      return "Could not request wake lock. The OS or browser may be limiting it.";
  }
}
