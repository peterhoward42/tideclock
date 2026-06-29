<script lang="ts">
  /**
   * Centred explainer after each keep-awake diagram-icon toggle.
   */
  interface Props {
    readonly message: string;
    readonly onDismiss: () => void;
  }

  let { message, onDismiss }: Props = $props();
</script>

<div
  class="home-keep-awake-explainer"
  role="dialog"
  aria-labelledby="home-keep-awake-explainer-message"
>
  <div class="home-keep-awake-explainer__card">
    <p class="home-keep-awake-explainer__message" id="home-keep-awake-explainer-message">
      {message}
    </p>
    <button type="button" class="home-keep-awake-explainer__btn" onclick={onDismiss}>
      OK
    </button>
  </div>
</div>

<style>
  .home-keep-awake-explainer {
    position: absolute;
    z-index: 35;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: max(1rem, env(safe-area-inset-top, 0px))
      max(1rem, env(safe-area-inset-right, 0px))
      max(1rem, env(safe-area-inset-bottom, 0px))
      max(1rem, env(safe-area-inset-left, 0px));
    box-sizing: border-box;
    pointer-events: none;
  }

  .home-keep-awake-explainer__card {
    pointer-events: auto;
    margin: 0;
    width: min(42ch, 100%);
    padding: 2.1dvh 2.5dvh 2.3dvh;
    background: color-mix(in srgb, var(--surface-menu-flyout) 94%, transparent);
    color: var(--text-menu-content-primary);
    border: max(1px, 0.12dvh) solid var(--border-menu-flyout);
    border-radius: 1.2dvh;
    box-shadow: var(--shadow-menu-flyout);
    backdrop-filter: blur(0.65dvh);
    font-size: 2.45dvh;
    line-height: 1.4;
  }

  @supports not (backdrop-filter: blur(1px)) {
    .home-keep-awake-explainer__card {
      background: var(--surface-menu-flyout);
    }
  }

  .home-keep-awake-explainer__message {
    margin: 0 0 1.5dvh;
    font-size: 1em;
    line-height: 1.45;
    color: var(--text-menu-content-primary);
  }

  .home-keep-awake-explainer__btn {
    width: 100%;
    min-height: 2.9em;
    padding: 0.5em 0.75em;
    border-radius: 1.1dvh;
    border: max(1px, 0.12dvh) solid var(--border-menu-flyout);
    background: var(--surface-menu-content-control);
    color: var(--text-menu-content-primary);
    font: inherit;
    font-size: 1.08em;
    font-weight: 600;
    cursor: pointer;
  }

  .home-keep-awake-explainer__btn:hover {
    background: var(--surface-menu-content-control-hover);
  }

  .home-keep-awake-explainer__btn:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
</style>
