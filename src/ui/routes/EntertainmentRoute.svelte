<script lang="ts">
  import HubDocumentRoute, {
    type HubChildLink,
  } from "../components/HubDocumentRoute.svelte";

  const links: HubChildLink[] = [
    {
      href: "#/story",
      label: "Story",
      pitch: "How The Tide Dial came to be.",
    },
    {
      href: "#/tidenerd",
      label: "Tide Nerd",
      pitch: "Tides, places, and the dial itself.",
    },
    {
      href: "#/softwarenerd",
      label: "Software Nerd",
      pitch: "How the app is built and shipped.",
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
    <p>Dig into the story and nerdier corners when you have a minute.</p>
  {/snippet}
</HubDocumentRoute>
