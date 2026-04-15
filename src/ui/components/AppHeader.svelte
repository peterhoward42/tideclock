<script lang="ts">
  import type { Town } from "../../data/townSchema";
  import PrimaryNavMenu from "./PrimaryNavMenu.svelte";

  export type HeaderTone = "light" | "dark";
  export type HeaderCenter =
    | { kind: "location"; town?: Town }
    | { kind: "title"; title: string }
    | { kind: "empty" };

  interface Props {
    readonly tone: HeaderTone;
    readonly center: HeaderCenter;
    /** When false, primary nav is omitted (home route renders it on the diagram instead). */
    readonly includeMenu?: boolean;
  }

  let { tone, center, includeMenu = true }: Props = $props();

  let primaryNav = $state<{ closeMenu: () => void } | undefined>(undefined);

  function closeHeaderNav(): void {
    primaryNav?.closeMenu();
  }

  function locationLabel(town?: Town): string {
    return town?.name ?? "Location";
  }
</script>

<header class="top-bar" class:top-bar--dark={tone === "dark"} class:top-bar--light={tone === "light"}>
  <div class="top-bar__left">
    <a class="brand" href="#/home" onclick={closeHeaderNav} aria-label="Tide Dial home">Tide Dial</a>
  </div>

  <div class="top-bar__center">
    {#if center.kind === "location"}
      <a
        class="center-control center-control--location"
        href="#/location2"
        onclick={closeHeaderNav}
        aria-label="Change location"
      >
        <span class="center-control__text">{locationLabel(center.town)}</span>
        <span class="center-control__caret" aria-hidden="true">▾</span>
      </a>
    {:else if center.kind === "title"}
      <span class="center-title">{center.title}</span>
    {:else}
      <span class="center-title" aria-hidden="true"></span>
    {/if}
  </div>

  <div class="top-bar__right">
    {#if includeMenu}
      <PrimaryNavMenu bind:this={primaryNav} />
    {/if}
  </div>
</header>

