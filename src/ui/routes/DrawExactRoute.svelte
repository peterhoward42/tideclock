<script lang="ts">
  import RouteShareClose from "../components/RouteShareClose.svelte";
  import { externalLinkNewTabAttrs } from "../externalLink";
  import { trackProductEvent } from "../../infrastructure/analytics/trackProductEvent";
  import {
    DRAWEXACT_URL,
    isDrawExactOutboundHref,
  } from "../../infrastructure/analytics/outboundLinkTelemetry";

  function handleOutboundTelemetryClick(event: MouseEvent): void {
    const anchor = event.currentTarget;
    if (!(anchor instanceof HTMLAnchorElement)) {
      return;
    }
    const href = anchor.getAttribute("href");
    if (href === null) {
      return;
    }
    if (isDrawExactOutboundHref(href)) {
      trackProductEvent("clicked_thru_to_drawexact");
    }
  }
</script>

<main class="route story-route">
  <h1>DrawExact</h1>

  <div class="story-route__body">
    <p>
      <a
        class="story-route__link"
        href={DRAWEXACT_URL}
        {...externalLinkNewTabAttrs}
        onclick={handleOutboundTelemetryClick}>DrawExact</a
      >
      is one of my other projects. It's the project I'm most proud of. It's a free
      drawing app that works in your browser — for drawings where it's the geometry
      that matters. It sits somewhere in between diagramming tools and full blown
      2D CAD.
    </p>

    <figure class="story-route__figure">
      <img
        class="story-route__img"
        src="/story-hook-diagram.png"
        width="645"
        height="1024"
        alt="Engineering diagram of a heavy-duty industrial hook with dimension lines and radii annotated in pink."
      />
      <figcaption class="story-route__caption">
        One of the classic 2D CAD examples - drawn in DrawExact
      </figcaption>
    </figure>

    <figure class="story-route__figure">
      <img
        class="story-route__img"
        src="/story-apple-logo-diagram.png"
        width="827"
        height="1024"
        alt="Geometric construction diagram of the Apple logo, with yellow outline curves and grey construction circles on a black background."
      />
      <figcaption class="story-route__caption">
        A playful take on the Apple logo - drawn in DrawExact
      </figcaption>
    </figure>

    <aside class="story-route__note" aria-label="Side note">
      <p>
        See the fun (and completely false)
        <a
          class="story-route__note-link"
          href="https://www.quora.com/Does-the-Apple-logo-really-adhere-to-the-golden-ratio"
          {...externalLinkNewTabAttrs}>conspiracy theory</a
        >
        that the real Apple logo is based on the mathematical Fibonacci series.
      </p>
    </aside>

    <p>
      <a
        class="story-route__link story-route__link--prominent"
        href={DRAWEXACT_URL}
        {...externalLinkNewTabAttrs}
        onclick={handleOutboundTelemetryClick}>Try DrawExact in your browser</a
      >
    </p>

    <RouteShareClose routeId="drawexact" />
  </div>
</main>

<style>
  .story-route {
    display: grid;
    gap: 1.25rem;
    max-width: 34rem;
  }

  .story-route h1 {
    font-size: 1.35rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-document-default);
  }

  .story-route__figure {
    margin: 0;
  }

  .story-route__img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 0.25rem;
  }

  .story-route__caption {
    margin: 0.4rem 0 0.55rem;
    font-size: 0.88rem;
    line-height: 1.4;
    color: var(--text-document-secondary);
  }

  .story-route__body {
    display: grid;
    gap: 0.85rem;
  }

  .story-route__body p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-document-default);
  }

  .story-route__link {
    color: var(--text-link-accent);
    text-decoration: underline;
    text-underline-offset: 0.12em;
  }

  .story-route__link--prominent {
    font-weight: 600;
  }

  .story-route__note {
    margin: 0.15rem 0 0;
    padding: 0.55rem 0 0 0.85rem;
    border-left: 2px solid
      color-mix(in srgb, var(--text-muted) 35%, transparent);
    max-width: 28rem;
  }

  .story-route__note p {
    margin: 0;
    font-size: 0.78rem;
    line-height: 1.45;
    font-style: italic;
    color: var(--text-muted);
  }

  .story-route__note-link {
    color: inherit;
    text-decoration: underline;
    text-underline-offset: 0.12em;
    text-decoration-color: color-mix(in srgb, currentColor 40%, transparent);
  }

  .story-route__note-link:hover {
    color: var(--text-link-accent);
    font-style: normal;
    text-decoration-color: currentColor;
  }
</style>
