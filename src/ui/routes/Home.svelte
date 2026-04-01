<script lang="ts">
  // Home route: civil-day diagram from collaborator output (full SVG replace). Loop B: semantic
  // regeneration on minute boundaries only; Loop A (1 Hz NowTime) is Stage 5.
  import { onMount } from "svelte";
  import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
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
    <!--
      Interim dark stage: scenegen preview palette assumes a black canvas (see tools/scenegen/renderPreview.mjs).
      Revisit once whole-page and header-strip visual design is settled.
    -->
    <div class="home-diagram-stage">
      <figure class="home-diagram" aria-label="Tide diagram for the current civil day">
        <!-- Trusted: SVG produced locally by diagram-generation + scenegen preview. -->
        {@html diagramSvg}
      </figure>
    </div>
  {/if}
</main>

<style>
  /*
   * Interim: isolate the diagram on black so preview stroke/fill contrast matches the generator’s defaults.
   * Not the final home layout — pending decisions on full page + top-bar theming.
   */
  .home-diagram-stage {
    width: 100%;
    max-width: 28rem;
    margin: 0 auto;
    padding: 1rem;
    box-sizing: border-box;
    background: #000;
    border-radius: 0.5rem;
  }

  .home-diagram {
    margin: 0;
  }

  .home-diagram :global(svg) {
    display: block;
    width: 100%;
    height: auto;
  }
</style>
