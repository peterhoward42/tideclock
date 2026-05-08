<script lang="ts">
  /**
   * Home route entry — thin shell for a stable router import path; orchestration lives in
   * {@link import("./home/HomeRoute.svelte")}.
   */
  import HomeRoute from "./home/HomeRoute.svelte";
  import type { RouteProps } from "./home/routeProps";

  let {
    tideLoadState,
    tideExtremes,
    townName,
    tidePreviewBannerLine,
  }: RouteProps = $props();
</script>

<HomeRoute
  {tideLoadState}
  {tideExtremes}
  {townName}
  {tidePreviewBannerLine}
/>
