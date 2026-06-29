<script lang="ts">
  const wallPlaces = [
    {
      src: "/onwall-kitchen.png",
      width: 1024,
      height: 1024,
      alt: "Tablet on a kitchen shelf showing the tide dial among everyday items, left running like a small clock.",
    },
    {
      src: "/onwall-guest-house.png",
      width: 1024,
      height: 1024,
      alt: "Wall-mounted screen in a coastal guest house reception showing the tide dial, with guests at the welcome desk and harbour views through the windows.",
    },
    {
      src: "/onwall-pub.png",
      width: 1024,
      height: 1024,
      alt: "Wall-mounted screen in a harbour-side cafe showing the tide dial, with diners at a table and boats on the water through open windows.",
    },
    {
      src: "/onwall-kayak-hire.png",
      width: 1024,
      height: 1024,
      alt: "Screen at a kayak hire counter showing the tide dial beside life jackets and hire signage.",
    },
  ] as const;
</script>

<main class="route onwall-route">
  <h1>Put it on the wall</h1>

  <p class="onwall-route__p onwall-route__lead">
    Some people leave TideDial on a permanent screen so that it's just there as you
    walk past.
  </p>

  <p class="onwall-route__p">
    If tides affect your daily life — it's really handy on a tablet in your kitchen.
  </p>

  <p class="onwall-route__p">
    Or if you run a guest house — your guests can glance at the tides as they leave
    for the day.
  </p>

  <p class="onwall-route__p">
    The pictures below show a few good places.
  </p>

  <div class="onwall-route__gallery">
    {#each wallPlaces as place, index}
      <figure class="onwall-route__figure">
        <img
          class="onwall-route__img"
          src={place.src}
          width={place.width}
          height={place.height}
          alt={place.alt}
          loading={index === 0 ? undefined : "lazy"}
          decoding={index === 0 ? undefined : "async"}
        />
      </figure>
    {/each}
  </div>

  <aside class="onwall-route__inset" aria-label="Keeping the screen on">
    <p>
      You can tell it to stay on (not go to sleep), and to fill the whole screen
      directly from the diagram (bottom left corner).
    </p>
  </aside>

  <p class="onwall-route__p">
    To open TideDial from an icon on your device, see
    <a class="onwall-route__link" href="#/installconfig"
      >Install / Config / Settings</a
    >.
  </p>
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

  .onwall-route__gallery {
    display: grid;
    gap: 2rem;
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

  .onwall-route__inset {
    margin: 0;
    padding: 0.9rem 1rem 0.95rem;
    border: 1px solid color-mix(in srgb, #d97706 28%, var(--border-subtle));
    border-left: 3px solid #d97706;
    border-radius: 0.35rem;
    background: color-mix(in srgb, #fef3c7 42%, var(--surface-panel));
    box-shadow: 0 1px 4px rgb(15 23 42 / 0.07);
  }

  .onwall-route__inset p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.55;
    color: var(--text-document-default);
  }

  .onwall-route__link {
    color: var(--text-link-accent);
    text-decoration: underline;
    text-underline-offset: 0.12em;
  }
</style>
