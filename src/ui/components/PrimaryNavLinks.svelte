<script lang="ts">
  /**
   * Primary route links shared by header and home menu panels.
   */
  interface Props {
    readonly className?: string;
    readonly onNavigate?: () => void;
  }

  let { className = "nav-links", onNavigate }: Props = $props();

  function handleNavigate(): void {
    onNavigate?.();
  }
</script>

<nav class={className} aria-label="Primary">
  <a href="#/home" onclick={handleNavigate}>Home</a>
  <a href="#/location2" onclick={handleNavigate}>Location</a>
  <a href="#/settings" onclick={handleNavigate}>Settings</a>
  <a href="#/about" onclick={handleNavigate}>About</a>
  <a href="#/acknowledgements" onclick={handleNavigate}>Acknowledgements</a>
  <a href="#/support" onclick={handleNavigate}>Support</a>
  <a href="#/cookies" onclick={handleNavigate}>Cookies</a>
</nav>
