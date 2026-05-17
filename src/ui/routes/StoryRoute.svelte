<script lang="ts">
  import { THE_TIDE_DIAL } from "../brand";
  import { VIRTUAL_COFFEE_URL } from "../../support";

  const contactInMenuHref = "#/home?contact=1";
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
    <figcaption class="story-route__caption">Terras Crossing (Looe) at high tide</figcaption>
  </figure>

  <div class="story-route__body">
    <p>
      The road to my house crosses a river. During some tides it's completely underwater. So I go
      there to kayak. At other times it is clear — so I drive over it to pop out for a pint of milk.
      Choosing the wrong time for either activity does not end well.
    </p>
    <p>
      If you are unused to tides they can be a source of delight and interest when you visit a
      tidal place.
    </p>
    <p>
      Tidal places gradually reveal another rhythm interwoven with everyday life. The fishing fleet
      returning to port, not when they please, but when the tide is high. People letting their dogs
      have fun charging around the exposed shore at low tides. Wait! wasn't there a beach there
      yesterday? You'll notice the tide times creeping forward by just under an hour each day.
      You'll wonder why some tides are huge and some are tame.
    </p>
    <p>
      Whether you live by the tide or you are only here for the week, you rarely want a timetable to
      study. You want to know where you are in today — and what comes next — without turning it into
      homework.
    </p>
    <p>
      What is easy to find is usually a list of times. Sometimes there is an advert first. You get
      the numbers, but not the relationship between now and the next high or low — and if you want to
      know how long until the bridge is passable, or the beach is back, you are doing the arithmetic
      yourself.
    </p>
    <p>
      Most of my 40 year career as a software engineer has been about bringing alive information
      through diagrams — engineering design systems, physics simulations, the circuit inside a
      computer chip, a visualisation of how you mix and dilute chemicals with microscopic accuracy
      for your research experiments about sequencing DNA.
    </p>
    <p>
      I can't help myself — I have always created software because I enjoy it so much. Until recently
      people employed me to do it. But now I'm semi retired I haven't stopped — because it's still
      just as much fun as it always has been. But now I can make software systems to please
      <strong>me</strong>. {THE_TIDE_DIAL} is exactly that.
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
        Ramsgate on the screen — a visitor at the coast
      </figcaption>
    </figure>

    <aside class="story-route__support" aria-label="Optional support">
      <p>
        If you like how this turned out — I have no great objection to you buying me a
        <a
          class="story-route__link"
          href={VIRTUAL_COFFEE_URL}
          target="_blank"
          rel="noopener noreferrer">virtual coffee</a>.
      </p>
      <p class="story-route__support-note">
        No ads, no account, and entirely optional — the dial is complete either way.
      </p>
    </aside>

    <p>
      {THE_TIDE_DIAL} is ultimately the product of a long career spent making complicated systems
      easier to see and think about. If that overlaps with your world too, feel free to reach out via
      <a class="story-route__link" href={contactInMenuHref}>Contact</a> in the main menu.
    </p>
    <p>
      I've also built visual software systems to please <em>me</em> in other domains over the years. One
      of them is
      <a
        class="story-route__link"
        href="https://www.drawexact.click/"
        target="_blank"
        rel="noopener noreferrer">DrawExact</a>
      — a free drawing tool for when it's the geometry that matters. It sits deliberately somewhere between
      diagramming tools and CAD software.
    </p>
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
    margin: 0.4rem 0 0;
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

  .story-route__support {
    margin: 0;
    padding: 0.45rem 0.5rem;
    border: 1px solid var(--border-subtle);
    border-radius: 0.25rem;
    background: var(--surface-panel);
    display: grid;
    gap: 0.4rem;
  }

  .story-route__support p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-document-default);
  }

  .story-route__support-note {
    font-size: 0.88rem;
    line-height: 1.4;
    color: var(--text-document-secondary);
  }
</style>
