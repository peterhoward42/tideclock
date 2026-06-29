<script lang="ts">
  /**
   * Hash-route primary nav in a details/summary menu (header usage).
   */
  import PrimaryMenuContent from "./PrimaryMenuContent.svelte";
  import { trackProductEvent } from "../../infrastructure/analytics/trackProductEvent";

  let menuDetails = $state<HTMLDetailsElement | undefined>(undefined);
  let nerdsOpen = $state(false);

  /** Called from parent header (brand / location) so navigation closes the flyout. */
  export function closeMenu(): void {
    menuDetails?.removeAttribute("open");
    nerdsOpen = false;
  }

  function closeFromLink(): void {
    closeMenu();
  }

  function handleNerdsEntry(): void {
    const opening = !nerdsOpen;
    nerdsOpen = opening;
    if (opening) {
      trackProductEvent("expanded_for_nerds");
    }
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
      nerdsOpen={nerdsOpen}
      onToggleNerds={handleNerdsEntry}
      onNavigate={closeFromLink}
    />
  </div>
</details>
