<script lang="ts">
  import PrimaryNavLinks from "./PrimaryNavLinks.svelte";

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
  }: Props = $props();
</script>

<button
  type="button"
  class="primary-menu-content__action"
  onclick={onToggleInstallInfo}
>
  Install app
</button>
{#if installInfoOpen}
  <section class="primary-menu-content__install-flow" aria-live="polite">
    <p class="primary-menu-content__install-title">Install Tideclock</p>
    <p class="primary-menu-content__install-body">
      Installing helps Tideclock feel focused and reliable for always-on use.
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
        Continue install
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

<PrimaryNavLinks className={linksClassName} {onNavigate} />

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
</style>
