<script lang="ts">
  // Home route: civil-day diagram from collaborator output (full SVG replace). Loop B: semantic
  // regeneration on minute boundaries only. Loop A: 1 Hz DOM patch for centre-cluster NowTime only
  // (no per-second collaborator.generate).
  import { onMount } from "svelte";
  import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
  import { nowMs } from "../../application/appClock.js";
  import {
    buildDiagramGenerationSpec,
    utcIsoToLocalCanonicalTimeLocal,
  } from "../../application/buildDiagramGenerationSpec";
  import { createDiagramGenerationCollaborator } from "../../application/diagramGenerationCollaborator";
  import { deriveNextTideSemantics } from "../../application/nextTideSemantics";
  import { subscribeSemanticMinuteCadence } from "../../application/semanticMinuteCadence";
  import { renderPreviewSvg } from "../../../tools/scenegen/renderPreview.mjs";

  type TidePredictionsLoadState = { status: "loading" | "ready" | "error" };

  interface Props {
    tideLoadState: TidePredictionsLoadState;
    tideExtremes: TideExtremesAtLocation | undefined;
  }

  let { tideLoadState, tideExtremes }: Props = $props();

  const collaborator = createDiagramGenerationCollaborator();

  /** Drives Loop B: bumps only on local minute rollover (aligned scheduler), not every second. */
  let semanticMinuteEpoch = $state(Math.floor(Date.now() / 60_000));

  onMount(() => {
    if (!import.meta.env.DEV) return;
    try {
      domDumpEnabled = new URLSearchParams(window.location.search).has("dom");
      if (domDumpEnabled) refreshDomDump();
    } catch {
      // ignore (non-browser / tests)
    }
  });

  onMount(() =>
    subscribeSemanticMinuteCadence(
      (epoch) => {
        semanticMinuteEpoch = epoch;
      },
      { fireImmediately: false }
    )
  );

  let diagramSvg = $state("");
  let diagramError = $state<string | undefined>(undefined);
  /** Container for injected SVG; used to patch NowTime text on Loop A without regenerating the scene. */
  let diagramHostEl = $state<HTMLElement | undefined>(undefined);
  /** Avoid re-fitting the SVG repeatedly while NowTime updates each second. */
  let lastFitSignature = $state<string | undefined>(undefined);

  /** Dev-only: optional DOM dump for debugging blank panel issues. */
  let domDumpEnabled = $state(false);
  let domDump = $state<string>("");

  function refreshDomDump(): void {
    if (!domDumpEnabled) return;
    const root = document.querySelector("main.home-route") as HTMLElement | null;
    domDump = root?.outerHTML ?? "(home route root not found)";
  }

  function localCanonicalTimeNowFromMs(ms: number): string {
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  $effect(() => {
    const _semanticMinute = semanticMinuteEpoch;
    const extremes = tideExtremes;
    const load = tideLoadState;

    if (load.status !== "ready" || extremes === undefined || extremes.extremes.length === 0) {
      diagramSvg = "";
      diagramError = undefined;
      return;
    }

    try {
      const timeNow = localCanonicalTimeNowFromMs(Date.now());
      const baseSpec = buildDiagramGenerationSpec({
        extremesAtLocation: extremes,
        timeNow,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
      });
      const derived = deriveNextTideSemantics(baseSpec);
      const spec = buildDiagramGenerationSpec({
        extremesAtLocation: extremes,
        timeNow,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
        derivedSemantics: { nextTide: derived.nextTide },
      });
      const { scene, styleRuntime } = collaborator.generate(spec);
      diagramSvg = renderPreviewSvg(scene, { styleRuntime });
      diagramError = undefined;
    } catch (e) {
      diagramSvg = "";
      diagramError = e instanceof Error ? e.message : String(e);
    }
  });

  $effect(() => {
    if (diagramHostEl == null) return;
    if (diagramSvg === "") return;

    const signature = `${diagramSvg.length}:${tideExtremes?.extremes.length ?? 0}`;
    if (signature === lastFitSignature) return;
    lastFitSignature = signature;

    // Wait for the injected SVG to exist in the DOM before measuring.
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        // `diagramHostEl` can become null between scheduling and execution
        // (e.g. route change / conditional block flips). Re-check here.
        const host = diagramHostEl;
        if (host == null) return;

        const svg = host.querySelector("svg") as SVGSVGElement | null;
        if (svg == null) return;

        const contentGroup =
          (svg.querySelector('g[data-name="tideDiagram"]') as SVGGElement | null) ??
          (svg.querySelector("g") as SVGGElement | null) ??
          svg;

        let bbox: DOMRect | SVGRect;
        try {
          bbox = contentGroup.getBBox();
        } catch {
          return;
        }

        // Convert measured bbox to screen pixels using the SVG's current CTM.
        // IMPORTANT: reset transforms before any measurement so the pixel math is stable.
        svg.style.transformOrigin = "0 0";
        svg.style.transform = "translate(0px, 0px) scale(1)";

        const ctm = svg.getScreenCTM();
        if (ctm == null) return;

        const p1 = svg.createSVGPoint();
        p1.x = bbox.x;
        p1.y = bbox.y;
        const tp1 = p1.matrixTransform(ctm);

        const p2 = svg.createSVGPoint();
        p2.x = bbox.x + bbox.width;
        p2.y = bbox.y + bbox.height;
        const tp2 = p2.matrixTransform(ctm);

        const bboxPxW = Math.abs(tp2.x - tp1.x);
        const bboxPxH = Math.abs(tp2.y - tp1.y);
        if (!Number.isFinite(bboxPxW) || !Number.isFinite(bboxPxH) || bboxPxW <= 0 || bboxPxH <= 0)
          return;

        // Fit the measured diagram bbox into the available black panel area.
        // Panel padding creates the intentional left/right/bottom gutters.
        const panel = host.closest(".home-panel") as HTMLElement | null;
        if (panel == null) return;

        const cs = getComputedStyle(panel);
        const padL = parseFloat(cs.paddingLeft) || 0;
        const padR = parseFloat(cs.paddingRight) || 0;
        const padT = parseFloat(cs.paddingTop) || 0;
        const padB = parseFloat(cs.paddingBottom) || 0;

        const availW = panel.clientWidth - padL - padR;
        const availH = panel.clientHeight - padT - padB;
        if (availW <= 0 || availH <= 0) return;

        const scaleX = availW / bboxPxW;
        const scaleY = availH / bboxPxH;
        const scale = Math.min(scaleX, scaleY);
        if (!Number.isFinite(scale) || scale <= 0) return;

        // Scale only. Centering via flex/absolute positioning + transform-origin is more stable
        // than attempting to translate in mixed coordinate frames.
        svg.style.transformOrigin = "50% 50%";
        svg.style.transform = `scale(${scale})`;
      });
    });
  });

  $effect(() => {
    const host = diagramHostEl;
    const svg = diagramSvg;
    if (host == null || svg === "") return;
    const unsub = nowMs.subscribe((ms) => {
      const textEl = host.querySelector('svg g[data-name="NowTime"] text');
      if (textEl) textEl.textContent = localCanonicalTimeNowFromMs(ms);
      refreshDomDump();
    });
    return unsub;
  });
