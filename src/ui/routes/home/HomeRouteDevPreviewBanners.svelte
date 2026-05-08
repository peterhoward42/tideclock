<script lang="ts">
  /**
   * Dev-only status banners for diagram preview and tide UX preview query modes.
   */
  interface Props {
    readonly diagramPreviewBannerLine: string | null;
    readonly tidePreviewBannerLine: string | null;
  }

  let { diagramPreviewBannerLine, tidePreviewBannerLine }: Props = $props();
</script>

{#if import.meta.env.DEV && diagramPreviewBannerLine !== null}
  <div class="home-diagram-preview-banner" role="status">
    {diagramPreviewBannerLine}
  </div>
{/if}
{#if import.meta.env.DEV && tidePreviewBannerLine !== null}
  <div class="home-tide-preview-banner" role="status">
    {tidePreviewBannerLine}
  </div>
{/if}

<style>
  .home-diagram-preview-banner {
    flex: 0 0 auto;
    padding: 0.35rem 0.75rem;
    background: #422006;
    color: #fef3c7;
    font-size: 0.75rem;
    font-weight: 600;
    border-bottom: 1px solid rgb(251 191 36 / 0.35);
  }

  .home-tide-preview-banner {
    flex: 0 0 auto;
    padding: 0.35rem 0.75rem;
    background: #172554;
    color: #dbeafe;
    font-size: 0.75rem;
    font-weight: 600;
    border-bottom: 1px solid rgb(96 165 250 / 0.35);
  }
</style>
