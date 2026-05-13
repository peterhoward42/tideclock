<script lang="ts">
  import { THE_TIDE_DIAL } from "../brand";
  import PrimaryNavLinks from "./PrimaryNavLinks.svelte";
  import HomePwaDisplaySection from "../routes/home/HomePwaDisplaySection.svelte";
  import type { WakeLockPresentation } from "../routes/home/wakeLockPresentation";

  export type PwaDisplayMenu = {
    readonly sectionOpen: boolean;
    readonly apiSupported: boolean;
    readonly isHomeRoute: boolean;
    readonly userWants: boolean;
    readonly homePresentation: WakeLockPresentation | null;
    readonly showBatteryBlurb: boolean;
    readonly onToggleSection: () => void;
    readonly onToggle: (next: boolean) => void;
    /** Shown in the home diagram menu in standalone: pops the first-run card again. */
    readonly onShowWelcomeCard?: () => void;
    readonly showWelcomeCardEntry?: boolean;
  };

  interface Props {
    readonly linksClassName: string;
    readonly installInfoOpen: boolean;
    readonly installCanPrompt: boolean;
    readonly installBenefitLines: readonly string[];
    readonly installManualSteps: readonly string[];
    readonly installStatusLine: string | null;
    readonly onToggleInstallInfo: () => void;
    readonly onPromptInstall: () => void | Promise<void>;
    readonly onNavigate?: () => void;
    readonly fullscreenActionLabel?: string;
    readonly onToggleFullscreen?: () => void | Promise<void>;
    /** Optional: keep-awake / “App display” (home route + header menu). */
    readonly pwa?: PwaDisplayMenu;
  }

  let {
    linksClassName,
    installInfoOpen,
    installCanPrompt,
    installBenefitLines,
    installManualSteps,
    installStatusLine,
    onToggleInstallInfo,
    onPromptInstall,
    onNavigate,
    fullscreenActionLabel,
    onToggleFullscreen,
    pwa = undefined,
  }: Props = $props();

  const pwaToggleEnabled = $derived(
    pwa === undefined ? false : pwa.apiSupported,
  );
</script>

<PrimaryNavLinks className={linksClassName} {onNavigate} />

<button
  type="button"
  class="primary-menu-content__action primary-menu-content__install-entry"
  aria-expanded={installInfoOpen}
  onclick={onToggleInstallInfo}
>
  <span class="primary-menu-content__install-entry-label">Install as always-on display</span>
  <span class="primary-menu-content__install-entry-hint">
    Designed to be left running on a kitchen tablet or wall-mounted screen.
  </span>
</button>
{#if installInfoOpen}
  <section class="primary-menu-content__install-flow" aria-live="polite">
    <p class="primary-menu-content__install-title">What you get</p>
    <p class="primary-menu-content__install-body">
      Same {THE_TIDE_DIAL} as in the browser, in a calmer full-screen shell—easy to
      leave open at home, in guest space, or on a small retail display.
    </p>
    <ul class="primary-menu-content__install-list">
      {#each installBenefitLines as line}
        <li>{line}</li>
      {/each}
    </ul>
    {#if installCanPrompt}
      <button
        type="button"
        class="primary-menu-content__action"
        onclick={onPromptInstall}
      >
        Install
      </button>
    {:else}
      <p class="primary-menu-content__install-body">
        Install from your browser menu:
      </p>
      <ol class="primary-menu-content__install-list">
        {#each installManualSteps as step}
          <li>{step}</li>
        {/each}
      </ol>
    {/if}
    {#if installStatusLine !== null}
      <p class="primary-menu-content__install-status">{installStatusLine}</p>
    {/if}
  </section>
{/if}
{#if pwa !== undefined}
  <button
    type="button"
    class="primary-menu-content__action"
    onclick={pwa.onToggleSection}
  >
    App display
  </button>
  {#if pwa.sectionOpen}
    <section class="primary-menu-content__pwa" aria-label="App display">
      <HomePwaDisplaySection
        apiSupported={pwa.apiSupported}
        isHomeRoute={pwa.isHomeRoute}
        userWants={pwa.userWants}
        homePresentation={pwa.homePresentation}
        showBatteryBlurb={pwa.showBatteryBlurb}
        toggleEnabled={pwaToggleEnabled}
        onToggle={pwa.onToggle}
      />
      {#if pwa.showWelcomeCardEntry && pwa.onShowWelcomeCard}
        <button
          type="button"
          class="primary-menu-content__pwa-welcome-again"
          onclick={pwa.onShowWelcomeCard}
        >
          Show first-run setup card
        </button>
      {/if}
    </section>
  {/if}
{/if}

{#if fullscreenActionLabel !== undefined && onToggleFullscreen !== undefined}
  <button
    type="button"
    class="primary-menu-content__action"
    onclick={onToggleFullscreen}
  >
    {fullscreenActionLabel}
  </button>
{/if}

<style>
  .primary-menu-content__action {
    margin-top: 0.35rem;
    width: 100%;
    border: 0;
    border-radius: 0.25rem;
    background: var(--surface-menu-content-control);
    color: var(--text-menu-content-primary);
    text-align: left;
    padding: 0.45rem 0.5rem;
    font: inherit;
    cursor: pointer;
  }

  .primary-menu-content__action:hover {
    background: var(--surface-menu-content-control-hover);
  }

  .primary-menu-content__install-entry {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 0.25rem;
  }

  .primary-menu-content__install-entry-label {
    font-weight: 600;
  }

  .primary-menu-content__install-entry-hint {
    font-size: 0.72rem;
    line-height: 1.35;
    font-weight: 400;
    color: var(--text-menu-content-status);
  }

  .primary-menu-content__install-flow {
    margin-top: 0.35rem;
    padding: 0.45rem 0.5rem;
    border: 1px solid var(--border-menu-content-inset);
    border-radius: 0.25rem;
    background: var(--surface-menu-content-inset);
    color: var(--text-menu-content-primary);
  }

  .primary-menu-content__install-title {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .primary-menu-content__install-body {
    margin: 0.4rem 0 0;
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .primary-menu-content__install-list {
    margin: 0.45rem 0 0;
    padding-left: 1rem;
    display: grid;
    gap: 0.25rem;
    font-size: 0.78rem;
    line-height: 1.3;
  }

  .primary-menu-content__install-status {
    margin: 0.45rem 0 0;
    font-size: 0.76rem;
    color: var(--text-menu-content-status);
  }

  .primary-menu-content__pwa {
    margin-top: 0.35rem;
    padding: 0.45rem 0.5rem;
    border: 1px solid var(--border-menu-content-inset);
    border-radius: 0.25rem;
    background: var(--surface-menu-content-inset);
  }

  .primary-menu-content__pwa-welcome-again {
    margin-top: 0.45rem;
    width: 100%;
    border: 0;
    background: none;
    color: var(--text-menu-content-status);
    text-decoration: underline;
    text-underline-offset: 0.1em;
    font: inherit;
    font-size: 0.75rem;
    line-height: 1.3;
    cursor: pointer;
    text-align: left;
    padding: 0.2rem 0 0;
  }
</style>
