<script lang="ts">
  import type { TidePredictionsModel } from "../../core-models/tide-predictions";
  import TideClock from "../components/TideClock.svelte";

  interface Props {
    tidePredictionsModel: TidePredictionsModel;
  }

  let { tidePredictionsModel }: Props = $props();
</script>

<TideClock />
