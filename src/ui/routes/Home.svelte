<script lang="ts">
  // Home route: minimal render surface during re-baselining.
  import type { HomeScreenModel } from "../../clock-presentation/homeScreenModel";

  type TidePredictionsLoadState = { status: "loading" | "ready" | "error" };

  interface Props {
    homeScreenModel: HomeScreenModel;
    tideLoadState: TidePredictionsLoadState;
  }

  let { homeScreenModel, tideLoadState }: Props = $props();
</script>

<section class="home-placeholder">
  <p class="muted">Diagram rendering is temporarily disabled during semantic deconfliction.</p>
  {#if tideLoadState.status === "loading"}
    <p class="muted" role="status">Loading tides…</p>
  {:else if tideLoadState.status === "error"}
    <p class="muted" role="alert">Tides could not be loaded. Check the connection and try again.</p>
  {:else}
    <p class="muted" role="status">Tide load state is ready.</p>
  {/if}
</section>
