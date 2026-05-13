<script lang="ts">
  /**
   * Hash-route primary nav in a details/summary menu (header usage).
   */
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import { route } from "../../infrastructure/router.js";
  import PrimaryMenuContent from "./PrimaryMenuContent.svelte";
  import { manualInstallStepsFromUserAgent } from "../routes/home/installFlow";
  import {
    keepAwakeUserStore,
    setKeepAwakeUserEnabled,
    tideWakePresentationStore,
  } from "../routes/home/pwaUi";
  import { isWakeLockApiSupported } from "../routes/home/wakeLockSupport";

  let menuDetails = $state<HTMLDetailsElement | undefined>(undefined);
  let installInfoOpen = $state(false);
  let pwaDisplaySectionOpen = $state(false);
  let pwaUserWants = $state(get(keepAwakeUserStore));
  let pwaTideViewPresentation = $state(get(tideWakePresentationStore));
  const installManualSteps = $derived(
    manualInstallStepsFromUserAgent(
      typeof navigator !== "undefined" ? navigator.userAgent : null,
    ),
  );

  const pwaIsHome = $derived($route === "home");

  const pwaForMenu = $derived({
    sectionOpen: pwaDisplaySectionOpen,
    apiSupported: isWakeLockApiSupported(),
    isHomeRoute: pwaIsHome,
    userWants: pwaUserWants,
    homePresentation: pwaIsHome ? pwaTideViewPresentation : null,
    showBatteryBlurb: false,
    onToggleSection: () => {
      pwaDisplaySectionOpen = !pwaDisplaySectionOpen;
    },
    onToggle: (next: boolean) => {
      setKeepAwakeUserEnabled(next);
    },
  });

  /** Called from parent header (brand / location) so navigation closes the flyout. */
  export function closeMenu(): void {
    menuDetails?.removeAttribute("open");
    installInfoOpen = false;
    pwaDisplaySectionOpen = false;
  }

  function closeFromLink(): void {
    closeMenu();
  }

  function handleInstallEntry(): void {
    installInfoOpen = !installInfoOpen;
  }

  onMount(() =>
    keepAwakeUserStore.subscribe((v) => (pwaUserWants = v)),
  );

  onMount(() =>
    tideWakePresentationStore.subscribe(
      (v) => (pwaTideViewPresentation = v),
    ),
  );
</script>

<details class="menu" bind:this={menuDetails}>
  <summary class="menu-toggle" aria-label="Menu">Menu</summary>
  <div class="nav-links u-pad-surface-sm">
    <PrimaryMenuContent
      linksClassName="u-stack-sm u-nav-link-list"
      installInfoOpen={installInfoOpen}
      installManualSteps={installManualSteps}
      onToggleInstallInfo={handleInstallEntry}
      onNavigate={closeFromLink}
      pwa={pwaForMenu}
    />
  </div>
</details>
