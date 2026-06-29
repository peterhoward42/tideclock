<script lang="ts">
  import PrimaryNavLinks from "./PrimaryNavLinks.svelte";

  interface Props {
    readonly linksClassName: string;
    readonly showTodaysTidesLink?: boolean;
    readonly nerdsOpen: boolean;
    readonly onToggleNerds: () => void;
    readonly onNavigate?: () => void;
  }

  let {
    linksClassName,
    showTodaysTidesLink = true,
    nerdsOpen,
    onToggleNerds,
    onNavigate,
  }: Props = $props();
</script>

<nav class={linksClassName} aria-label="Primary">
  <PrimaryNavLinks {onNavigate} {showTodaysTidesLink} />
  <a href="#/install" onclick={() => onNavigate?.()}
    >Install app / Add to home screen</a
  >
  <a href="#/onwall" onclick={() => onNavigate?.()}>Stick it on the wall</a>
  <a href="#/story" onclick={() => onNavigate?.()}>Story</a>
  <button
    type="button"
    class="primary-menu-content__action"
    aria-expanded={nerdsOpen}
    aria-controls="primary-menu-nerds-panel"
    onclick={onToggleNerds}
  >
    For nerds
  </button>
  {#if nerdsOpen}
    <section
      id="primary-menu-nerds-panel"
      class="primary-menu-content__nerds-panel"
      aria-label="For nerds"
    >
      <a href="#/tidenerd" onclick={() => onNavigate?.()}>Tide Nerd</a>
      <a href="#/softwarenerd" onclick={() => onNavigate?.()}>Software Nerd</a>
    </section>
  {/if}
  <a href="#/about" onclick={() => onNavigate?.()}>About</a>
  <a href="#/contact" onclick={() => onNavigate?.()}>Please get in touch</a>
</nav>

<style>
  .primary-menu-content__action {
    margin-top: 0.35rem;
    width: 100%;
    border: 0;
    border-radius: 0.25rem;
    background: var(--surface-menu-content-control);
    color: var(--text-menu-content-primary);
    text-align: left;
    padding: 0.45rem 0.5rem;
    font: inherit;
    cursor: pointer;
  }

  .primary-menu-content__action:hover {
    background: var(--surface-menu-content-control-hover);
  }

  .primary-menu-content__nerds-panel {
    margin-top: 0.35rem;
    padding: 0.45rem 0.5rem;
    border: 1px solid var(--border-menu-content-inset);
    border-radius: 0.25rem;
    background: var(--surface-menu-content-inset);
    display: grid;
    gap: 0.35rem;
  }

  .primary-menu-content__nerds-panel a {
    color: var(--text-menu-content-primary);
    font-size: 0.85rem;
    line-height: 1.35;
    text-decoration: none;
  }

  .primary-menu-content__nerds-panel a:hover {
    text-decoration: underline;
    text-underline-offset: 0.1em;
  }
</style>
