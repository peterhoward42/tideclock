<script lang="ts">
  // Home route: minimal render surface during re-baselining.
  import TideClock from "../components/TideClock.svelte";

  type TidePredictionsLoadState = { status: "loading" | "ready" | "error" };

  interface Props {
    tideLoadState: TidePredictionsLoadState;
  }

  let { tideLoadState }: Props = $props();
</script>

<TideClock tideLoadState={tideLoadState} />
