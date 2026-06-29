<script lang="ts">
  import type { Snippet } from "svelte";

  export interface HubChildLink {
    readonly href: string;
    readonly label: string;
    readonly pitch: string;
  }

  interface Props {
    readonly title: string;
    readonly links: readonly HubChildLink[];
    readonly linksAriaLabel: string;
    readonly routeClass?: string;
    readonly intro?: Snippet;
  }

  let {
    title,
    links,
    linksAriaLabel,
    routeClass = "",
    intro,
  }: Props = $props();
</script>

<main class="route hub-route {routeClass}">
  <h1>{title}</h1>

  {#if intro}
    <div class="hub-route__intro">
      {@render intro()}
    </div>
  {/if}

  <ul class="hub-route__links" aria-label={linksAriaLabel}>
    {#each links as link (link.href)}
      <li class="hub-route__item">
        <a class="hub-route__link" href={link.href}>{link.label}</a>
        <p class="hub-route__pitch">{link.pitch}</p>
      </li>
    {/each}
  </ul>
</main>

<style>
  .hub-route {
    display: grid;
    gap: 1.25rem;
    max-width: 34rem;
  }

  .hub-route h1 {
    font-size: 1.35rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-document-default);
  }

  .hub-route__intro {
    display: grid;
    gap: 0.85rem;
  }

  .hub-route__intro :global(p) {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-document-default);
  }

  .hub-route__links {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 1rem;
  }

  .hub-route__item {
    display: grid;
    gap: 0.25rem;
  }

  .hub-route__link {
    font-size: 1.05rem;
    font-weight: 600;
    color: var(--text-link-accent);
    text-decoration: underline;
    text-underline-offset: 0.12em;
    width: fit-content;
  }

  .hub-route__pitch {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-document-secondary);
  }
</style>
