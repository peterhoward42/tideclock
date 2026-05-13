<script lang="ts">
  /**
   * Hash-route primary nav in a details/summary menu (header usage).
   */
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import { route } from "../../infrastructure/router.js";
  import PrimaryMenuContent from "./PrimaryMenuContent.svelte";
  import {
    installObserver,
    manualInstallStepsForPlatform,
    promptForInstall,
  } from "../routes/home/installFlow";
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
  let installObserverSnapshot = $state(get(installObserver));
  let installLastSeenAppInstalledCount = $state(0);
  let installStatusLine = $state<string | null>(null);
  const installManualSteps = $derived(
    manualInstallStepsForPlatform(installObserverSnapshot.platform),
  );
  const installCanPrompt = $derived(
    installObserverSnapshot.promptEvent != null,
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
    installStatusLine = null;
  }

  function closeFromLink(): void {
    closeMenu();
  }

  function handleInstallEntry(): void {
    installInfoOpen = !installInfoOpen;
    installStatusLine = null;
  }

  async function handleInstallPromptAction(): Promise<void> {
    const promptEvent = installObserverSnapshot.promptEvent;
    if (promptEvent == null) return;
    const outcome = await promptForInstall(promptEvent);
    installObserver.clearPromptEvent();
    if (outcome === "accepted") {
      installStatusLine = "Install request accepted.";
      return;
    }
    if (outcome === "dismissed") {
      installStatusLine = "Install dismissed. You can try again from this menu.";
      return;
    }
    installStatusLine = "Install dialog closed.";
  }

  onMount(() =>
    installObserver.subscribe(
      (snapshot) => (installObserverSnapshot = snapshot),
    ),
  );

  onMount(() =>
    keepAwakeUserStore.subscribe((v) => (pwaUserWants = v)),
  );

  onMount(() =>
    tideWakePresentationStore.subscribe(
      (v) => (pwaTideViewPresentation = v),
    ),
  );

  $effect(() => {
    const installedCount = installObserverSnapshot.appInstalledCount;
    if (installedCount <= installLastSeenAppInstalledCount) return;
    installLastSeenAppInstalledCount = installedCount;
    installStatusLine = "App installed.";
  });
</script>

<details class="menu" bind:this={menuDetails}>
  <summary class="menu-toggle" aria-label="Menu">Menu</summary>
  <div class="nav-links u-pad-surface-sm">
    <PrimaryMenuContent
      linksClassName="u-stack-sm u-nav-link-list"
      installInfoOpen={installInfoOpen}
      installCanPrompt={installCanPrompt}
      installManualSteps={installManualSteps}
      installStatusLine={installStatusLine}
      onToggleInstallInfo={handleInstallEntry}
      onPromptInstall={handleInstallPromptAction}
      onNavigate={closeFromLink}
      pwa={pwaForMenu}
    />
  </div>
</details>
