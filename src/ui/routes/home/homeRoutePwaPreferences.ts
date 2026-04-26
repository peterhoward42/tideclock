/**
 * PWA home-route preferences persisted in `localStorage`.
 */

const V1 = {
  keepScreenAwake: "tideclock.pwa.v1.keepScreenAwake",
  standaloneSetupHiddenForever: "tideclock.pwa.v1.standaloneSetupHiddenForever",
} as const;

const SESSION_STANDALONE_SETUP_DISMISSED = "tideclock.pwa.v1.standaloneSetupDismissedThisSession";

export function readKeepScreenAwakeUserEnabled(storage: Storage): boolean {
  try {
    return storage.getItem(V1.keepScreenAwake) === "1";
  } catch {
    return false;
  }
}

export function writeKeepScreenAwakeUserEnabled(storage: Storage, enabled: boolean): void {
  try {
    if (enabled) {
      storage.setItem(V1.keepScreenAwake, "1");
    } else {
      storage.removeItem(V1.keepScreenAwake);
    }
  } catch {
    // ignore quota / private mode
  }
}

export function readStandaloneSetupHiddenForever(storage: Storage): boolean {
  try {
    return storage.getItem(V1.standaloneSetupHiddenForever) === "1";
  } catch {
    return false;
  }
}

export function writeStandaloneSetupHiddenForever(storage: Storage): void {
  try {
    storage.setItem(V1.standaloneSetupHiddenForever, "1");
  } catch {
    // ignore
  }
}

function sessionStore(): Storage | null {
  if (typeof globalThis === "undefined") return null;
  const s = (globalThis as unknown as { sessionStorage?: Storage }).sessionStorage;
  if (s === undefined) return null;
  try {
    return s;
  } catch {
    return null;
  }
}

export function readStandaloneSetupDismissedThisSession(): boolean {
  const s = sessionStore();
  if (s === null) return false;
  try {
    return s.getItem(SESSION_STANDALONE_SETUP_DISMISSED) === "1";
  } catch {
    return false;
  }
}

export function writeStandaloneSetupDismissedThisSession(): void {
  const s = sessionStore();
  if (s === null) return;
  try {
    s.setItem(SESSION_STANDALONE_SETUP_DISMISSED, "1");
  } catch {
    // ignore
  }
}

export function clearStandaloneSetupSessionDismissal(): void {
  const s = sessionStore();
  if (s === null) return;
  try {
    s.removeItem(SESSION_STANDALONE_SETUP_DISMISSED);
  } catch {
    // ignore
  }
}

export function clearStandaloneSetupHiddenForeverIn(storage: Storage): void {
  try {
    storage.removeItem(V1.standaloneSetupHiddenForever);
  } catch {
    // ignore
  }
}
