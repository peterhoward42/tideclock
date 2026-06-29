/**
 * Imperative DOM helpers for the home-route tide diagram host (injected SVG).
 * Keeps menu trigger lookup, flyout anchor math, and dev-only diagram presentation in one place.
 */

export function queryMenuTriggerGroup(
  diagramHost: HTMLElement,
): SVGGElement | null {
  return diagramHost.querySelector('svg g[data-name="HomeMenuTrigger"]');
}

export function queryShareTriggerGroup(
  diagramHost: HTMLElement,
): SVGGElement | null {
  return diagramHost.querySelector('svg g[data-name="HomeShareTrigger"]');
}

export function queryLocationTriggerGroup(
  diagramHost: HTMLElement,
): SVGGElement | null {
  return diagramHost.querySelector('svg g[data-name="HomeLocationTrigger"]');
}

/** Optional layout for tests; production uses the browser viewport. */
export type MenuPanelAnchorOptions = {
  /** Defaults to `window.innerHeight` when available. */
  viewInnerHeight?: number;
  /**
   * Min distance (px) the menu’s top should stay below the layout viewport’s top, after the
   * 8px gap above the trigger (see anchor math). Defaults to 8.
   */
  topGutterPx?: number;
};

function readViewInnerHeight(fallback: number, override?: number): number {
  if (typeof override === "number" && Number.isFinite(override)) {
    return override;
  }
  if (
    typeof globalThis !== "undefined" &&
    "innerHeight" in globalThis &&
    typeof (globalThis as { innerHeight?: number }).innerHeight === "number"
  ) {
    return (globalThis as { innerHeight: number }).innerHeight;
  }
  return fallback;
}

/**
 * CSS for absolutely positioning the home-route menu flyout.
 * Positioning context is the diagram host (`.home-panel`), not the instrument `figure` —
 * the flyout is a sibling of the figure so it is not clipped by `overflow: hidden` on the figure.
 *
 * The panel is bottom-anchored and grows upward. Horizontally it is **right-aligned** to the
 * trigger (with a 4px inset) so the flyout expands **left** from the menu link on the diagram’s
 * bottom-right. `80dvh` alone can be taller than the space
 * from the viewport top to the menu’s bottom, so the top is clipped. We set `max-height` to
 * `min(80dvh, <px>)` where that px caps height so the top stays in view. Re-run when the open
 * menu’s height or layout may change (e.g. install block toggled).
 */
export function computeMenuPanelAnchorStyle(
  diagramHost: HTMLElement,
  trigger: SVGGElement,
  options?: MenuPanelAnchorOptions,
): string {
  const panelRect = diagramHost.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const right = Math.max(0, panelRect.right - triggerRect.right + 4);
  // Anchor just above the trigger (8px gap), measured from the host bottom edge.
  const bottom = Math.max(0, panelRect.bottom - triggerRect.bottom + 8);
  const topGutter = options?.topGutterPx ?? 8;
  const ih = readViewInnerHeight(900, options?.viewInnerHeight);
  // Bottom edge of the menu in viewport y (down-positive): `triggerRect.bottom - 8` (same as
  // host-local `bottom` math). Do not let max-height exceed room above that line minus gutter.
  const availableFromTop = Math.max(0, triggerRect.bottom - 8 - topGutter);
  const capFromViewport = Math.min(0.8 * ih, availableFromTop);
  const maxHeightPx = Math.max(0, Math.floor(capFromViewport));
  return `right: ${right}px; bottom: ${bottom}px; max-height: min(80dvh, ${maxHeightPx}px);`;
}

export function scheduleDiagramDevPresentation(
  diagramHostEl: HTMLElement,
  options: { outlineEnabled: boolean; onAfterPaint?: () => void },
): void {
  queueMicrotask(() => {
    requestAnimationFrame(() => {
      const host = diagramHostEl;
      const svg = host.querySelector("svg") as SVGSVGElement | null;
      if (svg == null) return;

      svg.style.transformOrigin = "50% 50%";
      svg.style.transform = "scale(1)";

      if (options.outlineEnabled) {
        svg.style.outline = "2px solid rgba(255,0,0,0.6)";
        svg.style.background = "rgba(255,0,0,0.06)";
      } else {
        svg.style.outline = "";
        svg.style.background = "";
      }

      options.onAfterPaint?.();
    });
  });
}
