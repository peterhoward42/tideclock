<script lang="ts">
  import PrimaryNavLinks from "./PrimaryNavLinks.svelte";
  import HomePwaDisplaySection from "../routes/home/HomePwaDisplaySection.svelte";
  import type { WakeLockPresentation } from "../routes/home/wakeLockPresentation";

  export type PwaDisplayMenu = {
    readonly sectionOpen: boolean;
    readonly apiSupported: boolean;
    readonly isHomeRoute: boolean;
    readonly userWants: boolean;
    readonly homePresentation: WakeLockPresentation | null;
    readonly onToggleSection: () => void;
    readonly onToggle: (next: boolean) => void;
    /** Shown in the home diagram menu in standalone: pops the first-run card again. */
    readonly onShowWelcomeCard?: () => void;
    readonly showWelcomeCardEntry?: boolean;
  };

  interface Props {
    readonly linksClassName: string;
    readonly contactOpen: boolean;
    readonly onToggleContact: () => void;
    readonly onNavigate?: () => void;
    readonly fullscreenActionLabel?: string;
    readonly onToggleFullscreen?: () => void | Promise<void>;
    /** Optional: keep screen awake (home route + header menu). */
    readonly pwa?: PwaDisplayMenu;
  }

  let {
    linksClassName,
    contactOpen,
    onToggleContact,
    onNavigate,
    fullscreenActionLabel,
    onToggleFullscreen,
    pwa = undefined,
  }: Props = $props();

  const pwaToggleEnabled = $derived(
    pwa === undefined ? false : pwa.apiSupported,
  );
</script>

<nav class={linksClassName} aria-label="Primary">
  <PrimaryNavLinks {onNavigate} />
  <button
    type="button"
    class="primary-menu-content__action"
    aria-expanded={contactOpen}
    aria-controls="primary-menu-contact-panel"
    onclick={onToggleContact}
  >
    Contact
  </button>
  {#if contactOpen}
    <section
      id="primary-menu-contact-panel"
      class="primary-menu-content__contact-panel"
      aria-label="Contact"
      aria-live="polite"
    >
      <p class="primary-menu-content__contact-body">
        Questions, bug reports, thoughtful suggestions.
      </p>
      <p class="primary-menu-content__contact-body">
        This app is personally designed and maintained by me, so responses may
        occasionally be slow, but I do read everything.
      </p>
      <p class="primary-menu-content__contact-email">
        <a
          href="mailto:peterhoward42@gmail.com"
          onclick={() => onNavigate?.()}>peterhoward42@gmail.com</a>
      </p>
    </section>
  {/if}
  <a href="#/onwall" onclick={() => onNavigate?.()}>Stick it on the wall</a>
  {#if pwa !== undefined}
    <button
      type="button"
      class="primary-menu-content__action"
      onclick={pwa.onToggleSection}
    >
      Keep screen awake
    </button>
    {#if pwa.sectionOpen}
      <section class="primary-menu-content__pwa" aria-label="Keep screen awake">
        <HomePwaDisplaySection
          isHomeRoute={pwa.isHomeRoute}
          userWants={pwa.userWants}
          homePresentation={pwa.homePresentation}
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
  <a href="#/story" onclick={() => onNavigate?.()}>Story</a>
</nav>

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

  .primary-menu-content__contact-panel {
    margin-top: 0.35rem;
    padding: 0.45rem 0.5rem;
    border: 1px solid var(--border-menu-content-inset);
    border-radius: 0.25rem;
    background: var(--surface-menu-content-inset);
    color: var(--text-menu-content-primary);
  }

  .primary-menu-content__contact-body {
    margin: 0.4rem 0 0;
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .primary-menu-content__contact-body:first-child {
    margin-top: 0;
  }

  .primary-menu-content__contact-email {
    margin: 0.45rem 0 0;
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .primary-menu-content__contact-email a {
    color: var(--text-menu-content-primary);
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
