/**
 * Home-route screen wake lock: keep the display awake while this route is mounted, the
 * document is visible, and the user has opted in. Progressive enhancement only.
 */

import type { HomeWakeLockPresentation } from "./homeRouteWakeLockPresentation";
import { isWakeLockApiSupported } from "./homeRouteWakeLockSupport";

export type { HomeWakeLockPresentation } from "./homeRouteWakeLockPresentation";

const LOG_PREFIX = "[home wake-lock]";

function debugLog(message: string, detail?: unknown): void {
  if (detail === undefined) {
    console.debug(LOG_PREFIX, message);
    return;
  }
  console.debug(LOG_PREFIX, message, detail);
}

type MountOptions = {
  shouldRequestLock: () => boolean;
  onPresentationChange: (p: HomeWakeLockPresentation) => void;
};

/**
 * Subscribes to visibility and, when the user has opted in, holds a `'screen'` wake lock while
 * the tab is foregrounded. Call `sync` after `shouldRequestLock` may have changed.
 */
export function mountHomeRouteScreenWakeLock(
  options: MountOptions,
): { dispose: () => void; sync: () => void } {
  const { shouldRequestLock, onPresentationChange } = options;
  const apiOk = isWakeLockApiSupported();
  let sentinel: WakeLockSentinel | undefined;
  let disposed = false;

  const report = (p: HomeWakeLockPresentation): void => {
    if (disposed) return;
    onPresentationChange(p);
  };

  const releaseNow = async (): Promise<void> => {
    if (!sentinel) return;
    const held = sentinel;
    sentinel = undefined;
    try {
      await held.release();
      debugLog("WakeLock.release() completed");
    } catch (err) {
      debugLog("release threw", err);
    }
  };

  const reconcile = async (): Promise<void> => {
    if (disposed) return;

    if (!apiOk) {
      await releaseNow();
      report({ kind: "not_supported" });
      return;
    }

    if (!shouldRequestLock()) {
      await releaseNow();
      report({ kind: "inactive", reason: "user_off" });
      return;
    }

    if (document.visibilityState !== "visible") {
      await releaseNow();
      report({ kind: "inactive", reason: "background" });
      return;
    }

    const wakeLock = navigator.wakeLock;
    if (!wakeLock?.request) {
      report({ kind: "not_supported" });
      return;
    }

    await releaseNow();

    try {
      const acquired = await wakeLock.request("screen");
      if (disposed) {
        debugLog("WakeLock.request('screen') resolved after teardown; releasing stray sentinel");
        try {
          await acquired.release();
        } catch (err) {
          debugLog("release after dispose threw", err);
        }
        return;
      }

      sentinel = acquired;
      debugLog("WakeLock.request('screen') resolved; hold active");
      report({ kind: "active" });
      acquired.addEventListener("release", () => {
        if (sentinel === acquired) sentinel = undefined;
        debugLog("sentinel released (platform or navigation)");
        if (disposed) return;
        void reconcile();
      });
    } catch (err) {
      debugLog("request('screen') failed", err);
      report({ kind: "inactive", reason: "request_failed" });
    }
  };

  const onVisibilityChange = (): void => {
    if (disposed) return;
    if (document.visibilityState === "hidden") {
      debugLog("document hidden; calling WakeLock.release()");
    } else {
      debugLog("document visible; reconciling wake lock");
    }
    void reconcile();
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  void reconcile();

  const sync = (): void => {
    void reconcile();
  };

  return {
    sync,
    dispose: () => {
      disposed = true;
      document.removeEventListener("visibilitychange", onVisibilityChange);
      debugLog("home route unmount; calling WakeLock.release()");
      void releaseNow();
    },
  };
}
