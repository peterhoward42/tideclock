<script lang="ts">
  import { CONTACT_EMAIL } from "../../support";
  import { copyTextToClipboard } from "../copyEmail";

  interface Props {
    readonly textClass?: string;
  }

  let { textClass = "" }: Props = $props();

  let copied = $state(false);
  let feedbackTimer: ReturnType<typeof setTimeout> | undefined;

  async function copyEmail(): Promise<void> {
    const ok = await copyTextToClipboard(CONTACT_EMAIL);
    if (!ok) {
      return;
    }

    copied = true;
    clearTimeout(feedbackTimer);
    feedbackTimer = setTimeout(() => {
      copied = false;
    }, 2000);
  }
</script>

<span class="copyable-email">
  <span class="copyable-email__text {textClass}">{CONTACT_EMAIL}</span>
  <button
    type="button"
    class="copyable-email__button"
    aria-label={copied ? "Email address copied" : "Copy email address"}
    onclick={copyEmail}
  >
    {#if copied}
      <svg
        class="copyable-email__icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <polyline points="20 6 9 17 4 12" />
      </svg>
    {:else}
      <svg
        class="copyable-email__icon"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        aria-hidden="true"
      >
        <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
      </svg>
    {/if}
  </button>
</span>

<style>
  .copyable-email {
    display: inline-flex;
    align-items: center;
    gap: 0.2rem;
    vertical-align: baseline;
  }

  .copyable-email__text {
    user-select: all;
  }

  .copyable-email__button {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 1.35rem;
    height: 1.35rem;
    padding: 0;
    border: 0;
    border-radius: 0.2rem;
    background: transparent;
    color: inherit;
    cursor: pointer;
    opacity: 0.72;
  }

  .copyable-email__button:hover {
    opacity: 1;
    background: color-mix(in srgb, currentColor 10%, transparent);
  }

  .copyable-email__button:focus-visible {
    outline: 2px solid var(--text-link-accent);
    outline-offset: 1px;
  }

  .copyable-email__icon {
    width: 0.85rem;
    height: 0.85rem;
  }
</style>
