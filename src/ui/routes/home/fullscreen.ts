/**
 * Home-route fullscreen helpers.
 * Progressive enhancement only: failures are swallowed and layout stays unchanged.
 */

type FullscreenDocument = Document & {
  webkitFullscreenElement?: Element | null;
  webkitExitFullscreen?: () => Promise<void> | void;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
};

function activeFullscreenElement(doc: FullscreenDocument): Element | null {
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? null;
}

function supportsFullscreenRequest(el: FullscreenElement): boolean {
  return typeof el.requestFullscreen === "function" || typeof el.webkitRequestFullscreen === "function";
}

/**
 * Best-effort fullscreen request on the provided instrument element.
 * Must be called from a user gesture to succeed on most platforms.
 */
export async function requestInstrumentFullscreen(el: HTMLElement): Promise<void> {
  const target = el as FullscreenElement;
  if (typeof document === "undefined") return;
  if (!supportsFullscreenRequest(target)) return;
  try {
    if (typeof target.requestFullscreen === "function") {
      await target.requestFullscreen();
      return;
    }
    await target.webkitRequestFullscreen?.();
  } catch {
    // Silent by design: browser support and permission rules vary by platform.
  }
}

/**
 * Best-effort exit from fullscreen.
 */
export async function exitInstrumentFullscreen(): Promise<void> {
  if (typeof document === "undefined") return;
  const doc = document as FullscreenDocument;
  if (activeFullscreenElement(doc) == null) return;
  try {
    if (typeof doc.exitFullscreen === "function") {
      await doc.exitFullscreen();
      return;
    }
    await doc.webkitExitFullscreen?.();
  } catch {
    // Silent by design.
  }
}

/**
 * Resolves the DOM node to pass to `toggleInstrumentFullscreen` on the home route.
 * Must be the diagram host (`.home-panel--diagram-host`), which wraps both the
 * `figure.home-instrument` and the menu flyout. The flyout is a *sibling* of the figure
 * (so it is not clipped by `overflow: hidden`). The Fullscreen API only paints the
 * fullscreen element and its descendants in the top layer—fullscreening the figure
 * alone would leave the menu behind that layer (regression: fullscreen + diagram-host target).
 */
export function getDiagramFullscreenTarget(
  diagramHost: HTMLElement | undefined,
): HTMLElement | null {
  return diagramHost ?? null;
}

/**
 * Toggles fullscreen state for the instrument element.
 */
export async function toggleInstrumentFullscreen(el: HTMLElement): Promise<void> {
  if (typeof document === "undefined") return;
  const doc = document as FullscreenDocument;
  if (activeFullscreenElement(doc) == null) {
    await requestInstrumentFullscreen(el);
    return;
  }
  await exitInstrumentFullscreen();
}
