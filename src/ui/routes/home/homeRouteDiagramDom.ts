/**
 * Imperative DOM helpers for the home-route tide diagram host (injected SVG).
 * Keeps query selectors and paint scheduling in one place so Home.svelte effects stay thin.
 */

import {
  localCanonicalTimeNowFromMs,
  localBlhcDatePrefixFromMs,
} from "../../../application/localWallClockReadoutFromMs";

/**
 * Patch live clock text inside injected SVG; host must contain the current diagram.
 * Callers subscribe to `nowMs` (~1 Hz) so **BLHCBundle** text and **HandArmTimeLabel** stay in sync.
 */
export function patchBlhcBundleInDiagramHost(
  host: HTMLElement,
  ms: number,
): void {
  const canonical = localCanonicalTimeNowFromMs(ms);
  const datePrefix = localBlhcDatePrefixFromMs(ms);
  const dateEl = host.querySelector(
    'svg g[data-name="BLHCDate"] text',
  ) as SVGTextElement | null;
  const hhmmEl = host.querySelector(
    'svg g[data-name="BLHCLabelHms"] text',
  ) as SVGTextElement | null;
  const colonEl = host.querySelector(
    'svg g[data-name="BLHCLabelSecondsColon"] text',
  ) as SVGTextElement | null;
  const secEl = host.querySelector(
    'svg g[data-name="BLHCLabelSeconds"] text',
  ) as SVGTextElement | null;
  const handArmTimeEl = host.querySelector(
    'svg g[data-name="HandArmTimeLabel"] text',
  ) as SVGTextElement | null;
  if (dateEl !== null) dateEl.textContent = datePrefix;
  if (hhmmEl !== null) hhmmEl.textContent = canonical.slice(0, 5);
  if (colonEl !== null) colonEl.textContent = canonical.slice(5, 6);
  if (secEl !== null) secEl.textContent = canonical.slice(6);
  if (handArmTimeEl !== null) handArmTimeEl.textContent = canonical;
}

export function queryHomeMenuTriggerGroupFromDiagramHost(
  diagramHost: HTMLElement,
): SVGGElement | null {
  return diagramHost.querySelector('svg g[data-name="HomeMenuTrigger"]');
}

/** Optional layout for tests; production uses the browser viewport. */
export type HomeMenuPanelAnchorOptions = {
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
 * The panel is bottom-anchored and grows upward. `80dvh` alone can be taller than the space
 * from the viewport top to the menu’s bottom, so the top is clipped. We set `max-height` to
 * `min(80dvh, <px>)` where that px caps height so the top stays in view. Re-run when the open
 * menu’s height or layout may change (e.g. install block toggled).
 */
export function computeHomeMenuPanelAnchorStyle(
  diagramHost: HTMLElement,
  trigger: SVGGElement,
  options?: HomeMenuPanelAnchorOptions,
): string {
  const panelRect = diagramHost.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const left = Math.max(0, triggerRect.left - panelRect.left);
  // Anchor just above the trigger (8px gap), measured from the host bottom edge.
  const bottom = Math.max(0, panelRect.bottom - triggerRect.bottom + 8);
  const topGutter = options?.topGutterPx ?? 8;
  const ih = readViewInnerHeight(900, options?.viewInnerHeight);
  // Bottom edge of the menu in viewport y (down-positive): `triggerRect.bottom - 8` (same as
  // host-local `bottom` math). Do not let max-height exceed room above that line minus gutter.
  const availableFromTop = Math.max(0, triggerRect.bottom - 8 - topGutter);
  const capFromViewport = Math.min(0.8 * ih, availableFromTop);
  const maxHeightPx = Math.max(0, Math.floor(capFromViewport));
  return `left: ${left}px; bottom: ${bottom}px; max-height: min(80dvh, ${maxHeightPx}px);`;
}

export function scheduleDiagramHostSvgDevPresentation(
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
