<script lang="ts">
  // Home route: minimal render surface during re-baselining.
  import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
  import TideClock from "../components/TideClock.svelte";

  type TidePredictionsLoadState = { status: "loading" | "ready" | "error" };

  interface Props {
    tideLoadState: TidePredictionsLoadState;
    loadTideExtremesForCurrentCivilDay: (
      latitude: number,
      longitude: number
    ) => Promise<TideExtremesAtLocation | undefined>;
  }

  let { tideLoadState, loadTideExtremesForCurrentCivilDay }: Props = $props();
</script>

<TideClock
  tideLoadState={tideLoadState}
  loadTideExtremesForCurrentCivilDay={loadTideExtremesForCurrentCivilDay}
/>
