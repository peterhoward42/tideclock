<script lang="ts">
  import CuriosityTunnelText from "./CuriosityTunnelText.svelte";
  import PrimaryNavLinks from "./PrimaryNavLinks.svelte";

  interface Props {
    readonly linksClassName: string;
    readonly showTodaysTidesLink?: boolean;
    /** Home flyout only: rainbow **Entertainment** continues the dial **Menu** thread. */
    readonly highlightEntertainmentLink?: boolean;
    readonly onNavigate?: () => void;
  }

  let {
    linksClassName,
    showTodaysTidesLink = true,
    highlightEntertainmentLink = false,
    onNavigate,
  }: Props = $props();
</script>

<nav class={linksClassName} aria-label="Primary">
  <PrimaryNavLinks {onNavigate} {showTodaysTidesLink} />
  <a href="#/onwall" onclick={() => onNavigate?.()}>Stick it on the wall</a>
  <a href="#/installconfig" onclick={() => onNavigate?.()}>Install</a>
  {#if highlightEntertainmentLink}
    <a
      class="curiosity-tunnel-link"
      href="#/entertainment"
      onclick={() => onNavigate?.()}
    >
      <CuriosityTunnelText text="Entertainment" />
    </a>
  {:else}
    <a href="#/entertainment" onclick={() => onNavigate?.()}>Entertainment</a>
  {/if}
  <a href="#/contact" onclick={() => onNavigate?.()}>Please get in touch</a>
</nav>
