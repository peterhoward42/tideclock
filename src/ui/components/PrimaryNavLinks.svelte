<script lang="ts">
  /**
   * Primary route links shared by header and home menu panels.
   * Parent supplies the surrounding `<nav>` (see `PrimaryMenuContent`).
   */

  interface Props {
    readonly onNavigate?: () => void;
  }

  let { onNavigate }: Props = $props();

  function handleNavigate(): void {
    onNavigate?.();
  }
</script>

<a href="#/home" onclick={handleNavigate}>Home</a>
