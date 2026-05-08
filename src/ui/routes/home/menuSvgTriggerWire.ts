/**
 * Wires pointer + resize listeners to the HomeMenuTrigger group inside injected diagram SVG.
 * Call from a single reactive owner; returns cleanup to run on teardown or before re-wire.
 */

import {
  computeMenuPanelAnchorStyle,
  queryMenuTriggerGroup,
} from "./diagramDom";

export type MenuSvgTriggerHandles = {
  readonly getDiagramHost: () => HTMLElement | undefined;
  readonly getMenuPanel: () => HTMLElement | undefined;
  readonly isMenuOpen: () => boolean;
  readonly setMenuOpen: (open: boolean) => void;
  readonly setMenuPanelStyle: (cssText: string) => void;
  /** Run after Svelte has flushed DOM (e.g. pass `() => void tick().then(fn)` from the route). */
  readonly scheduleAfterDomReady: (fn: () => void) => void;
};

function updateAnchorFromDom(handles: MenuSvgTriggerHandles): void {
  const host = handles.getDiagramHost();
  if (host == null) return;
  const trigger = queryMenuTriggerGroup(host);
  if (trigger == null) return;
  handles.setMenuPanelStyle(computeMenuPanelAnchorStyle(host, trigger));
}

/**
 * Attaches to `HomeMenuTrigger` after the next frame(s) once SVG exists under the diagram host.
 */
export function mountMenuSvgTriggerWire(
  handles: MenuSvgTriggerHandles,
): () => void {
  let cancelled = false;
  let rafId = 0;
  let wiredTrigger: SVGGElement | null = null;

  const detach = (): void => {
    if (wiredTrigger == null) return;
    const trigger = wiredTrigger;
    trigger.classList.remove("home-menu-trigger--hover");
    trigger.style.cursor = "";
    trigger.removeEventListener("pointerenter", onEnter);
    trigger.removeEventListener("pointerleave", onLeave);
    trigger.removeEventListener("click", onClick);
    window.removeEventListener("resize", onResize);
    document.removeEventListener("pointerdown", onPointerDown);
    wiredTrigger = null;
  };

  const onEnter = (): void => {
    wiredTrigger?.classList.add("home-menu-trigger--hover");
  };
  const onLeave = (): void => {
    wiredTrigger?.classList.remove("home-menu-trigger--hover");
  };
  const onClick = (event: Event): void => {
    event.preventDefault();
    event.stopPropagation();
    updateAnchorFromDom(handles);
    handles.setMenuOpen(!handles.isMenuOpen());
  };
  const onResize = (): void => {
    if (!handles.isMenuOpen()) return;
    updateAnchorFromDom(handles);
  };
  const onPointerDown = (event: Event): void => {
    if (!handles.isMenuOpen()) return;
    const target = event.target;
    if (!(target instanceof Node)) return;
    if (handles.getMenuPanel()?.contains(target)) return;
    const trigger = wiredTrigger;
    if (trigger !== null && trigger.contains(target)) return;
    handles.setMenuOpen(false);
  };

  const MAX_ATTACH_FRAMES = 45;
  let frames = 0;

  const tryWireTrigger = (): void => {
    if (cancelled) return;
    const host = handles.getDiagramHost();
    if (host == null) return;
    const trigger = queryMenuTriggerGroup(host);
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
    window.addEventListener("resize", onResize);
    document.addEventListener("pointerdown", onPointerDown);
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
