<script lang="ts">
  /**
   * Dev-only DOM summary tooling (`?domDump=`); refresh triggers parent snapshot logic.
   */
  interface Props {
    readonly domSummary: string;
    readonly onRefreshDomSummary: () => void;
  }

  let { domSummary, onRefreshDomSummary }: Props = $props();
</script>

<div class="home-debug">
  <button type="button" class="home-debug__btn" onclick={onRefreshDomSummary}
    >Refresh DOM summary</button
  >
  <details open>
    <summary>Home route DOM (summary)</summary>
    <pre class="home-debug__pre">{domSummary}</pre>
  </details>
</div>

<style>
  .home-debug {
    padding: 0.5rem 0.75rem;
    background: #0b1020;
    color: #e5e7eb;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      "Liberation Mono", "Courier New", monospace;
    font-size: 12px;
  }

  .home-debug__btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: inherit;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    cursor: pointer;
    margin-bottom: 0.5rem;
  }

  .home-debug__pre {
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 35vh;
    overflow: auto;
    margin: 0.5rem 0 0;
  }
</style>
