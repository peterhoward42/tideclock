<script lang="ts">
  /**
   * Shown after “Really fullscreen” on browsers that cannot hide all chrome (mainly iOS).
   * Lives inside the diagram host so it remains visible while the page is fullscreen.
   */
  interface Props {
    readonly lead: string;
    readonly body: string;
    readonly onDismiss: () => void;
  }

  let { lead, body, onDismiss }: Props = $props();
</script>

<div
  class="home-fullscreen-advice"
  role="dialog"
  aria-labelledby="home-fullscreen-advice-lead"
  aria-describedby="home-fullscreen-advice-body"
>
  <div class="home-fullscreen-advice__card">
    <p class="home-fullscreen-advice__lead" id="home-fullscreen-advice-lead">{lead}</p>
    <p class="home-fullscreen-advice__body" id="home-fullscreen-advice-body">{body}</p>
    <button type="button" class="home-fullscreen-advice__btn" onclick={onDismiss}>
      OK
    </button>
  </div>
</div>

<style>
  .home-fullscreen-advice {
    position: absolute;
    z-index: 25;
    right: max(1.15dvh, env(safe-area-inset-right, 0px));
    top: max(1.15dvh, env(safe-area-inset-top, 0px));
    max-width: min(52dvh, calc(100% - 2.3dvh));
    box-sizing: border-box;
    pointer-events: none;
  }

  .home-fullscreen-advice__card {
    pointer-events: auto;
    margin: 0;
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
    .home-fullscreen-advice__card {
      background: var(--surface-menu-flyout);
    }
  }

  .home-fullscreen-advice__lead {
    margin: 0 0 1dvh;
    font-size: 1.12em;
    font-weight: 600;
    line-height: 1.25;
  }

  .home-fullscreen-advice__body {
    margin: 0 0 1.5dvh;
    font-size: 1em;
    line-height: 1.45;
    color: var(--text-menu-content-primary);
  }

  .home-fullscreen-advice__btn {
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

  .home-fullscreen-advice__btn:hover {
    background: var(--surface-menu-content-control-hover);
  }

  .home-fullscreen-advice__btn:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
</style>
