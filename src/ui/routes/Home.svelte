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
        const host = diagramHostEl;
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

        const w = bbox.width;
        const h = bbox.height;
        if (!Number.isFinite(w) || !Number.isFinite(h) || h <= 0 || w <= 0) return;

        // Trim the viewBox to measured content with a small internal safety pad.
        // Also update the SVG's intrinsic `width`/`height` so CSS `height:auto` remains correct.
        const pad = Math.max(6, 0.03 * Math.max(w, h));
        const vbX = bbox.x - pad;
        const vbY = bbox.y - pad;
        const vbW = w + 2 * pad;
        const vbH = h + 2 * pad;

        svg.setAttribute("viewBox", `${vbX} ${vbY} ${vbW} ${vbH}`);
        svg.setAttribute("width", String(vbW));
        svg.setAttribute("height", String(vbH));
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
    });
    return unsub;
  });
</script>

<main class="home-route">
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
    max-height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .home-instrument :global(svg) {
    display: block;
    width: 100%;
    max-height: 100%;
    height: auto;
  }

  .home-panel .muted {
    color: #dbeafe;
  }
</style>
