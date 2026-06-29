<script lang="ts">
  import HubDocumentRoute, {
    type HubChildLink,
  } from "../components/HubDocumentRoute.svelte";

  const links: HubChildLink[] = [
    {
      href: "#/install",
      label: "Install",
      pitch: "Add a home-screen icon so the dial opens like any other app.",
    },
    {
      href: "#/about",
      label: "About",
      pitch: "Version, safety, data sources, and the compliance pages.",
    },
  ];
</script>

<HubDocumentRoute
  routeClass="installconfig-route"
  linksAriaLabel="Install and configuration pages"
  {links}
/>
