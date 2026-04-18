/**
 * Home-route screen wake lock: keep the display awake while this route is mounted and the
 * document is visible. Progressive enhancement only — failures are console-debug only.
 */

const LOG_PREFIX = "[home wake-lock]";

function debugLog(message: string, detail?: unknown): void {
  if (detail === undefined) {
    console.debug(LOG_PREFIX, message);
    return;
  }
  console.debug(LOG_PREFIX, message, detail);
}

/**
 * Subscribes to visibility and holds a `'screen'` wake lock when the tab is foregrounded.
 * Releases on `visibilityState === 'hidden'` and when the returned disposer runs (route teardown).
 */
export function mountHomeRouteScreenWakeLock(): () => void {
  let sentinel: WakeLockSentinel | undefined;
  let disposed = false;

  const releaseNow = async (): Promise<void> => {
    if (!sentinel) return;
    const held = sentinel;
    sentinel = undefined;
    try {
      await held.release();
    } catch (err) {
      debugLog("release threw", err);
    }
  };

  const scheduleAcquire = (): void => {
    if (disposed || document.visibilityState !== "visible") return;
    void obtainLock();
  };

  const obtainLock = async (): Promise<void> => {
    if (disposed || document.visibilityState !== "visible") return;

    const wakeLock = navigator.wakeLock;
    if (!wakeLock?.request) {
      debugLog("Wake Lock API not available");
      return;
    }

    await releaseNow();

    try {
      const acquired = await wakeLock.request("screen");
      if (disposed) {
        try {
          await acquired.release();
        } catch (err) {
          debugLog("release after dispose threw", err);
        }
        return;
      }

      sentinel = acquired;
      acquired.addEventListener("release", () => {
        if (sentinel === acquired) sentinel = undefined;
        debugLog("sentinel released");
        if (!disposed && document.visibilityState === "visible") {
          queueMicrotask(() => scheduleAcquire());
        }
      });
    } catch (err) {
      debugLog("request('screen') failed", err);
    }
  };

  const onVisibilityChange = (): void => {
    if (document.visibilityState === "hidden") {
      void releaseNow();
      return;
    }
    scheduleAcquire();
  };

  document.addEventListener("visibilitychange", onVisibilityChange);
  scheduleAcquire();

  return () => {
    disposed = true;
    document.removeEventListener("visibilitychange", onVisibilityChange);
    void releaseNow();
  };
}
