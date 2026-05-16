<script lang="ts">
  /**
   * Keep-screen-awake preference + one-line status (menu panel or standalone setup).
   */
  import type { WakeLockPresentation } from "./wakeLockPresentation";
  import { formatPwaWakeStatusLine } from "./pwaUi";

  interface Props {
    readonly isHomeRoute: boolean;
    readonly userWants: boolean;
    readonly homePresentation: WakeLockPresentation | null;
    /** When false, the toggle is non-interactive (e.g. API missing). */
    readonly toggleEnabled: boolean;
    onToggle: (next: boolean) => void;
  }

  let {
    isHomeRoute,
    userWants,
    homePresentation,
    toggleEnabled,
    onToggle,
  }: Props = $props();

  const line = $derived(
    formatPwaWakeStatusLine(isHomeRoute, userWants, homePresentation),
  );
</script>

<div class="pwa-display">
  <p class="pwa-display__line" id="pwa-keep-awake-status" role="status" aria-live="polite">
    {line}
  </p>
  <label class="pwa-display__row">
    <input
      type="checkbox"
      class="pwa-display__check"
      checked={userWants}
      disabled={!toggleEnabled}
      aria-labelledby="pwa-keep-awake-status"
      onchange={(e) => {
        const c = e.currentTarget;
        onToggle(c.checked);
      }}
    />
  </label>
</div>

<style>
  .pwa-display {
    display: grid;
    gap: 0.4rem;
    margin-top: 0.35rem;
  }

  .pwa-display__line {
    margin: 0;
    font-size: 0.76rem;
    line-height: 1.35;
    color: var(--text-menu-content-status);
  }

  .pwa-display__row {
    display: block;
    cursor: pointer;
  }

  .pwa-display__check {
    width: 1rem;
    height: 1rem;
  }
</style>
