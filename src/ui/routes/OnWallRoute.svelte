<script lang="ts">
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
      alt: "Wall-mounted screen in a harbour-side cafe showing the tide dial, with diners at a table and boats on the water through open windows.",
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
    The TideDial is just a website, but it was also carefully designed with a
    couple of features that make it work really well on a permanent screen that
    you leave on.
  </p>

  <p class="onwall-route__p">
    On the tide diagram there is a fullscreen control and a keep-awake control (the
    <strong>Zzz</strong> icon). Use fullscreen to fill the display, and keep awake so it
    doesn't dim or switch off.
  </p>

  <p class="onwall-route__p">
    To open it from an icon on your device, see
    <a class="onwall-route__link" href="#/install">Install app / Add to home screen</a>.
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

  .onwall-route__figure {
    margin: 0;
  }

  .onwall-route__img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 0.25rem;
  }

  .onwall-route__link {
    color: var(--text-link-accent);
    text-decoration: underline;
    text-underline-offset: 0.12em;
  }
</style>
