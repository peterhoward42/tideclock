<script lang="ts">
  /**
   * Hash-route primary nav in a details/summary menu (header usage).
   */
  import PrimaryMenuContent from "./PrimaryMenuContent.svelte";
  import { trackProductEvent } from "../../infrastructure/analytics/trackProductEvent";

  let menuDetails = $state<HTMLDetailsElement | undefined>(undefined);

  /** Called from parent header (brand / location) so navigation closes the flyout. */
  export function closeMenu(): void {
    menuDetails?.removeAttribute("open");
  }

  function closeFromLink(): void {
    closeMenu();
  }

  function handleMenuToggle(): void {
    if (menuDetails?.open) {
      trackProductEvent("opened_menu");
    }
  }

</script>

<details class="menu" bind:this={menuDetails} ontoggle={handleMenuToggle}>
  <summary class="menu-toggle" aria-label="Menu">Menu</summary>
  <div class="nav-links u-pad-surface-sm">
    <PrimaryMenuContent
      linksClassName="u-stack-sm u-nav-link-list"
      onNavigate={closeFromLink}
    />
  </div>
</details>
