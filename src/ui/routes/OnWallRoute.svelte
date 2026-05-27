<script lang="ts">
  import { THE_TIDE_DIAL } from "../brand";

  /** Plain-language install guide — for readers who want more than the on-page hint. */
  const LINK_INSTALL_PWA =
    "https://developer.mozilla.org/en-US/docs/Web/Progressive_web_apps/Guides/Installing";

  const heroPlace = {
    src: "/onwall-kitchen.png",
    width: 1024,
    height: 1024,
    alt: "Tablet on a kitchen shelf showing the tide dial among everyday items, left running like a small clock.",
    heading: "Like here in your kitchen.",
  } as const;

  const wallPlaces = [
    {
      src: "/onwall-guest-house.png",
      width: 1024,
      height: 1024,
      alt: "Wall-mounted screen in a coastal guest house reception showing the tide dial, with guests at the welcome desk and harbour views through the windows.",
      heading: "In your guesthouse hallway",
    },
    {
      src: "/onwall-pub.png",
      width: 1024,
      height: 1024,
      alt: "Wall-mounted screen in a harbour-side pub showing the tide dial above dining tables.",
      heading: "In your seaside cafe or pub",
    },
    {
      src: "/onwall-kayak-hire.png",
      width: 1024,
      height: 1024,
      alt: "Screen at a kayak hire counter showing the tide dial beside life jackets and hire signage.",
      heading: "In your watersports premises",
    },
  ] as const;
</script>

<main class="route onwall-route">
  <h1>Stick it on the wall</h1>

  <p class="onwall-route__p onwall-route__lead">
    {THE_TIDE_DIAL} is just a website like any other. But it was also designed
    carefully with some features that make it good on a permanent screen you
    <strong>leave on</strong>.
  </p>

  <div class="onwall-route__spots">
    <section class="onwall-route__spot" aria-labelledby="onwall-kitchen-heading">
      <h2 class="onwall-route__h" id="onwall-kitchen-heading">{heroPlace.heading}</h2>
      <figure class="onwall-route__figure">
        <img
          class="onwall-route__img"
          src={heroPlace.src}
          width={heroPlace.width}
          height={heroPlace.height}
          alt={heroPlace.alt}
        />
      </figure>
    </section>

    {#each wallPlaces as place, index}
      <section
        class="onwall-route__spot"
        aria-labelledby="onwall-place-{index}-heading"
      >
        <h2 class="onwall-route__h" id="onwall-place-{index}-heading">
          {place.heading}
        </h2>
        <figure class="onwall-route__figure">
          <img
            class="onwall-route__img"
            src={place.src}
            width={place.width}
            height={place.height}
            alt={place.alt}
            loading="lazy"
            decoding="async"
          />
        </figure>
      </section>
    {/each}
  </div>

  <section
    class="onwall-route__section"
    aria-labelledby="onwall-permanent-heading"
  >
    <h2 class="onwall-route__h" id="onwall-permanent-heading">
      Permanent screen features
    </h2>
    <p class="onwall-route__p">
      On the tablet you leave on the shelf or counter, install {THE_TIDE_DIAL} so
      it opens from its own icon. Then use the menu if you want the screen to
      stay on and the dial to fill the display.
    </p>
  </section>

  <section class="onwall-route__section" aria-labelledby="onwall-install">
    <h2 class="onwall-route__h" id="onwall-install">How to install</h2>
    <p class="onwall-route__p">
      Most people use an old iPad or Android tablet, plugged in where it can
      stay. Open {THE_TIDE_DIAL} on <strong>that</strong> tablet — not
      necessarily on the phone you are reading this on.
    </p>
    <p class="onwall-route__p">
      In the browser, look for <strong>Install</strong>,
      <strong>Add to Home Screen</strong>, or similar — often in the menu (⋯) or
      Share sheet. You want an icon on the home screen that opens the dial like
      a simple app, not a bookmark you hunt for in the browser. The exact label
      varies; if in doubt, pick the option that installs or adds the site.
    </p>
    <p class="onwall-route__p onwall-route__p--aside">
      Want step-by-step detail for your browser?
      <a
        class="onwall-route__link"
        href={LINK_INSTALL_PWA}
        target="_blank"
        rel="noopener noreferrer">Installing progressive web apps</a>
      (MDN).
    </p>
  </section>
</main>

<style>
  .onwall-route {
    display: grid;
    gap: 1.25rem;
    max-width: 34rem;
  }

  .onwall-route__lead {
    margin: 0;
  }

  .onwall-route__spots {
    display: grid;
    gap: 2rem;
  }

  .onwall-route__spot {
    display: grid;
    gap: 0.4rem;
  }

  .onwall-route__section {
    display: grid;
    gap: 0.4rem;
  }

  .onwall-route__h {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-document-default);
  }

  .onwall-route__p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-document-default);
  }

  .onwall-route__p--aside {
    font-size: 0.88rem;
    color: var(--text-document-secondary);
  }

  .onwall-route__link {
    color: var(--text-link-accent);
    text-decoration: underline;
    text-underline-offset: 0.12em;
  }

  .onwall-route__figure {
    margin: 0;
  }

  .onwall-route__img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 0.25rem;
  }

</style>
