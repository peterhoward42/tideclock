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
      label: "The moving sea",
      pitch: "A playful explanation of how tides work.",
    },
    {
      href: "#/maker",
      label: "A little bit about me",
      pitch: "I'm the maker — curious?",
    },
    {
      href: "#/drawexact",
      label: "DrawExact",
      pitch:
        "A graphical drawing tool for when geometry matters — the project I'm most proud of.",
    },
  ];
</script>

<HubDocumentRoute
  title="Entertainment"
  routeClass="entertainment-route"
  linksAriaLabel="Story, The moving sea, A little bit about me, and DrawExact"
  {links}
>
  {#snippet intro()}
    <p>
      The dial is a graphical way to read the day. Pick what appeals: the story
      behind it, how tides work, a little about me, or DrawExact.
    </p>
  {/snippet}
</HubDocumentRoute>
