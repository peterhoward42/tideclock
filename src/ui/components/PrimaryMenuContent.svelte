<script lang="ts">
  import PrimaryNavLinks from "./PrimaryNavLinks.svelte";

  interface Props {
    readonly linksClassName: string;
    readonly showTodaysTidesLink?: boolean;
    readonly onNavigate?: () => void;
  }

  let {
    linksClassName,
    showTodaysTidesLink = true,
    onNavigate,
  }: Props = $props();
</script>

<nav class={linksClassName} aria-label="Primary">
  <PrimaryNavLinks {onNavigate} {showTodaysTidesLink} />
  <a href="#/onwall" onclick={() => onNavigate?.()}>Stick it on the wall</a>
  <a href="#/installconfig" onclick={() => onNavigate?.()}
    >Install / Config / Settings</a
  >
  <a href="#/entertainment" onclick={() => onNavigate?.()}>Entertainment</a>
  <a href="#/contact" onclick={() => onNavigate?.()}>Please get in touch</a>
</nav>
