<script lang="ts">
  /**
   * TideClock.svelte — Main clock card: local wall time (minute resolution, `subscribeMinuteCadence`), dial from `ClockSceneModel`, load state chrome.
   * Kind: Presentation. Does not fetch tides or run diagram-generation.
   */
  import { onMount } from "svelte";
  import type { ClockSceneModel } from "../../clock-presentation/clockSceneModel";
  import { subscribeMinuteCadence } from "../../application/minuteCadence";
  import ClockDivisionDial from "./ClockDivisionDial.svelte";

  type TidePredictionsLoadState = { readonly status: "loading" | "ready" | "error" };

  interface Props {
    readonly clockScene: ClockSceneModel;
    readonly tideLoadState: TidePredictionsLoadState;
  }

  let { clockScene, tideLoadState }: Props = $props();

  /** Wall-clock ms; bumps on each local minute boundary (same cadence as the home tide diagram). */
  let wallClockMs = $state(Date.now());

  onMount(() => {
    return subscribeMinuteCadence(() => {
      wallClockMs = Date.now();
    });
  });

  function formatTime(ms: number): string {
    return new Date(ms).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
    });
  }
</script>

<div class="tide-clock">
  <ClockDivisionDial {clockScene} />
  <p class="muted">Local time</p>
  <p style="font-family: ui-monospace, monospace; margin: 0; font-size: 1.25rem;">
    {formatTime(wallClockMs)}
  </p>

  {#if tideLoadState.status === "loading"}
    <p class="muted" role="status">Loading tides…</p>
  {:else if tideLoadState.status === "error"}
    <p class="muted" role="alert">Tides could not be loaded. Check the connection and try again.</p>
  {:else if clockScene.tideEvents.length > 0}
    <p class="muted" role="status">
      {clockScene.tideEvents.length} tide extremes in today’s window (markers on the dial next).
    </p>
  {/if}
</div>
