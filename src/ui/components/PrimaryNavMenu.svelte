<script lang="ts">
  /**
   * Hash-route primary nav in a details/summary menu. Used in the header and as a home-diagram overlay.
   */
  export type PrimaryNavMenuVariant = "header" | "home-overlay";

  interface Props {
    readonly variant: PrimaryNavMenuVariant;
  }

  let { variant }: Props = $props();

  let menuDetails = $state<HTMLDetailsElement | undefined>(undefined);

  /** Called from parent header (brand / location) so navigation closes the flyout. */
  export function closeMenu(): void {
    menuDetails?.removeAttribute("open");
  }

  function closeFromLink(): void {
    closeMenu();
  }
</script>

<details
  class="menu"
  class:menu--home-overlay={variant === "home-overlay"}
  bind:this={menuDetails}
>
  <summary class="menu-toggle" aria-label="Menu">Menu</summary>
  <nav class="nav-links" aria-label="Primary">
    <a href="#/home" onclick={closeFromLink}>Home</a>
    <a href="#/location2" onclick={closeFromLink}>Location</a>
    <a href="#/settings" onclick={closeFromLink}>Settings</a>
    <a href="#/about" onclick={closeFromLink}>About</a>
    <a href="#/acknowledgements" onclick={closeFromLink}>Acknowledgements</a>
    <a href="#/support" onclick={closeFromLink}>Support</a>
    <a href="#/cookies" onclick={closeFromLink}>Cookies</a>
  </nav>
</details>
