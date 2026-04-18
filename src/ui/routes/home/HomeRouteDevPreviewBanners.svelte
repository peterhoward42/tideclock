<script lang="ts">
  /**
   * Dev-only status banners for diagram preview and tide UX preview query modes.
   */
  interface Props {
    readonly diagramPreviewBannerLine: string | null;
    readonly tideUxDevPreviewBannerLine: string | null;
  }

  let { diagramPreviewBannerLine, tideUxDevPreviewBannerLine }: Props = $props();
</script>

{#if import.meta.env.DEV && diagramPreviewBannerLine !== null}
  <div class="home-diagram-preview-banner" role="status">
    {diagramPreviewBannerLine}
  </div>
{/if}
{#if import.meta.env.DEV && tideUxDevPreviewBannerLine !== null}
  <div class="home-tide-ux-preview-banner" role="status">
    {tideUxDevPreviewBannerLine}
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

  .home-tide-ux-preview-banner {
    flex: 0 0 auto;
    padding: 0.35rem 0.75rem;
    background: #172554;
    color: #dbeafe;
    font-size: 0.75rem;
    font-weight: 600;
    border-bottom: 1px solid rgb(96 165 250 / 0.35);
  }
</style>
