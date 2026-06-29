<script lang="ts">
  import HubDocumentRoute, {
    type HubChildLink,
  } from "../components/HubDocumentRoute.svelte";

  const links: HubChildLink[] = [
    {
      href: "#/install",
      label: "Install",
      pitch: "Add a home-screen icon and open the app like any other.",
    },
    {
      href: "#/about",
      label: "About",
      pitch: "Version, safety, data sources, and the rest.",
    },
  ];
</script>

<HubDocumentRoute
  title="Install / Config / Settings"
  routeClass="installconfig-route"
  linksAriaLabel="Install and configuration pages"
  {links}
>
  {#snippet intro()}
    <p>
      Get the app onto your device and read the small print when you need it.
    </p>
  {/snippet}
</HubDocumentRoute>
