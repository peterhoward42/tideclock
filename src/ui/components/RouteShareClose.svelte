<script lang="ts">
  import { copyTextToClipboard } from "../copyEmail";
  import { buildRouteShareUrl, type ShareableRouteId } from "../routeShareUrl";

  interface Props {
    readonly routeId: ShareableRouteId;
  }

  let { routeId }: Props = $props();

  let copied = $state(false);
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

  async function copyShareLink(): Promise<void> {
    const ok = await copyTextToClipboard(buildRouteShareUrl(routeId));
    if (!ok) {
      return;
    }

    copied = true;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<aside class="route-share-close" aria-label="Share this page">
  {#if copied}
    <p class="route-share-close__text">Link copied — share it if you like.</p>
  {:else}
    <p class="route-share-close__text">
      Enjoyed this?
      <button
        type="button"
        class="route-share-close__button"
        onclick={copyShareLink}
      >
        Copy link
      </button>
      to share.
    </p>
  {/if}
</aside>

<style>
  .route-share-close {
    margin: 0.75rem 0 0;
    padding: 0.85rem 0 0;
    border-top: 1px solid color-mix(in srgb, var(--text-muted) 22%, transparent);
  }

  .route-share-close__text {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.5;
    color: var(--text-document-secondary);
  }

  .route-share-close__button {
    margin: 0;
    padding: 0;
    border: 0;
    background: transparent;
    font: inherit;
    font-weight: 600;
    color: var(--text-link-accent);
    text-decoration: underline;
    text-underline-offset: 0.12em;
    cursor: pointer;
  }

  .route-share-close__button:hover {
    color: var(--text-document-default);
  }

  .route-share-close__button:focus-visible {
    outline: 2px solid var(--text-link-accent);
    outline-offset: 2px;
  }
</style>
