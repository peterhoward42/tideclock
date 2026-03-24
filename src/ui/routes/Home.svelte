<script lang="ts">
  // Home route: minimal render surface during re-baselining.
  import type { HomeScreenModel } from "../../clock-presentation/homeScreenModel";
  import TideClock from "../components/TideClock.svelte";

  type TidePredictionsLoadState = { status: "loading" | "ready" | "error" };

  interface Props {
    homeScreenModel: HomeScreenModel;
    tideLoadState: TidePredictionsLoadState;
  }

  let { homeScreenModel, tideLoadState }: Props = $props();
</script>

<TideClock clockScene={homeScreenModel.clockScene} tideLoadState={tideLoadState} />
