<script lang="ts">
  import HubDocumentRoute, {
    type HubChildLink,
  } from "../components/HubDocumentRoute.svelte";

  const links: HubChildLink[] = [
    {
      href: "#/story",
      label: "Story",
      pitch: "Why a flooded bridge led to a tide dial on your phone.",
    },
    {
      href: "#/tidenerd",
      label: "Tide Nerd",
      pitch: "Tides, places, and the dial — explained without the lecture.",
    },
  ];
</script>

<HubDocumentRoute
  title="Entertainment"
  routeClass="entertainment-route"
  linksAriaLabel="Story and Tide Nerd"
  {links}
>
  {#snippet intro()}
    <p>
      If you have a minute and some curiosity — the story behind the dial and
      how tides work.
    </p>
  {/snippet}
</HubDocumentRoute>
