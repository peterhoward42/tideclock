<script lang="ts">
  /**
   * Hash-route primary nav in a details/summary menu (header usage).
   */
  import { onMount } from "svelte";
  import PrimaryMenuContent from "./PrimaryMenuContent.svelte";
  import {
    detectInstallPlatform,
    HOME_INSTALL_BENEFIT_LINES,
    manualInstallStepsForPlatform,
    promptForInstall,
    type BeforeInstallPromptEventLike,
  } from "../routes/home/homeRouteInstallFlow";

  let menuDetails = $state<HTMLDetailsElement | undefined>(undefined);
  let installInfoOpen = $state(false);
  let installPlatform = $state<"ios" | "android" | "desktop">("desktop");
  let installPromptEvent = $state<BeforeInstallPromptEventLike | null>(null);
  let installStatusLine = $state<string | null>(null);
  const installBenefitLines = $derived(HOME_INSTALL_BENEFIT_LINES);
  const installManualSteps = $derived(
    manualInstallStepsForPlatform(installPlatform),
  );
  const installCanPrompt = $derived(installPromptEvent != null);

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
    const promptEvent = installPromptEvent;
    if (promptEvent == null) return;
    const outcome = await promptForInstall(promptEvent);
    installPromptEvent = null;
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

  onMount(() => {
    if (typeof navigator !== "undefined") {
      installPlatform = detectInstallPlatform(navigator.userAgent);
    }

    if (typeof window === "undefined") return;
    const onBeforeInstallPrompt = (event: Event): void => {
      const promptEvent = event as BeforeInstallPromptEventLike;
      event.preventDefault();
      installPromptEvent = promptEvent;
    };
    const onAppInstalled = (): void => {
      installPromptEvent = null;
      installStatusLine = "App installed.";
    };

    window.addEventListener("beforeinstallprompt", onBeforeInstallPrompt);
    window.addEventListener("appinstalled", onAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", onBeforeInstallPrompt);
      window.removeEventListener("appinstalled", onAppInstalled);
    };
  });
</script>

<details class="menu" bind:this={menuDetails}>
  <summary class="menu-toggle" aria-label="Menu">Menu</summary>
  <div class="nav-links primary-nav-menu__panel">
    <PrimaryMenuContent
      linksClassName="primary-nav-menu__links"
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

<style>
  .primary-nav-menu__panel {
    padding: 0.5rem;
  }

  .primary-nav-menu__panel :global(.primary-nav-menu__links) {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .primary-nav-menu__panel :global(.primary-nav-menu__links a) {
    color: rgb(241 245 249 / 0.92);
    text-decoration: none;
    padding: 0.35rem 0.5rem;
    border-radius: 0.25rem;
  }

  .primary-nav-menu__panel :global(.primary-nav-menu__links a:hover) {
    background: rgb(148 163 184 / 0.12);
  }
</style>
