<script lang="ts">
  // Home route: civil-day diagram from collaborator output (full SVG replace; semantic cadence in Stage 4).
  import { onMount } from "svelte";
  import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
  import { nowMs } from "../../application/appClock.js";
  import {
    buildDiagramGenerationSpec,
    utcIsoToLocalCanonicalTimeLocal,
  } from "../../application/buildDiagramGenerationSpec";
  import { createDiagramGenerationCollaborator } from "../../application/diagramGenerationCollaborator";
  import { deriveNextTideSemantics } from "../../application/nextTideSemantics";
  import { renderPreviewSvg } from "../../../tools/scenegen/renderPreview.mjs";

  type TidePredictionsLoadState = { status: "loading" | "ready" | "error" };

  interface Props {
    tideLoadState: TidePredictionsLoadState;
    tideExtremes: TideExtremesAtLocation | undefined;
  }

  let { tideLoadState, tideExtremes }: Props = $props();

  const collaborator = createDiagramGenerationCollaborator();

  let wallMs = $state(Date.now());
  onMount(() => nowMs.subscribe((v) => (wallMs = v)));

  /** Minute bucket so we do not rebuild the full scene every second (Loop B / Stage 4). */
  const minuteEpoch = $derived(Math.floor(wallMs / 60_000));

  let diagramSvg = $state("");
  let diagramError = $state<string | undefined>(undefined);

  function localCanonicalTimeNowFromMs(ms: number): string {
    const d = new Date(ms);
    const hh = String(d.getHours()).padStart(2, "0");
    const mm = String(d.getMinutes()).padStart(2, "0");
    const ss = String(d.getSeconds()).padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  $effect(() => {
    const _minute = minuteEpoch;
    const extremes = tideExtremes;
    const load = tideLoadState;
    const ms = wallMs;

    if (load.status !== "ready" || extremes === undefined || extremes.extremes.length === 0) {
      diagramSvg = "";
      diagramError = undefined;
      return;
    }

    try {
      const timeNow = localCanonicalTimeNowFromMs(ms);
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
</script>

<main class="route home-route">
  <h1>Home</h1>

  {#if tideLoadState.status === "loading"}
    <p class="muted" role="status">Loading tides…</p>
  {:else if tideLoadState.status === "error"}
    <p class="muted" role="alert">Tides could not be loaded. Check the connection and try again.</p>
  {:else if tideExtremes === undefined}
    <p class="muted">Choose a location to see today’s tide diagram.</p>
  {:else if tideExtremes.extremes.length === 0}
    <p class="muted" role="status">No tide extremes for this day.</p>
  {:else if diagramError !== undefined}
    <p class="muted" role="alert">Diagram could not be rendered: {diagramError}</p>
  {:else if diagramSvg !== ""}
    <figure class="home-diagram" aria-label="Tide diagram for the current civil day">
      <!-- Trusted: SVG produced locally by diagram-generation + scenegen preview. -->
      {@html diagramSvg}
    </figure>
  {/if}
</main>

<style>
  .home-diagram :global(svg) {
    display: block;
    width: 100%;
    max-width: 28rem;
    height: auto;
    color: #0f172a;
  }
</style>
