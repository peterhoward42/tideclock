<script lang="ts">
  /**
   * Skippable first-launch card in installed (standalone) mode for keep-awake and display.
   */
  import HomePwaDisplaySection from "./HomePwaDisplaySection.svelte";
  import type { HomeWakeLockPresentation } from "./homeRouteWakeLockPresentation";

  interface Props {
    readonly apiSupported: boolean;
    readonly isHomeRoute: true;
    readonly userWants: boolean;
    readonly homePresentation: HomeWakeLockPresentation | null;
    readonly showBatteryBlurb: boolean;
    readonly toggleEnabled: boolean;
    onToggleKeepAwake: (next: boolean) => void;
    onDismissThisSession: () => void;
    onDismissForever: () => void;
  }

  let {
    apiSupported,
    isHomeRoute,
    userWants,
    homePresentation,
    showBatteryBlurb,
    toggleEnabled,
    onToggleKeepAwake,
    onDismissThisSession,
    onDismissForever,
  }: Props = $props();
</script>

<section class="pwa-setup" aria-label="App display settings" aria-live="polite">
  <p class="pwa-setup__title">Running in the installed app</p>
  <p class="pwa-setup__lede">
    A quick tip: you can keep the tide view from sleeping while the app stays open. Change this
    anytime from <strong>Menu</strong> → <strong>App display</strong>.
  </p>
  <HomePwaDisplaySection
    {apiSupported}
    {isHomeRoute}
    {userWants}
    {homePresentation}
    {showBatteryBlurb}
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

  .pwa-setup__title {
    margin: 0 0 0.35rem;
    font-size: 0.9rem;
    font-weight: 600;
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
