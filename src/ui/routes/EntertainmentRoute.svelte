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
    {
      href: "#/softwarenerd",
      label: "Software Nerd",
      pitch: "How the app is structured, coded, and shipped.",
    },
  ];
</script>

<HubDocumentRoute
  title="Entertainment"
  routeClass="entertainment-route"
  linksAriaLabel="Story and nerd pages"
  {links}
>
  {#snippet intro()}
    <p>
      If you have a minute and some curiosity — the story behind the dial, how
      tides work, and how the software is built.
    </p>
  {/snippet}
</HubDocumentRoute>
