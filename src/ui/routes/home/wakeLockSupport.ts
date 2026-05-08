/**
 * Whether the runtime exposes the Screen Wake Lock API (`navigator.wakeLock.request`).
 */

export function isWakeLockApiSupported(): boolean {
  if (typeof navigator === "undefined") return false;
  return Boolean(navigator.wakeLock?.request);
}
