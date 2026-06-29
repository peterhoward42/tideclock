/**
 * Syncs on/off glyph visibility and accessibility on diagram instrument icon groups.
 */

import { isWakeLockApiSupported } from "./wakeLockSupport";
import {
  fullScreenIconAriaLabel,
  keepAwakeIconAriaLabel,
} from "./instrumentIconAria";

export function queryFullScreenIconGroup(
  diagramHost: HTMLElement,
): SVGGElement | null {
  return diagramHost.querySelector('svg g[data-name="FullScreenIcon"]');
}

export function queryKeepAwakeIconGroup(
  diagramHost: HTMLElement,
): SVGGElement | null {
  return diagramHost.querySelector('svg g[data-name="KeepAwakeIcon"]');
}

export function queryKeepAwakeIconControlGroup(
  diagramHost: HTMLElement,
): SVGGElement | null {
  return diagramHost.querySelector('svg g[data-name="KeepAwakeIcon.Control"]');
}

export function syncFullScreenIconAppearance(
  diagramHost: HTMLElement | undefined,
  active: boolean,
): void {
  if (diagramHost == null) return;
  const icon = queryFullScreenIconGroup(diagramHost);
  if (icon == null) return;
  icon.classList.toggle("fullscreen-icon--active", active);
  icon.setAttribute("role", "button");
  icon.setAttribute("aria-label", fullScreenIconAriaLabel(active));
}

export function syncKeepAwakeIconAppearance(
  diagramHost: HTMLElement | undefined,
  userWants: boolean,
): void {
  if (diagramHost == null) return;
  const icon = queryKeepAwakeIconGroup(diagramHost);
  if (icon == null) return;
  const supported = isWakeLockApiSupported();
  icon.style.display = supported ? "" : "none";
  if (!supported) return;
  icon.classList.toggle("keep-awake-icon--active", userWants);
  const control = queryKeepAwakeIconControlGroup(diagramHost);
  if (control == null) return;
  control.setAttribute("role", "checkbox");
  control.setAttribute("aria-checked", userWants ? "true" : "false");
  control.setAttribute("aria-label", keepAwakeIconAriaLabel(userWants));
}
