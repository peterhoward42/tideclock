/**
 * Wires pointer listeners to the HomeLocationTrigger group inside injected diagram SVG.
 * Call from a single reactive owner; returns cleanup to run on teardown or before re-wire.
 */

import { queryLocationTriggerGroup } from "./diagramDom";

export type LocationSvgTriggerHandles = {
  readonly getDiagramHost: () => HTMLElement | undefined;
  readonly onLocationClick: () => void | Promise<void>;
  /** Run after Svelte has flushed DOM (e.g. pass `() => void tick().then(fn)` from the route). */
  readonly scheduleAfterDomReady: (fn: () => void) => void;
};

/**
 * Attaches to `HomeLocationTrigger` after the next frame(s) once SVG exists under the diagram host.
 */
export function mountLocationSvgTriggerWire(
  handles: LocationSvgTriggerHandles,
): () => void {
  let cancelled = false;
  let rafId = 0;
  let wiredTrigger: SVGGElement | null = null;

  const detach = (): void => {
    if (wiredTrigger == null) return;
    const trigger = wiredTrigger;
    trigger.classList.remove("home-location-trigger--hover");
    trigger.style.cursor = "";
    trigger.removeEventListener("pointerenter", onEnter);
    trigger.removeEventListener("pointerleave", onLeave);
    trigger.removeEventListener("click", onClick);
    wiredTrigger = null;
  };

  const onEnter = (): void => {
    wiredTrigger?.classList.add("home-location-trigger--hover");
  };
  const onLeave = (): void => {
    wiredTrigger?.classList.remove("home-location-trigger--hover");
  };
  const onClick = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    void handles.onLocationClick();
  };

  const MAX_ATTACH_FRAMES = 45;
  let frames = 0;

  const tryWireTrigger = (): void => {
    if (cancelled) return;
    const host = handles.getDiagramHost();
    if (host == null) return;
    const trigger = queryLocationTriggerGroup(host);
    if (trigger == null) {
      frames += 1;
      if (frames < MAX_ATTACH_FRAMES) {
        rafId = requestAnimationFrame(tryWireTrigger);
      }
      return;
    }
    detach();
    wiredTrigger = trigger;
    trigger.style.cursor = "pointer";
    trigger.addEventListener("pointerenter", onEnter);
    trigger.addEventListener("pointerleave", onLeave);
    trigger.addEventListener("click", onClick);
  };

  handles.scheduleAfterDomReady(() => {
    if (cancelled) return;
    frames = 0;
    rafId = requestAnimationFrame(tryWireTrigger);
  });

  return () => {
    cancelled = true;
    cancelAnimationFrame(rafId);
    detach();
  };
}
