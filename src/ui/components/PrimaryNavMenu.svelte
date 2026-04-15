<script lang="ts">
  /**
   * Hash-route primary nav in a details/summary menu (header usage).
   */
  import PrimaryNavLinks from "./PrimaryNavLinks.svelte";

  let menuDetails = $state<HTMLDetailsElement | undefined>(undefined);

  /** Called from parent header (brand / location) so navigation closes the flyout. */
  export function closeMenu(): void {
    menuDetails?.removeAttribute("open");
  }

  function closeFromLink(): void {
    closeMenu();
  }
</script>

<details class="menu" bind:this={menuDetails}>
  <summary class="menu-toggle" aria-label="Menu">Menu</summary>
  <PrimaryNavLinks className="nav-links" onNavigate={closeFromLink} />
</details>
