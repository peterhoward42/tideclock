<script lang="ts">
  // Home route: main display; `tidePredictionsModel` will plug in here when the tide UI lands.
  import type { TidePredictionsLoadState } from "../../application/tide-predictions-load-state";
  import TideClock from "../components/TideClock.svelte";

  interface Props {
    tideLoadState: TidePredictionsLoadState;
  }

  let { tideLoadState }: Props = $props();
</script>

<TideClock tideLoadState={tideLoadState} />