</script>

<main class="home-route">
  {#if domDumpEnabled}
    <div class="home-debug">
      <button type="button" class="home-debug__btn" onclick={refreshDomDump}>Refresh DOM dump</button>
      <details open>
        <summary>Home route DOM</summary>
        <pre class="home-debug__pre">{domDump}</pre>
      </details>
    </div>
  {/if}
  {#if tideLoadState.status === "loading"}
    <div class="home-panel" aria-live="polite">
      <p class="muted" role="status">Loading tides…</p>
    </div>
  {:else if tideLoadState.status === "error"}
    <div class="home-panel" aria-live="polite">
      <p class="muted" role="alert">Tides could not be loaded. Check the connection and try again.</p>
    </div>
  {:else if tideExtremes === undefined}
    <div class="home-panel">
      <p class="muted">Choose a location to see today’s tide diagram.</p>
    </div>
  {:else if tideExtremes.extremes.length === 0}
    <div class="home-panel" aria-live="polite">
      <p class="muted" role="status">No tide extremes for this day.</p>
    </div>
  {:else if diagramError !== undefined}
    <div class="home-panel" aria-live="polite">
      <p class="muted" role="alert">Diagram could not be rendered: {diagramError}</p>
    </div>
  {:else if diagramSvg !== ""}
    <div class="home-panel" bind:this={diagramHostEl}>
      <figure class="home-instrument" aria-label="Tide diagram for the current civil day">
        <!-- Trusted: SVG produced locally by diagram-generation + scenegen preview. -->
        {@html diagramSvg}
      </figure>
    </div>
  {/if}
</main>

<style>
  /*
   * Appliance-like layout:
   * - Black panel fills the entire available vertical space under the header.
   * - Diagram is centered and fills available height/width (uniform scaling via SVG preserveAspectRatio).
   * - External “gap” is CSS-driven (panel padding), not viewBox padding.
   */
  .home-route {
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    /* Cancel the parent `.content` padding so the black panel fills the full visible area. */
    margin: -1.5rem -1rem -2rem;
  }

  .home-panel {
    flex: 1;
    min-height: 0;
    width: 100%;
    background: #000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: clamp(0.75rem, 2vw, 1.25rem);
    box-sizing: border-box;
  }

  .home-instrument {
    margin: 0;
    width: 100%;
    height: 100%;
    position: relative;
    overflow: hidden;
  }

  .home-instrument :global(svg) {
    display: block;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    max-height: none;
  }

  .home-panel .muted {
    color: #dbeafe;
  }

  .home-debug {
    padding: 0.5rem 0.75rem;
    background: #0b1020;
    color: #e5e7eb;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New",
      monospace;
    font-size: 12px;
  }

  .home-debug__btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: inherit;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    cursor: pointer;
    margin-bottom: 0.5rem;
  }

  .home-debug__pre {
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 35vh;
    overflow: auto;
    margin: 0.5rem 0 0;
  }
</style>
