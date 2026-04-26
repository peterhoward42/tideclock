/**
 * PWA / installed-app display detection (standalone window vs browser tab).
 */

type NavigatorWithStandalone = Navigator & { standalone?: boolean };

/** True for installed PWA (display-mode) or iOS "Add to Home Screen" (legacy standalone flag). */
export function isStandaloneDisplayMode(): boolean {
  const runtime = globalThis as typeof globalThis & {
    matchMedia?: (query: string) => { matches: boolean };
    navigator?: NavigatorWithStandalone;
  };
  if (runtime.matchMedia?.("(display-mode: standalone)").matches) return true;
  return runtime.navigator?.standalone === true;
}
