<script lang="ts">
  /**
   * Home.svelte — Civil-day tide diagram: builds specs, runs diagram-generation collaborator, swaps SVG.
   * Minute cadence for full regen; second cadence only for the live clock label. Kind: Presentation + orchestration.
   * Does not own proxy fetch (receives extremes from the shell).
   */
  import { onMount } from "svelte";
  import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
  import { nowMs } from "../../application/appClock.js";
  import {
    buildDiagramGenerationSpec,
    utcIsoToLocalCanonicalTimeLocal,
  } from "../../application/buildDiagramGenerationSpec";
  import {
    createDiagramGenerationCollaborator,
    type DiagramGenerationCollaborator,
  } from "../../application/diagramGenerationCollaborator";
  import { deriveNextTideSemantics } from "../../application/nextTideSemantics";
  import { subscribeSemanticMinuteCadence } from "../../application/semanticMinuteCadence";
  import { renderSceneSvg } from "../../diagram-generation/render/renderSceneSvg.mjs";

  type TidePredictionsLoadState = { readonly status: "loading" | "ready" | "error" };

  interface Props {
    readonly tideLoadState: TidePredictionsLoadState;
    readonly tideExtremes: TideExtremesAtLocation | undefined;
    readonly townName: string;
  }

  let { tideLoadState, tideExtremes, townName }: Props = $props();

  const collaborator: DiagramGenerationCollaborator = createDiagramGenerationCollaborator();

  /** Drives Loop B: bumps only on local minute rollover (aligned scheduler), not every second. */
  let semanticMinuteEpoch = $state(Math.floor(Date.now() / 60_000));

  onMount(() => {
    if (!import.meta.env.DEV) return;
    try {
      const params = new URLSearchParams(window.location.search);
      domDumpEnabled = params.has("dom");
      outlineEnabled = params.has("outline");
      previewFrameEnabled = params.has("pf");
      if (domDumpEnabled) refreshDomSummary();
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
  /** Container for injected SVG; used to patch TimeNowLabel HH:MM / colon / seconds text without regenerating the scene. */
  let diagramHostEl = $state<HTMLElement | undefined>(undefined);

  /** Dev-only: optional debug tooling (toggle with query params). */
  let domDumpEnabled = $state(false);
  let outlineEnabled = $state(false);
  let previewFrameEnabled = $state(false);
  let domSummary = $state<string>("");

  function refreshDomSummary(): void {
    if (!domDumpEnabled) return;
    const host =
      diagramHostEl ?? (document.querySelector("main.home-route figure.home-instrument") as HTMLElement | null);
    const figure = document.querySelector("main.home-route figure.home-instrument") as HTMLElement | null;
    const svg =
      (host?.querySelector("svg") as SVGSVGElement | null) ??
      (document.querySelector("main.home-route svg") as SVGSVGElement | null);
    const panel = document.querySelector("main.home-route .home-panel") as HTMLElement | null;

    const svgRect = svg?.getBoundingClientRect();
    const figureRect = figure?.getBoundingClientRect();
    const panelRect = panel?.getBoundingClientRect();

    domSummary = JSON.stringify(
      {
        diagramSvgLen: diagramSvg.length,
        tideExtremesCount: tideExtremes?.extremes.length ?? 0,
        svgExists: svg != null,
        svg: svg
          ? {
              rect: svgRect ? { w: svgRect.width, h: svgRect.height, x: svgRect.x, y: svgRect.y } : null,
              client: { w: svg.clientWidth, h: svg.clientHeight },
              transform: svg.style.transform ?? "",
              transformOrigin: svg.style.transformOrigin ?? "",
              viewBox: svg.getAttribute("viewBox") ?? null,
              ariaHidden: svg.getAttribute("aria-hidden"),
            }
          : null,
        figure: figureRect ? { w: figureRect.width, h: figureRect.height, x: figureRect.x, y: figureRect.y } : null,
        panel: panelRect ? { w: panelRect.width, h: panelRect.height } : null,
      },
      null,
      2
    );
  }

  function localCanonicalTimeNowFromMs(ms: number): string {
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  function localTimeNowDatePrefixFromMs(ms: number): string {
    const d = new Date(ms);
    const weekday = d.toLocaleDateString(undefined, { weekday: "short" });
    const day = String(d.getDate()).padStart(2, "0");
    const month = d.toLocaleDateString(undefined, { month: "short" });
    return `${weekday} ${day} ${month}`;
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
      const nowMs = Date.now();
      const timeNow = localCanonicalTimeNowFromMs(nowMs);
      const timeNowDatePrefix = localTimeNowDatePrefixFromMs(nowMs);
      const baseSpec = buildDiagramGenerationSpec({
        extremesAtLocation: extremes,
        timeNow,
        timeNowDatePrefix,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
        townName,
        timeDeltaTidePhasePair: "out-low",
      });
      const derived = deriveNextTideSemantics(baseSpec);
      const tidePhasePair = derived.nextTide?.kind === "High" ? "in-high" : "out-low";
      const spec = buildDiagramGenerationSpec({
        extremesAtLocation: extremes,
        timeNow,
        timeNowDatePrefix,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
        townName,
        timeDeltaTidePhasePair: tidePhasePair,
        derivedSemantics: { nextTide: derived.nextTide },
      });
      const { scene, styleRuntime } = collaborator.generate(spec);
      diagramSvg = renderSceneSvg(scene, {
        styleRuntime,
        debug: { previewFrame: import.meta.env.DEV && previewFrameEnabled },
      });
      diagramError = undefined;
    } catch (e) {
      diagramSvg = "";
      diagramError = e instanceof Error ? e.message : String(e);
    }
  });

  $effect(() => {
    if (diagramHostEl == null) return;
    if (diagramSvg === "") return;

    // The diagram SVG should scale via CSS (`width/height: 100%`) + preserveAspectRatio.
    // Keep only tiny debug affordances here (outline, summary refresh).
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        const host = diagramHostEl;
        if (host == null) return;
        const svg = host.querySelector("svg") as SVGSVGElement | null;
        if (svg == null) return;

        svg.style.transformOrigin = "50% 50%";
        svg.style.transform = "scale(1)";

        if (outlineEnabled) {
          svg.style.outline = "2px solid rgba(255,0,0,0.6)";
          svg.style.background = "rgba(255,0,0,0.06)";
        } else {
          svg.style.outline = "";
          svg.style.background = "";
        }

        refreshDomSummary();
      });
    });
  });

  $effect(() => {
    const host = diagramHostEl;
    const svg = diagramSvg;
    if (host == null || svg === "") return;
    const unsub = nowMs.subscribe((ms) => {
      const canonical = localCanonicalTimeNowFromMs(ms);
      const datePrefix = localTimeNowDatePrefixFromMs(ms);
      const hhmmEl = host.querySelector(
        'svg g[data-name="TimeNowLabelHms"] text'
      ) as SVGTextElement | null;
      const colonEl = host.querySelector(
        'svg g[data-name="TimeNowLabelSecondsColon"] text'
      ) as SVGTextElement | null;
      const secEl = host.querySelector(
        'svg g[data-name="TimeNowLabelSeconds"] text'
      ) as SVGTextElement | null;
      if (hhmmEl !== null) hhmmEl.textContent = `${datePrefix} - ${canonical.slice(0, 5)}`;
      if (colonEl !== null) colonEl.textContent = canonical.slice(5, 6);
      if (secEl !== null) secEl.textContent = canonical.slice(6);
    });
    return unsub;
  });
