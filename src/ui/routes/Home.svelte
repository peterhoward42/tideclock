<script lang="ts">
  /**
   * Home route entry — thin shell for a stable router import path; orchestration lives in
   * {@link import("./home/HomeRoute.svelte")}.
   */
  import HomeRoute from "./home/HomeRoute.svelte";
  import type { HomeRouteProps } from "./home/homeRouteProps";

  let {
    tideLoadState,
    tideExtremes,
    townName,
    tideUxDevPreviewBannerLine,
  }: HomeRouteProps = $props();
</script>

<HomeRoute
  {tideLoadState}
  {tideExtremes}
  {townName}
  {tideUxDevPreviewBannerLine}
/>
