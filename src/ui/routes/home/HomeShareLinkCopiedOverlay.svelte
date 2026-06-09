<script lang="ts">
  /**
   * Centred confirmation after copying a place share link from the diagram.
   */
  import { THE_TIDE_DIAL } from "../../brand";

  interface Props {
    readonly placeLine: string;
    readonly shareUrl: string;
    readonly onDismiss: () => void;
  }

  let { placeLine, shareUrl, onDismiss }: Props = $props();
</script>

<div
  class="home-share-copied"
  role="dialog"
  aria-labelledby="home-share-copied-lead"
  aria-describedby="home-share-copied-body"
>
  <div class="home-share-copied__card">
    <p class="home-share-copied__lead" id="home-share-copied-lead">Link copied</p>
    <p class="home-share-copied__body" id="home-share-copied-body">
      This link opens {THE_TIDE_DIAL} for {placeLine}.
    </p>
    <p class="home-share-copied__url" aria-label="Copied URL">{shareUrl}</p>
    <button type="button" class="home-share-copied__btn" onclick={onDismiss}>
      Done
    </button>
  </div>
</div>

<style>
  .home-share-copied {
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

  .home-share-copied__card {
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
    .home-share-copied__card {
      background: var(--surface-menu-flyout);
    }
  }

  .home-share-copied__lead {
    margin: 0 0 1dvh;
    font-size: 1.12em;
    font-weight: 600;
    line-height: 1.25;
  }

  .home-share-copied__body {
    margin: 0 0 1.2dvh;
    font-size: 1em;
    line-height: 1.45;
    color: var(--text-menu-content-primary);
  }

  .home-share-copied__url {
    margin: 0 0 1.5dvh;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 0.88em;
    line-height: 1.35;
    color: var(--text-menu-content-status);
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .home-share-copied__btn {
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

  .home-share-copied__btn:hover {
    background: var(--surface-menu-content-control-hover);
  }

  .home-share-copied__btn:focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 2px;
  }
</style>
