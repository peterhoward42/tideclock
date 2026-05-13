<script lang="ts">
  /**
   * Primary route links shared by header and home menu panels.
   */
  import { TIDECLOCK_BUILD_COMMIT } from "../../buildCommit";

  type NavPart = "all" | "prefix" | "suffix";

  interface Props {
    readonly className?: string;
    readonly onNavigate?: () => void;
    /** `prefix` / `suffix`: link fragments only (parent supplies `<nav>`). */
    readonly part?: NavPart;
  }

  let {
    className = "nav-links",
    onNavigate,
    part = "all",
  }: Props = $props();

  function handleNavigate(): void {
    onNavigate?.();
  }
</script>

{#snippet prefixLinks()}
  <a href="#/home" onclick={handleNavigate}>Home</a>
  <a href="#/location" onclick={handleNavigate}
    >Set <span class="primary-nav-links__emph-your">your</span> location</a
  >
{/snippet}

{#snippet suffixLinks()}
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
{/snippet}

{#if part === "all"}
  <nav class={className} aria-label="Primary">
    {@render prefixLinks()}
    {@render suffixLinks()}
  </nav>
{:else if part === "prefix"}
  {@render prefixLinks()}
{:else}
  {@render suffixLinks()}
{/if}

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