</script>

<main class="home-route">
  {#if domDumpEnabled}
    <div class="home-debug">
      <button type="button" class="home-debug__btn" onclick={refreshDomSummary}>Refresh DOM summary</button>
      <details open>
        <summary>Home route DOM (summary)</summary>
        <pre class="home-debug__pre">{domSummary}</pre>
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
        <!-- Trusted: SVG from diagram-generation scene graph (renderSceneSvg). -->
        {@html diagramSvg}
      </figure>
    </div>
  {/if}
</main>

<style>
  /*
   * Layout-neutral host stack:
   * - `.home-route` remains the fit container.
   * - Intermediate wrappers do not add spacing.
   * - Any visible slack comes only from aspect-ratio fitting in SVG.
   */
  .home-route {
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .home-panel {
    flex: 1;
    min-height: 0;
    width: 100%;
    background: #000;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .home-instrument {
    margin: 0;
    padding: 0;
    width: 100%;
    flex: 1;
    min-height: 0;
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

  /*
   * Hard-coded pulse for TimeNowLabelSecondsColon only (not in style model).
   * ~600ms cycle: dip and return reads as a subtle “heartbeat” on the : before SS.
   */
  @keyframes home-time-now-colon-heartbeat {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.22;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .home-instrument :global(svg g[data-name="TimeNowLabelSecondsColon"] text) {
      animation: home-time-now-colon-heartbeat 600ms ease-in-out infinite;
    }
  }

  /*
   * Time-now pointer wedge (rendered as path.home-now-triangle-pulse): 50%→100% opacity in 600ms, full cycle 1s.
   */
  @keyframes home-now-triangle-pulse {
    0%,
    100% {
      opacity: 0.5;
    }
    60% {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .home-instrument :global(svg path.home-now-triangle-pulse) {
      animation: home-now-triangle-pulse 1s linear infinite;
    }
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
