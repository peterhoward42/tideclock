<script lang="ts">
  /**
   * First-run reading guide for visitors with no stored coastal place — anchored lower-left like
   * an instrument label (not a centred modal).
   */
  interface Props {
    readonly onDismiss: () => void;
    /** When not inside the instrument figure (e.g. no extremes to draw), pin to the viewport instead. */
    readonly useViewportFixed?: boolean;
  }

  let { onDismiss, useViewportFixed = false }: Props = $props();
</script>

<div
  class="default-loc-explainer"
  class:default-loc-explainer--viewport-fixed={useViewportFixed}
  role="region"
  aria-label="How to read this tide clock"
>
  <div class="default-loc-explainer__card">
    <p class="default-loc-explainer__hook">The colours aren't just for show …</p>
    <p class="default-loc-explainer__body">
      This is like a clock, but it shows all 24 hours around the curve.
    </p>
    <ul class="default-loc-explainer__key" aria-label="Colour key">
      <li>Green hand = the time now</li>
      <li>Purple markers = tide times and heights</li>
    </ul>
    <button
      type="button"
      class="default-loc-explainer__btn"
      onclick={onDismiss}
    >
      Got it
    </button>
  </div>
</div>

<style>
  /* Sizes in dvh — tuned to the former rem layout at ~390dvh mobile landscape. */
  .default-loc-explainer {
    position: absolute;
    z-index: 20;
    left: max(1.15dvh, env(safe-area-inset-left, 0px));
    bottom: max(1.15dvh, env(safe-area-inset-bottom, 0px));
    max-width: min(78dvh, calc(100% - 2.3dvh));
    box-sizing: border-box;
    pointer-events: none;
  }

  .default-loc-explainer--viewport-fixed {
    position: fixed;
  }

  .default-loc-explainer__card {
    pointer-events: auto;
    margin: 0;
    padding: 2.3dvh 2.7dvh 2.5dvh;
    background: color-mix(in srgb, var(--surface-menu-flyout) 92%, transparent);
    color: var(--text-menu-content-primary);
    border: max(1px, 0.12dvh) solid var(--border-menu-flyout);
    border-radius: 1.2dvh;
    box-shadow: var(--shadow-menu-flyout);
    backdrop-filter: blur(0.65dvh);
    font-size: 2.65dvh;
    line-height: 1.4;
  }

  @supports not (backdrop-filter: blur(1px)) {
    .default-loc-explainer__card {
      background: var(--surface-menu-flyout);
    }
  }

  .default-loc-explainer__hook {
    margin: 0 0 1.1dvh;
    font-size: 1.12em;
    font-weight: 600;
    line-height: 1.3;
    color: var(--text-menu-content-primary);
  }

  .default-loc-explainer__body {
    margin: 0 0 1.2dvh;
    font-size: 1em;
    line-height: 1.45;
    color: var(--text-menu-content-primary);
  }

  .default-loc-explainer__key {
    margin: 0 0 1.8dvh;
    padding-left: 4.1dvh;
    font-size: 1em;
    line-height: 1.45;
    color: var(--text-menu-content-primary);
  }

  .default-loc-explainer__key li {
    margin: 0.1em 0;
  }

  .default-loc-explainer__btn {
    width: 100%;
    min-height: 3.23em;
    padding: 0.54em 0.77em;
    border-radius: 1.1dvh;
    border: max(1px, 0.12dvh) solid var(--border-menu-flyout);
    background: var(--surface-menu-content-control);
    color: var(--text-menu-content-primary);
    font: inherit;
    font-size: 1.17em;
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
