<script lang="ts">
  /**
   * Primary route links shared by header and home menu panels.
   */
  import { TIDECLOCK_BUILD_COMMIT } from "../../buildCommit";

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
  <a href="#/home" onclick={handleNavigate}>Back to the diagram</a>
  <a href="#/location2" onclick={handleNavigate}>Set <span class="primary-nav-links__emph-your">your</span> location</a>
  <a href="#/settings" onclick={handleNavigate}>Settings</a>
  <div class="primary-nav-links__about-row">
    <a href="#/about" onclick={handleNavigate}>About</a>
    {#if TIDECLOCK_BUILD_COMMIT !== ""}
      <code
        class="primary-nav-links__build-sha"
        title="Deployment build (git commit, short)"
      >{TIDECLOCK_BUILD_COMMIT}</code>
    {/if}
  </div>
  <a href="#/acknowledgements" onclick={handleNavigate}>Acknowledgements</a>
  <a href="#/support" onclick={handleNavigate}>Support</a>
  <a href="#/cookies" onclick={handleNavigate}>Cookies</a>
</nav>

<style>
  .primary-nav-links__emph-your {
    font-weight: 600;
    font-style: normal;
  }

  .primary-nav-links__about-row {
    display: flex;
    flex-direction: column;
    gap: 0.1rem;
  }

  .primary-nav-links__build-sha {
    margin: 0 0 0 var(--space-3);
    padding: 0 0 var(--space-2);
    font-size: 0.68rem;
    font-weight: 500;
    color: var(--text-menu-content-status, var(--text-muted));
    letter-spacing: 0.04em;
    background: none;
  }
</style>
