<script lang="ts">
  /**
   * Skippable first-launch card in installed (standalone) mode for keep-awake and display.
   */
  import HomePwaDisplaySection from "./HomePwaDisplaySection.svelte";
  import type { WakeLockPresentation } from "./wakeLockPresentation";

  interface Props {
    /** In dev, a normal tab can still open this card via `?pwaSetup=1` — use distinct copy. */
    readonly devPreviewInTab: boolean;
    readonly isHomeRoute: true;
    readonly userWants: boolean;
    readonly homePresentation: WakeLockPresentation | null;
    readonly toggleEnabled: boolean;
    onToggleKeepAwake: (next: boolean) => void;
    onDismissThisSession: () => void;
    onDismissForever: () => void;
  }

  let {
    devPreviewInTab,
    isHomeRoute,
    userWants,
    homePresentation,
    toggleEnabled,
    onToggleKeepAwake,
    onDismissThisSession,
    onDismissForever,
  }: Props = $props();
</script>

<section class="pwa-setup" aria-label="Keep screen awake" aria-live="polite">
  {#if devPreviewInTab}
    <p class="pwa-setup__eyebrow">Development preview</p>
    <p class="pwa-setup__title">First-run setup card (browser tab)</p>
    <p class="pwa-setup__lede">
      A real <strong>installed</strong> PWA or iOS &ldquo;Add to Home Screen&rdquo; session sees this
      once automatically. The controls below are the same as in the installed app. Remove
      <code class="pwa-setup__code">?pwaSetup=1</code> from the URL when done.
    </p>
  {:else}
    <p class="pwa-setup__title">Running in the installed app</p>
    <p class="pwa-setup__lede">
      A quick tip: you can keep the tide view from sleeping while the app stays open. Change this
      anytime from <strong>Menu</strong> → <strong>Keep screen awake</strong>.
    </p>
  {/if}
  <HomePwaDisplaySection
    {isHomeRoute}
    {userWants}
    {homePresentation}
    {toggleEnabled}
    onToggle={onToggleKeepAwake}
  />
  <div class="pwa-setup__row">
    <button type="button" class="pwa-setup__btn" onclick={onDismissThisSession}>
      Not now
    </button>
    <button type="button" class="pwa-setup__btn pwa-setup__btn--primary" onclick={onDismissForever}>
      Don&rsquo;t show again
    </button>
  </div>
</section>

<style>
  .pwa-setup {
    padding: 0.65rem 0.7rem;
    max-width: 22rem;
    background: var(--surface-menu-flyout);
    color: var(--text-menu-content-primary);
    border: 1px solid var(--border-menu-flyout);
    border-radius: 0.375rem;
    box-shadow: var(--shadow-menu-flyout);
  }

  .pwa-setup__eyebrow {
    margin: 0 0 0.25rem;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-menu-content-status);
  }

  .pwa-setup__title {
    margin: 0 0 0.35rem;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .pwa-setup__code {
    font-size: 0.78em;
  }

  .pwa-setup__lede {
    margin: 0 0 0.4rem;
    font-size: 0.78rem;
    line-height: 1.4;
  }

  .pwa-setup :global(.pwa-display) {
    margin-top: 0.25rem;
  }

  .pwa-setup__row {
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
    margin-top: 0.5rem;
  }

  .pwa-setup__btn {
    flex: 1 1 6rem;
    min-height: 2.25rem;
    padding: 0.4rem 0.5rem;
    border-radius: 0.3rem;
    border: 1px solid var(--border-menu-flyout);
    background: var(--surface-menu-content-control);
    color: var(--text-menu-content-primary);
    font: inherit;
    font-size: 0.78rem;
    cursor: pointer;
  }

  .pwa-setup__btn:hover {
    background: var(--surface-menu-content-control-hover);
  }

  .pwa-setup__btn--primary {
    font-weight: 600;
  }
</style>
