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
<a href="#/location" onclick={handleNavigate}
  >Set <span class="primary-nav-links__emph-your">your</span> location</a
>

<style>
  .primary-nav-links__emph-your {
    font-weight: 600;
    font-style: normal;
  }
</style>
