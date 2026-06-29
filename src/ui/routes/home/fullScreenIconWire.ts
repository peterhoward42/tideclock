/**
 * Wires pointer listeners to the FullScreenIcon group inside injected diagram SVG.
 */

import { queryFullScreenIconGroup } from "./instrumentIconAppearance";

export type FullScreenIconWireHandles = {
  readonly getDiagramHost: () => HTMLElement | undefined;
  readonly onToggle: () => void | Promise<void>;
  readonly scheduleAfterDomReady: (fn: () => void) => void;
};

export function mountFullScreenIconWire(
  handles: FullScreenIconWireHandles,
): () => void {
  let cancelled = false;
  let rafId = 0;
  let wiredIcon: SVGGElement | null = null;

  const detach = (): void => {
    if (wiredIcon == null) return;
    const icon = wiredIcon;
    icon.classList.remove("fullscreen-icon--hover");
    icon.style.cursor = "";
    icon.removeEventListener("pointerenter", onEnter);
    icon.removeEventListener("pointerleave", onLeave);
    icon.removeEventListener("click", onClick);
    wiredIcon = null;
  };

  const onEnter = (): void => {
    wiredIcon?.classList.add("fullscreen-icon--hover");
  };
  const onLeave = (): void => {
    wiredIcon?.classList.remove("fullscreen-icon--hover");
  };
  const onClick = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    void handles.onToggle();
  };

  const MAX_ATTACH_FRAMES = 45;
  let frames = 0;

  const tryWire = (): void => {
    if (cancelled) return;
    const host = handles.getDiagramHost();
    if (host == null) return;
    const icon = queryFullScreenIconGroup(host);
    if (icon == null) {
      frames += 1;
      if (frames < MAX_ATTACH_FRAMES) {
        rafId = requestAnimationFrame(tryWire);
      }
      return;
    }
    detach();
    wiredIcon = icon;
    icon.style.cursor = "pointer";
    icon.addEventListener("pointerenter", onEnter);
    icon.addEventListener("pointerleave", onLeave);
    icon.addEventListener("click", onClick);
  };

  handles.scheduleAfterDomReady(() => {
    if (cancelled) return;
    frames = 0;
    rafId = requestAnimationFrame(tryWire);
  });

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    detach();
  };
}
