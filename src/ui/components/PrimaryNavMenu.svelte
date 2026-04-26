<script lang="ts">
  /**
   * Hash-route primary nav in a details/summary menu (header usage).
   */
  import { get } from "svelte/store";
  import { onMount } from "svelte";
  import PrimaryMenuContent from "./PrimaryMenuContent.svelte";
  import {
    homeInstallObserver,
    HOME_INSTALL_BENEFIT_LINES,
    manualInstallStepsForPlatform,
    promptForInstall,
  } from "../routes/home/homeRouteInstallFlow";

  let menuDetails = $state<HTMLDetailsElement | undefined>(undefined);
  let installInfoOpen = $state(false);
  let installObserverSnapshot = $state(get(homeInstallObserver));
  let installLastSeenAppInstalledCount = $state(0);
  let installStatusLine = $state<string | null>(null);
  const installBenefitLines = $derived(HOME_INSTALL_BENEFIT_LINES);
  const installManualSteps = $derived(
    manualInstallStepsForPlatform(installObserverSnapshot.platform),
  );
  const installCanPrompt = $derived(
    installObserverSnapshot.promptEvent != null,
  );

  /** Called from parent header (brand / location) so navigation closes the flyout. */
  export function closeMenu(): void {
    menuDetails?.removeAttribute("open");
    installInfoOpen = false;
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
    homeInstallObserver.clearPromptEvent();
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
    homeInstallObserver.subscribe(
      (snapshot) => (installObserverSnapshot = snapshot),
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
      installBenefitLines={installBenefitLines}
      installManualSteps={installManualSteps}
      installStatusLine={installStatusLine}
      onToggleInstallInfo={handleInstallEntry}
      onPromptInstall={handleInstallPromptAction}
      onNavigate={closeFromLink}
    />
  </div>
</details>
