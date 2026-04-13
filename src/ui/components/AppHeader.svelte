<script lang="ts">
  import type { Town } from "../../data/bakedTowns";

  export type HeaderTone = "light" | "dark";
  export type HeaderCenter =
    | { kind: "location"; town?: Town }
    | { kind: "title"; title: string }
    | { kind: "empty" };

  interface Props {
    readonly tone: HeaderTone;
    readonly center: HeaderCenter;
  }

  let { tone, center }: Props = $props();

  let menuDetails = $state<HTMLDetailsElement | undefined>(undefined);

  function closeMenu(): void {
    menuDetails?.removeAttribute("open");
  }

  function locationLabel(town?: Town): string {
    return town?.name ?? "Location";
  }
</script>

<header class="top-bar" class:top-bar--dark={tone === "dark"} class:top-bar--light={tone === "light"}>
  <div class="top-bar__left">
    <a class="brand" href="#/home" onclick={closeMenu} aria-label="Tide Dial home">Tide Dial</a>
  </div>

  <div class="top-bar__center">
    {#if center.kind === "location"}
      <a
        class="center-control center-control--location"
        href="#/location"
        onclick={closeMenu}
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
    <details class="menu" bind:this={menuDetails}>
      <summary class="menu-toggle" aria-label="Menu">Menu</summary>
      <nav class="nav-links" aria-label="Primary">
        <a href="#/home" onclick={closeMenu}>Home</a>
        <a href="#/location" onclick={closeMenu}>Location</a>
        <a href="#/location2" onclick={closeMenu}>Location (new search)</a>
        <a href="#/settings" onclick={closeMenu}>Settings</a>
        <a href="#/about" onclick={closeMenu}>About</a>
        <a href="#/acknowledgements" onclick={closeMenu}>Acknowledgements</a>
        <a href="#/support" onclick={closeMenu}>Support</a>
        <a href="#/cookies" onclick={closeMenu}>Cookies</a>
      </nav>
    </details>
  </div>
</header>

