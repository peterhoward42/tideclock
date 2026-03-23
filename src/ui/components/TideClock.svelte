<script lang="ts">
  // Local-time display driven by the shared `nowMs` store (one tick per second); tide load lifecycle for the main screen.
  import { nowMs } from "../../application/appClock.js";

  type TidePredictionsLoadState = { status: "loading" | "ready" | "error" };

  interface Props {
    tideLoadState: TidePredictionsLoadState;
  }

  let { tideLoadState }: Props = $props();

  /** @param {number} ms */
  function formatTime(ms: number) {
    return new Date(ms).toLocaleTimeString(undefined, {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  }
</script>

<div class="tide-clock">
  <p class="muted">Local time</p>
  <p style="font-family: ui-monospace, monospace; margin: 0; font-size: 1.25rem;">
    {formatTime($nowMs)}
  </p>

  {#if tideLoadState.status === "loading"}
    <p class="muted" role="status">Loading tides…</p>
  {:else if tideLoadState.status === "error"}
    <p class="muted" role="alert">Tides could not be loaded. Check the connection and try again.</p>
  {/if}
</div>
