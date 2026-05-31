<script lang="ts">
  /**
   * Hash-route primary nav in a details/summary menu (header usage).
   */
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import { route } from "../../infrastructure/router.js";
  import PrimaryMenuContent from "./PrimaryMenuContent.svelte";
  import {
    keepAwakeUserStore,
    setKeepAwakeUserEnabled,
    tideWakePresentationStore,
  } from "../routes/home/keepAwakeUi";
  import { isWakeLockApiSupported } from "../routes/home/wakeLockSupport";

  let menuDetails = $state<HTMLDetailsElement | undefined>(undefined);
  let nerdsOpen = $state(false);
  let contactOpen = $state(false);
  let keepAwakeSectionOpen = $state(false);
  let keepAwakeUserWants = $state(get(keepAwakeUserStore));
  let keepAwakeTideViewPresentation = $state(get(tideWakePresentationStore));
  const keepAwakeIsHome = $derived($route === "home");

  const keepAwakeForMenu = $derived({
    sectionOpen: keepAwakeSectionOpen,
    apiSupported: isWakeLockApiSupported(),
    isHomeRoute: keepAwakeIsHome,
    userWants: keepAwakeUserWants,
    homePresentation: keepAwakeIsHome ? keepAwakeTideViewPresentation : null,
    onToggleSection: () => {
      keepAwakeSectionOpen = !keepAwakeSectionOpen;
    },
    onToggle: (next: boolean) => {
      setKeepAwakeUserEnabled(next);
    },
  });

  /** Called from parent header (brand / location) so navigation closes the flyout. */
  export function closeMenu(): void {
    menuDetails?.removeAttribute("open");
    nerdsOpen = false;
    contactOpen = false;
    keepAwakeSectionOpen = false;
  }

  function closeFromLink(): void {
    closeMenu();
  }

  function handleNerdsEntry(): void {
    nerdsOpen = !nerdsOpen;
  }

  function handleContactEntry(): void {
    contactOpen = !contactOpen;
  }

  onMount(() =>
    keepAwakeUserStore.subscribe((v) => (keepAwakeUserWants = v)),
  );

  onMount(() =>
    tideWakePresentationStore.subscribe(
      (v) => (keepAwakeTideViewPresentation = v),
    ),
  );
</script>

<details class="menu" bind:this={menuDetails}>
  <summary class="menu-toggle" aria-label="Menu">Menu</summary>
  <div class="nav-links u-pad-surface-sm">
    <PrimaryMenuContent
      linksClassName="u-stack-sm u-nav-link-list"
      nerdsOpen={nerdsOpen}
      onToggleNerds={handleNerdsEntry}
      contactOpen={contactOpen}
      onToggleContact={handleContactEntry}
      onNavigate={closeFromLink}
      keepAwake={keepAwakeForMenu}
    />
  </div>
</details>
