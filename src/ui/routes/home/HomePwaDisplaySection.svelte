<script lang="ts">
  /**
   * Keep-screen-awake preference + one-line status (menu panel or standalone setup).
   */
  import type { WakeLockPresentation } from "./wakeLockPresentation";
  import { formatPwaWakeStatusLine } from "./pwaUi";

  interface Props {
    readonly apiSupported: boolean;
    readonly isHomeRoute: boolean;
    readonly userWants: boolean;
    readonly homePresentation: WakeLockPresentation | null;
    readonly showBatteryBlurb: boolean;
    /** When false, the toggle is non-interactive (e.g. API missing). */
    readonly toggleEnabled: boolean;
    onToggle: (next: boolean) => void;
  }

  let {
    apiSupported,
    isHomeRoute,
    userWants,
    homePresentation,
    showBatteryBlurb,
    toggleEnabled,
    onToggle,
  }: Props = $props();

  const line = $derived(
    formatPwaWakeStatusLine(isHomeRoute, userWants, homePresentation),
  );
</script>

<div class="pwa-display">
  <p class="pwa-display__label" id="pwa-keep-awake-label">Keep screen awake</p>
  <p class="pwa-display__line" role="status" aria-live="polite">
    {line}
  </p>
  <label class="pwa-display__row">
    <input
      type="checkbox"
      class="pwa-display__check"
      checked={userWants}
      disabled={!toggleEnabled}
      aria-labelledby="pwa-keep-awake-label"
      onchange={(e) => {
        const c = e.currentTarget;
        onToggle(c.checked);
      }}
    />
    <span class="pwa-display__hint">
      {apiSupported
        ? "Stops the screen from dimming while the tide view is open and in front."
        : "This browser does not support wake lock. Other controls still work."}
    </span>
  </label>
  {#if showBatteryBlurb && userWants && apiSupported}
    <p class="pwa-display__battery">
      Unplugged, keeping the display on can drain the battery and warm the device.
    </p>
  {/if}
</div>

<style>
  .pwa-display {
    display: grid;
    gap: 0.4rem;
    margin-top: 0.35rem;
  }

  .pwa-display__label {
    margin: 0;
    font-size: 0.9rem;
    font-weight: 600;
  }

  .pwa-display__line {
    margin: 0;
    font-size: 0.76rem;
    line-height: 1.35;
    color: var(--text-menu-content-status);
  }

  .pwa-display__row {
    display: grid;
    grid-template-columns: auto 1fr;
    align-items: start;
    gap: 0.4rem 0.5rem;
    font-size: 0.8rem;
    line-height: 1.35;
    cursor: pointer;
  }

  .pwa-display__check {
    margin-top: 0.12rem;
    width: 1rem;
    height: 1rem;
    flex-shrink: 0;
  }

  .pwa-display__hint {
    color: var(--text-menu-content-primary);
  }

  .pwa-display__battery {
    margin: 0;
    font-size: 0.72rem;
    line-height:1.3;
    color: var(--text-menu-content-status);
  }
</style>
