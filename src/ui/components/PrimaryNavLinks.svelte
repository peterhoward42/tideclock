<script lang="ts">
  /**
   * Primary route links shared by header and home menu panels.
   * Parent supplies the surrounding `<nav>` (see `PrimaryMenuContent`).
   */

  interface Props {
    readonly onNavigate?: () => void;
    /** Wayfinding back to the dial; omitted on the home flyout (user is already there). */
    readonly showTodaysTidesLink?: boolean;
  }

  let { onNavigate, showTodaysTidesLink = true }: Props = $props();

  function handleNavigate(): void {
    onNavigate?.();
  }
</script>

{#if showTodaysTidesLink}
  <a href="#/home" onclick={handleNavigate}>Today's Tides</a>
{/if}
