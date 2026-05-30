<script lang="ts">
  /**
   * Keep-screen-awake preference + one-line status (menu panel).
   */
  import type { WakeLockPresentation } from "./wakeLockPresentation";
  import { formatKeepAwakeStatusLine } from "./keepAwakeUi";

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
    formatKeepAwakeStatusLine(isHomeRoute, userWants, homePresentation),
  );
</script>

<div class="keep-awake">
  <p class="keep-awake__line" id="keep-awake-status" role="status" aria-live="polite">
    {line}
  </p>
  <label class="keep-awake__row">
    <input
      type="checkbox"
      class="keep-awake__check"
      checked={userWants}
      disabled={!toggleEnabled}
      aria-labelledby="keep-awake-status"
      onchange={(e) => {
        const c = e.currentTarget;
        onToggle(c.checked);
      }}
    />
  </label>
</div>

<style>
  .keep-awake {
    display: grid;
    gap: 0.4rem;
    margin-top: 0.35rem;
  }

  .keep-awake__line {
    margin: 0;
    font-size: 0.76rem;
    line-height: 1.35;
    color: var(--text-menu-content-status);
  }

  .keep-awake__row {
    display: block;
    cursor: pointer;
  }

  .keep-awake__check {
    width: 1rem;
    height: 1rem;
  }
</style>
