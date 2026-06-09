/**
 * Wires pointer listeners to the HomeShareTrigger group inside injected diagram SVG.
 * Call from a single reactive owner; returns cleanup to run on teardown or before re-wire.
 */

import { queryShareTriggerGroup } from "./diagramDom";

export type ShareSvgTriggerHandles = {
  readonly getDiagramHost: () => HTMLElement | undefined;
  readonly onShareClick: () => void | Promise<void>;
  /** Run after Svelte has flushed DOM (e.g. pass `() => void tick().then(fn)` from the route). */
  readonly scheduleAfterDomReady: (fn: () => void) => void;
};

/**
 * Attaches to `HomeShareTrigger` after the next frame(s) once SVG exists under the diagram host.
 */
export function mountShareSvgTriggerWire(
  handles: ShareSvgTriggerHandles,
): () => void {
  let cancelled = false;
  let rafId = 0;
  let wiredTrigger: SVGGElement | null = null;

  const detach = (): void => {
    if (wiredTrigger == null) return;
    const trigger = wiredTrigger;
    trigger.classList.remove("home-share-trigger--hover");
    trigger.style.cursor = "";
    trigger.removeEventListener("pointerenter", onEnter);
    trigger.removeEventListener("pointerleave", onLeave);
    trigger.removeEventListener("click", onClick);
    wiredTrigger = null;
  };

  const onEnter = (): void => {
    wiredTrigger?.classList.add("home-share-trigger--hover");
  };
  const onLeave = (): void => {
    wiredTrigger?.classList.remove("home-share-trigger--hover");
  };
  const onClick = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    void handles.onShareClick();
  };

  const MAX_ATTACH_FRAMES = 45;
  let frames = 0;

  const tryWireTrigger = (): void => {
    if (cancelled) return;
    const host = handles.getDiagramHost();
    if (host == null) return;
    const trigger = queryShareTriggerGroup(host);
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
