/**
 * Keep-screen-awake UI state: persisted user preference for the home-route diagram icon.
 */
import { get, writable, type Readable } from "svelte/store";
import {
  readKeepAwakeEnabled,
  writeKeepAwakeEnabled,
} from "./keepAwakePreferences";
import { trackProductEvent } from "../../../infrastructure/analytics/trackProductEvent";

const storage: Storage | null =
  typeof globalThis !== "undefined" &&
  typeof (globalThis as unknown as { localStorage?: Storage }).localStorage !== "undefined"
    ? (globalThis as unknown as { localStorage: Storage }).localStorage
    : null;

function readInitialUserEnabled(): boolean {
  if (storage === null) return false;
  return readKeepAwakeEnabled(storage);
}

/** User intent: when true, the home tide view should request a screen wake lock when foregrounded. */
const keepAwakeUser = writable(readInitialUserEnabled());

export const keepAwakeUserStore: Readable<boolean> = {
  subscribe: keepAwakeUser.subscribe,
};

export function getKeepAwakeUserEnabled(): boolean {
  return get(keepAwakeUser);
}

export function setKeepAwakeUserEnabled(next: boolean): void {
  const wasEnabled = get(keepAwakeUser);
  keepAwakeUser.set(next);
  if (next && !wasEnabled) {
    trackProductEvent("used_screen_awake");
  }
  if (storage !== null) {
    writeKeepAwakeEnabled(storage, next);
  }
}
