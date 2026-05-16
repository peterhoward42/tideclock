<script lang="ts">
  /**
   * Hash-route primary nav in a details/summary menu (header usage).
   */
  import { get } from "svelte/store";
  import { onMount, tick } from "svelte";
  import { route } from "../../infrastructure/router.js";
  import { effectiveSearchFromLocation } from "../homeUrlQuery";
  import PrimaryMenuContent from "./PrimaryMenuContent.svelte";
  import {
    keepAwakeUserStore,
    setKeepAwakeUserEnabled,
    tideWakePresentationStore,
  } from "../routes/home/pwaUi";
  import { isWakeLockApiSupported } from "../routes/home/wakeLockSupport";

  let menuDetails = $state<HTMLDetailsElement | undefined>(undefined);
  let contactOpen = $state(false);
  let pwaDisplaySectionOpen = $state(false);
  let pwaUserWants = $state(get(keepAwakeUserStore));
  let pwaTideViewPresentation = $state(get(tideWakePresentationStore));
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
    contactOpen = false;
    pwaDisplaySectionOpen = false;
  }

  function closeFromLink(): void {
    closeMenu();
  }

  function handleContactEntry(): void {
    contactOpen = !contactOpen;
  }

  /** `#/home?contact=1` opens the menu with Contact expanded (e.g. from Story). */
  $effect(() => {
    if (typeof window === "undefined") {
      return;
    }
    if ($route !== "home") {
      return;
    }
    const search = effectiveSearchFromLocation(
      window.location.search,
      window.location.hash,
    );
    if (new URLSearchParams(search).get("contact") !== "1") {
      return;
    }
    contactOpen = true;
    void tick().then(() => {
      menuDetails?.setAttribute("open");
      const url = new URL(window.location.href);
      url.hash = "/home";
      history.replaceState(null, "", url.href);
    });
  });

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
      contactOpen={contactOpen}
      onToggleContact={handleContactEntry}
      onNavigate={closeFromLink}
      pwa={pwaForMenu}
    />
  </div>
</details>
