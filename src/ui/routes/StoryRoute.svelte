<script lang="ts">
  import RouteShareClose from "../components/RouteShareClose.svelte";
  import { THE_TIDE_DIAL } from "../brand";
  import { VIRTUAL_COFFEE_URL } from "../../support";
  import { externalLinkNewTabAttrs } from "../externalLink";
  import { trackProductEvent } from "../../infrastructure/analytics/trackProductEvent";
  import { isCoffeeOutboundHref } from "../../infrastructure/analytics/outboundLinkTelemetry";

  function handleOutboundTelemetryClick(event: MouseEvent): void {
    const anchor = event.currentTarget;
    if (!(anchor instanceof HTMLAnchorElement)) {
      return;
    }
    const href = anchor.getAttribute("href");
    if (href === null) {
      return;
    }
    if (isCoffeeOutboundHref(href)) {
      trackProductEvent("clicked_thru_to_coffee");
    }
  }
</script>

<main class="route story-route">
  <h1>The story</h1>

  <figure class="story-route__figure">
    <img
      class="story-route__img"
      src="/story-terras-bridge-flooded.png"
      width="1024"
      height="949"
      alt="A rural road flooded by still water at a tidal ford, with frost on a hill and morning light reflecting off the surface."
    />
    <figcaption class="story-route__caption">
      Terras Crossing (Looe) at high tide
    </figcaption>
  </figure>

  <div class="story-route__body">
    <p>
      The road to my house crosses a river, and the bridge floods so much at
      high tides I go kayaking there. Not so good however for popping out in the
      car for a pint of milk.
    </p>
    <p>
      Tides can be a source of delight and interest when you visit a tidal
      place. They reveal another rhythm interwoven with everyday life. The
      fishing fleet returning to port when the tide is high. People exploring
      the exposed shore at low tides. Wait! wasn't there a beach there
      yesterday? You'll notice the tide times creeping forward by just under an
      hour each day. You'll wonder why some tides are huge and some are tame.
    </p>
    <p>
      You can look up the tide times in tables. But they just show numbers, and
      more numbers. I find myself trying to figure out the big picture ebb and
      flow pattern of the day - to help me organise my day.
    </p>
    <p>
      So I made The Tide Dial - to bridge that gap and paint the picture for me.
    </p>

    <figure class="story-route__figure">
      <img
        class="story-route__img"
        src="/story-phone-ramsgate.jpg"
        width="1024"
        height="1024"
        alt="Someone holding a phone in landscape at a rocky beach; the screen shows The Tide Dial for Ramsgate with the time hand and today's tide markers."
      />
      <figcaption class="story-route__caption">
        Ah! Just over 3 hours before the tide's fully out
      </figcaption>
    </figure>

    <aside class="story-route__support" aria-label="Optional support">
      <p>
        If you've enjoyed {THE_TIDE_DIAL} - and would like perhaps to buy me a
        <a
          class="story-route__support-link"
          href={VIRTUAL_COFFEE_URL}
          {...externalLinkNewTabAttrs}
          onclick={handleOutboundTelemetryClick}>coffee</a
        >
        - to say thanks, or make a small contribution towards my ongoing tide-data
        costs - I would have no great objection.
      </p>
    </aside>

    <RouteShareClose routeId="story" />
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

  .story-route__support {
    margin: 0.65rem 0 1rem;
    padding: 0.9rem 1rem 0.95rem;
    border: 1px solid color-mix(in srgb, #d97706 28%, var(--border-subtle));
    border-left: 3px solid #d97706;
    border-radius: 0.35rem;
    background: color-mix(in srgb, #fef3c7 42%, var(--surface-panel));
    box-shadow: 0 1px 4px rgb(15 23 42 / 0.07);
    display: grid;
    gap: 0.4rem;
  }

  .story-route__support p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--text-document-default);
  }

  .story-route__support-link {
    font-weight: 600;
    color: #92400e;
    text-decoration: none;
    padding: 0.12em 0.42em;
    border-radius: 0.2em;
    background: color-mix(in srgb, #fff 75%, #fef3c7);
    border: 1px solid color-mix(in srgb, #d97706 35%, transparent);
  }

  .story-route__support-link:hover {
    color: #78350f;
    background: #fff;
    border-color: color-mix(in srgb, #d97706 55%, transparent);
  }
</style>
