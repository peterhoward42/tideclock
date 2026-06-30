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
      href: "#/maker",
      label: "A little bit about me",
      pitch:
        "I'm the maker — a little about me, and whether we should talk.",
    },
    {
      href: "#/drawexact",
      label: "DrawExact",
      pitch: "A free browser drawing tool for when geometry matters.",
    },
  ];
</script>

<HubDocumentRoute
  title="Entertainment"
  routeClass="entertainment-route"
  linksAriaLabel="Story, Tide Nerd, A little bit about me, and DrawExact"
  {links}
>
  {#snippet intro()}
    <p>
      If you've got a minute and some curiosity — pick what appeals: the story
      behind the dial, how tides work, a little about me, or another project.
    </p>
  {/snippet}
</HubDocumentRoute>
