/**
 * Home-route orientation lock: best-effort, standalone-only landscape request.
 * This is progressive enhancement and must fail silently when unavailable.
 */

import { isStandaloneDisplayMode } from "./pwaDisplayMode";

type ScreenOrientationApi = {
  lock?: (orientation: OrientationLockType) => Promise<void>;
  unlock?: () => void;
};

function getScreenOrientation(): ScreenOrientationApi | null {
  const runtime = globalThis as typeof globalThis & {
    screen?: { orientation?: ScreenOrientationApi };
  };
  return runtime.screen?.orientation ?? null;
}

function getLandscapeLock(): ((orientation: OrientationLockType) => Promise<void>) | null {
  const orientation = getScreenOrientation();
  if (!orientation?.lock) return null;
  return orientation.lock.bind(orientation);
}

/**
 * Attempts `screen.orientation.lock('landscape')` only when installed/standalone.
 * No-ops for unsupported browsers and silently ignores runtime rejection.
 */
export async function requestLandscapeOrientationLock(): Promise<void> {
  if (!isStandaloneDisplayMode()) return;
  const lock = getLandscapeLock();
  if (lock === null) return;
  try {
    await lock("landscape");
  } catch {
    // Silent by design: this API frequently rejects on unsupported devices/contexts.
  }
}

/**
 * Releases a prior `lock()` so the user can rotate (e.g. installed app on the location route,
 * which needs portrait on phones). Silent when unsupported or nothing is locked.
 */
export function requestOrientationUnlock(): void {
  const orientation = getScreenOrientation();
  if (typeof orientation?.unlock !== "function") return;
  try {
    orientation.unlock();
  } catch {
    // Silent by design.
  }
}

/**
 * Registers one-shot user gesture listeners on the home route root.
 * The first interaction inside the route triggers a single lock attempt.
 */
export function mountOrientationLock(root: HTMLElement): () => void {
  let attempted = false;
  const runtime = globalThis as typeof globalThis & {
    addEventListener?: (type: string, listener: EventListener) => void;
    removeEventListener?: (type: string, listener: EventListener) => void;
  };

  const requestOnceIfInside = (event: Event): void => {
    if (attempted) return;
    const target = event.target as Node | null;
    if (!root.contains(target)) return;
    attempted = true;
    teardown();
    void requestLandscapeOrientationLock();
  };

  const onPointerDown = (event: PointerEvent): void => requestOnceIfInside(event);
  const onKeyDown = (event: KeyboardEvent): void => requestOnceIfInside(event);

  runtime.addEventListener?.("pointerdown", onPointerDown);
  runtime.addEventListener?.("keydown", onKeyDown);

  function teardown(): void {
    runtime.removeEventListener?.("pointerdown", onPointerDown);
    runtime.removeEventListener?.("keydown", onKeyDown);
  }

  return teardown;
}
