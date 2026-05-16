<script lang="ts">
  import { manualInstallStepsFromUserAgent } from "./home/installFlow";

  const installSteps = $derived(
    manualInstallStepsFromUserAgent(
      typeof navigator !== "undefined" ? navigator.userAgent : null,
    ),
  );

  const heroPlace = {
    src: "/onwall-guest-house.png",
    width: 1024,
    height: 1024,
    alt: "Wall-mounted screen in a guest house reception showing the tide dial above a welcome desk.",
    caption: "Guest house reception — for visitors passing by",
  } as const;

  const wallPlaces = [
    {
      src: "/onwall-kitchen.png",
      width: 1024,
      height: 1024,
      alt: "Tablet on a kitchen shelf showing the tide dial among cookbooks and breakfast things.",
      caption: "Kitchen shelf — always on at home",
    },
    {
      src: "/onwall-pub.png",
      width: 1024,
      height: 1024,
      alt: "Wall-mounted screen in a harbour-side pub showing the tide dial above dining tables.",
      caption: "Harbour pub — background for the room",
    },
    {
      src: "/onwall-kayak-hire.png",
      width: 1024,
      height: 1024,
      alt: "Screen at a kayak hire counter showing the tide dial beside life jackets and hire signage.",
      caption: "Kayak hire desk — staff and customers glancing up",
    },
  ] as const;
</script>

<main class="route onwall-route">
  <h1>Stick it on the wall</h1>

  <figure class="onwall-route__figure">
    <img
      class="onwall-route__img"
      src={heroPlace.src}
      width={heroPlace.width}
      height={heroPlace.height}
      alt={heroPlace.alt}
    />
    <figcaption class="onwall-route__caption">{heroPlace.caption}</figcaption>
  </figure>

  <section class="onwall-route__section" aria-labelledby="onwall-offer-heading">
    <h2 class="onwall-route__h" id="onwall-offer-heading">Wall display</h2>
    <p class="onwall-route__p">
      Install on the device you plan to leave on display. The dial fills the screen, and in the
      main menu <strong>App display</strong> keeps the screen awake while
      <strong>Enter fullscreen</strong> gives a clean edge-to-edge view.
    </p>
  </section>

  <section class="onwall-route__section" aria-labelledby="onwall-install-heading">
    <h2 class="onwall-route__h" id="onwall-install-heading">How to install</h2>
    <p class="onwall-route__p">
      Install on the device you will leave on the wall — not necessarily the phone you are reading
      this on.
    </p>
    <p class="onwall-route__p">Details vary by device and browser.</p>
    <p class="onwall-route__p">
      Use your browser&rsquo;s add or install option (wording varies):
    </p>
    <ol class="onwall-route__list">
      {#each installSteps as step}
        <li>{step}</li>
      {/each}
    </ol>
  </section>

  <section class="onwall-route__section" aria-labelledby="onwall-places-heading">
    <h2 class="onwall-route__h" id="onwall-places-heading">Where it fits</h2>
    <div class="onwall-route__gallery">
      {#each wallPlaces as place}
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
          <figcaption class="onwall-route__caption">{place.caption}</figcaption>
        </figure>
      {/each}
    </div>
  </section>
</main>

<style>
  .onwall-route {
    display: grid;
    gap: 1.25rem;
    max-width: 34rem;
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

  .onwall-route__figure {
    margin: 0;
  }

  .onwall-route__img {
    display: block;
    width: 100%;
    height: auto;
    border-radius: 0.25rem;
  }

  .onwall-route__caption {
    margin: 0.35rem 0 0;
    font-size: 0.88rem;
    line-height: 1.4;
    color: var(--text-document-secondary);
  }

  .onwall-route__gallery {
    display: grid;
    gap: 1.25rem;
    margin: 0.45rem 0 0;
  }

  .onwall-route__list {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.95rem;
    line-height: 1.45;
    color: var(--text-document-default);
    display: grid;
    gap: 0.35rem;
  }
</style>
