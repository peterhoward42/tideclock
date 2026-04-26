/**
 * Imperative DOM helpers for the home-route tide diagram host (injected SVG).
 * Keeps query selectors and paint scheduling in one place so Home.svelte effects stay thin.
 */

import {
  localCanonicalTimeNowFromMs,
  localTimeNowDatePrefixFromMs,
} from "../../../application/localWallClockReadoutFromMs";

/** Patch live clock text inside injected SVG; host must contain the current diagram. */
export function patchTimeNowReadoutInDiagramHost(
  host: HTMLElement,
  ms: number,
): void {
  const canonical = localCanonicalTimeNowFromMs(ms);
  const datePrefix = localTimeNowDatePrefixFromMs(ms);
  const dateEl = host.querySelector(
    'svg g[data-name="TimeNowDate"] text',
  ) as SVGTextElement | null;
  const hhmmEl = host.querySelector(
    'svg g[data-name="TimeNowLabelHms"] text',
  ) as SVGTextElement | null;
  const colonEl = host.querySelector(
    'svg g[data-name="TimeNowLabelSecondsColon"] text',
  ) as SVGTextElement | null;
  const secEl = host.querySelector(
    'svg g[data-name="TimeNowLabelSeconds"] text',
  ) as SVGTextElement | null;
  if (dateEl !== null) dateEl.textContent = datePrefix;
  if (hhmmEl !== null) hhmmEl.textContent = canonical.slice(0, 5);
  if (colonEl !== null) colonEl.textContent = canonical.slice(5, 6);
  if (secEl !== null) secEl.textContent = canonical.slice(6);
}

export function queryHomeMenuTriggerGroupFromDiagramHost(
  diagramHost: HTMLElement,
): SVGGElement | null {
  return diagramHost.querySelector('svg g[data-name="HomeMenuTrigger"]');
}

/**
 * CSS for absolutely positioning the home-route menu flyout.
 * Positioning context is the diagram host (`.home-panel`), not the instrument `figure` —
 * the flyout is a sibling of the figure so it is not clipped by `overflow: hidden` on the figure.
 * Re-call when open menu height or layout may change (e.g. install block toggled).
 */
export function computeHomeMenuPanelAnchorStyle(
  diagramHost: HTMLElement,
  trigger: SVGGElement,
): string {
  const panelRect = diagramHost.getBoundingClientRect();
  const triggerRect = trigger.getBoundingClientRect();
  const left = Math.max(0, triggerRect.left - panelRect.left);
  // Anchor just above the trigger (8px gap), measured from the host bottom edge.
  const bottom = Math.max(0, panelRect.bottom - triggerRect.bottom + 8);
  return `left: ${left}px; bottom: ${bottom}px;`;
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
