/**
 * Keep-screen-awake preference persisted in `localStorage`.
 */

const KEEP_SCREEN_AWAKE_KEY = "tideclock.keepScreenAwake";

export function readKeepAwakeEnabled(storage: Storage): boolean {
  try {
    return storage.getItem(KEEP_SCREEN_AWAKE_KEY) === "1";
  } catch {
    return false;
  }
}

export function writeKeepAwakeEnabled(storage: Storage, enabled: boolean): void {
  try {
    if (enabled) {
      storage.setItem(KEEP_SCREEN_AWAKE_KEY, "1");
    } else {
      storage.removeItem(KEEP_SCREEN_AWAKE_KEY);
    }
  } catch {
    // ignore quota / private mode
  }
}
