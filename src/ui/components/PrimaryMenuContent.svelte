<script lang="ts">
  import CopyableEmail from "./CopyableEmail.svelte";
  import PrimaryNavLinks from "./PrimaryNavLinks.svelte";

  interface Props {
    readonly linksClassName: string;
    readonly nerdsOpen: boolean;
    readonly onToggleNerds: () => void;
    readonly contactOpen: boolean;
    readonly onToggleContact: () => void;
    readonly onNavigate?: () => void;
  }

  let {
    linksClassName,
    nerdsOpen,
    onToggleNerds,
    contactOpen,
    onToggleContact,
    onNavigate,
  }: Props = $props();
</script>

<nav class={linksClassName} aria-label="Primary">
  <PrimaryNavLinks {onNavigate} />
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
  <button
    type="button"
    class="primary-menu-content__action"
    aria-expanded={contactOpen}
    aria-controls="primary-menu-contact-panel"
    onclick={onToggleContact}
  >
    Contact
  </button>
  {#if contactOpen}
    <section
      id="primary-menu-contact-panel"
      class="primary-menu-content__contact-panel"
      aria-label="Contact"
      aria-live="polite"
    >
      <p class="primary-menu-content__contact-body">
        Questions, bug reports, thoughtful suggestions.
      </p>
      <p class="primary-menu-content__contact-body">
        This app is personally designed and maintained by me, so responses may
        occasionally be slow, but I do read everything.
      </p>
      <p class="primary-menu-content__contact-email">
        <CopyableEmail />
      </p>
    </section>
  {/if}
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

  .primary-menu-content__contact-panel {
    margin-top: 0.35rem;
    padding: 0.45rem 0.5rem;
    border: 1px solid var(--border-menu-content-inset);
    border-radius: 0.25rem;
    background: var(--surface-menu-content-inset);
    color: var(--text-menu-content-primary);
  }

  .primary-menu-content__contact-body {
    margin: 0.4rem 0 0;
    font-size: 0.8rem;
    line-height: 1.35;
  }

  .primary-menu-content__contact-body:first-child {
    margin-top: 0;
  }

  .primary-menu-content__contact-email {
    margin: 0.45rem 0 0;
    font-size: 0.8rem;
    line-height: 1.35;
  }
</style>
