<script lang="ts">
  /**
   * First-run panel when no coastal place is stored yet: tides use the shipped default (Looe)
   * until the visitor dismisses; dismissal persists that default like a normal menu pick.
   */
  interface Props {
    onDismiss: () => void;
  }

  let { onDismiss }: Props = $props();
</script>

<div class="default-loc-explainer" role="presentation">
  <div
    class="default-loc-explainer__card"
    role="dialog"
    aria-modal="true"
    aria-labelledby="default-loc-explainer-title"
  >
    <p class="default-loc-explainer__eyebrow">Welcome</p>
    <h2 id="default-loc-explainer-title" class="default-loc-explainer__title">
      Showing tides for Looe, Cornwall
    </h2>
    <p class="default-loc-explainer__body">
      Start here, then set your own location from the menu.
    </p>
    <button type="button" class="default-loc-explainer__btn" onclick={onDismiss}>
      Continue
    </button>
  </div>
</div>

<style>
  .default-loc-explainer {
    position: fixed;
    inset: 0;
    z-index: 45;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: max(0.75rem, env(safe-area-inset-top, 0.75rem))
      max(0.75rem, env(safe-area-inset-right, 0.75rem))
      max(0.75rem, env(safe-area-inset-bottom, 0.75rem))
      max(0.75rem, env(safe-area-inset-left, 0.75rem));
    box-sizing: border-box;
    background: rgba(15, 23, 42, 0.48);
    pointer-events: auto;
  }

  .default-loc-explainer__card {
    width: min(22rem, 100%);
    margin: 0;
    padding: 0.85rem 0.95rem;
    background: var(--surface-menu-flyout);
    color: var(--text-menu-content-primary);
    border: 1px solid var(--border-menu-flyout);
    border-radius: 0.375rem;
    box-shadow: var(--shadow-menu-flyout);
  }

  .default-loc-explainer__eyebrow {
    margin: 0 0 0.25rem;
    font-size: 0.68rem;
    font-weight: 700;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    color: var(--text-menu-content-status);
  }

  .default-loc-explainer__title {
    margin: 0 0 0.35rem;
    font-size: 0.95rem;
    font-weight: 600;
    line-height: 1.25;
  }

  .default-loc-explainer__body {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.45;
    color: var(--text-menu-content-primary);
  }

  .default-loc-explainer__btn {
    margin-top: 0.65rem;
    width: 100%;
    min-height: 2.35rem;
    padding: 0.45rem 0.6rem;
    border-radius: 0.3rem;
    border: 1px solid var(--border-menu-flyout);
    background: var(--surface-menu-content-control);
    color: var(--text-menu-content-primary);
    font: inherit;
    font-size: 0.82rem;
    font-weight: 600;
    cursor: pointer;
  }

  .default-loc-explainer__btn:hover {
    background: var(--surface-menu-content-control-hover);
  }

  .default-loc-explainer__btn:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
</style>
