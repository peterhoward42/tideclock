<script lang="ts">
  // Home route: receives tide predictions for upcoming dial/UI wiring; `TideClock` is local time only for now.
  import type { TidePredictionsModel } from "../../core-models/tide-predictions";
  import TideClock from "../components/TideClock.svelte";

  interface Props {
    tidePredictionsModel: TidePredictionsModel;
  }

  let { tidePredictionsModel }: Props = $props();
</script>

<TideClock />
