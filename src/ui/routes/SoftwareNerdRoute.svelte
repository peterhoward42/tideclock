<script lang="ts">
  import { THE_TIDE_DIAL } from "../brand";

  const REPO_TIDECLOCK = "https://github.com/peterhoward42/tideclock";
  const REPO_TIDEPROXY = "https://github.com/peterhoward42/tideproxy";
  /** Plain-language definitions — MDN glossary / guides read well for non-specialists. */
  const LINK_SPA = "https://developer.mozilla.org/en-US/docs/Glossary/SPA";
  /** Product docs read clearer than the marketing homepage for “what is Cursor?”. */
  const LINK_CURSOR = "https://docs.cursor.com/";
</script>

<main class="route software-nerd-route">
  <h1>Software Nerd</h1>
  <p class="software-nerd-route__lede">
    A rough map of how {THE_TIDE_DIAL} is put together — for anyone who enjoys peeking under the
    bonnet. Source for this app lives at
    <a
      class="software-nerd-route__link"
      href={REPO_TIDECLOCK}
      target="_blank"
      rel="noopener noreferrer">github.com/peterhoward42/tideclock</a
    >. This page is not a formal architecture document; detail will grow over time.
  </p>

  <section
    class="software-nerd-route__section"
    aria-labelledby="software-nerd-client-heading"
  >
    <h2 class="software-nerd-route__h" id="software-nerd-client-heading">In the browser</h2>
    <p class="software-nerd-route__p">
      {THE_TIDE_DIAL} is a web app built with
      <a
        class="software-nerd-route__link"
        href="https://svelte.dev/"
        target="_blank"
        rel="noopener noreferrer">Svelte</a
      >
      (currently Svelte 5). It runs as a
      <a
        class="software-nerd-route__link"
        href={LINK_SPA}
        target="_blank"
        rel="noopener noreferrer">single-page application</a
      >
      (SPA): hash-based routing swaps views without full page reloads.
      <a
        class="software-nerd-route__link"
        href="https://vite.dev/"
        target="_blank"
        rel="noopener noreferrer">Vite</a
      >
      bundles the TypeScript and Svelte sources for development and production builds.
    </p>
    <p class="software-nerd-route__p">
      The UI shell orchestrates location choice, tide loading, and which route you are on. The home
      view injects an SVG diagram into the page and keeps it aligned with the clock as time moves.
    </p>
  </section>

  <section
    class="software-nerd-route__section"
    aria-labelledby="software-nerd-responsive-heading"
  >
    <h2 class="software-nerd-route__h" id="software-nerd-responsive-heading">Screens and layout</h2>
    <p class="software-nerd-route__p">
      The layout is meant to work on phones, tablets, and desktops — adapting to screen size,
      orientation, and whether you are touching or using a mouse. That adaptation is deliberate, not
      accidental. A single <strong>display optimisation</strong> layer reads the viewport and input
      characteristics (width buckets, portrait vs landscape, coarse touch vs fine pointer, short
      physical screen edge) and publishes one snapshot the rest of the UI consults — so breakpoints are
      not re-scattered through dozens of components.
    </p>
    <p class="software-nerd-route__p">
      On the home route the diagram SVG is scaled uniformly to fit inside the instrument — empty
      bands above and below when the aspect ratio does not match. On small phones in portrait, a
      gentle hint may suggest turning landscape when that genuinely helps. Menus and overlays anchor
      to diagram geometry rather than assuming a fixed height for headers and surrounding controls.
    </p>
    <p class="software-nerd-route__p">
      For a counter or wall display, the menu can request a <strong>screen wake lock</strong> so the
      dial stays visible while the tab is open, and <strong>Really fullscreen</strong> hides browser
      chrome via the Fullscreen API. Both are progressive enhancement: they work in a normal browser
      tab where the platform allows them.
    </p>
  </section>

  <section
    class="software-nerd-route__section"
    aria-labelledby="software-nerd-shipping-heading"
  >
    <h2 class="software-nerd-route__h" id="software-nerd-shipping-heading">Shipping it</h2>
    <p class="software-nerd-route__p">
      Production output is a static site: HTML, JS, and assets from <code>vite build</code>. That
      bundle is deployed on
      <a
        class="software-nerd-route__link"
        href="https://vercel.com/"
        target="_blank"
        rel="noopener noreferrer">Vercel</a
      >
      and served from their edge CDN. Pushing to the linked GitHub repository is enough to trigger a
      new deployment — no separate release ceremony.
    </p>
    <p class="software-nerd-route__p">
      Long-lived assets get immutable cache headers; the HTML entry is revalidated so users pick up
      new builds without stale shell problems.
    </p>
  </section>

  <section
    class="software-nerd-route__section"
    aria-labelledby="software-nerd-tides-heading"
  >
    <h2 class="software-nerd-route__h" id="software-nerd-tides-heading">Tide data path</h2>
    <p class="software-nerd-route__p">
      Ultimate tide predictions come from
      <a
        class="software-nerd-route__link"
        href="https://www.worldtides.info/"
        target="_blank"
        rel="noopener noreferrer">WorldTides</a
      >
      (worldtides.info). The browser never holds the upstream API key.
    </p>
    <p class="software-nerd-route__p">
      Instead, the app calls a small <strong>intermediary proxy server</strong> written in
      <strong>Go</strong>, deployed as a
      <a
        class="software-nerd-route__link"
        href="https://cloud.google.com/functions"
        target="_blank"
        rel="noopener noreferrer">Google Cloud Function</a
      >. Source:
      <a
        class="software-nerd-route__link"
        href={REPO_TIDEPROXY}
        target="_blank"
        rel="noopener noreferrer">github.com/peterhoward42/tideproxy</a
      >. The proxy server keeps credentials on the server, shapes responses into a stable contract for
      the client, and throttles traffic to WorldTides so request volume (and cost) stay under control.
    </p>
    <p class="software-nerd-route__p">
      On the client, fetched extremes are mapped into domain types, cached locally for the chosen
      place, and refreshed when the civil day rolls over or you change location.
    </p>
  </section>

  <section
    class="software-nerd-route__section"
    aria-labelledby="software-nerd-diagram-heading"
  >
    <h2 class="software-nerd-route__h" id="software-nerd-diagram-heading">Drawing the dial</h2>
    <p class="software-nerd-route__p">
      The tide clock is not hand-drawn SVG. It follows a deliberate pipeline with separation of
      concerns:
    </p>
    <ol class="software-nerd-route__list software-nerd-route__list--ordered">
      <li>
        A written <strong>diagram specification</strong> (prose plus parameters) describes what
        should appear — arcs, hands, labels, tide markers — without fixing pixel output.
      </li>
      <li>
        A <strong>diagram generator</strong> turns that spec plus live inputs (time, today's
        extremes, and so on) into an abstract <strong>scene graph</strong>: named groups and geometry
        primitives, not yet pixels.
      </li>
      <li>
        A <strong>renderer</strong> walks the scene graph and emits SVG strings for the browser.
      </li>
    </ol>
    <p class="software-nerd-route__p">
      <strong>Time and angle are reciprocally bound.</strong> On the reference arc, civil time in
      hours maps linearly to a polar angle θ (and back): the current hand position and “what time is
      it?” are two views of the same equivalence — not independent knobs.
    </p>
    <p class="software-nerd-route__p">
      <strong>Sizing is dimensionless.</strong> One reference radius <em>R</em> anchors the layout;
      every other linear measure is a proportion <em>k</em> times <em>R</em> (written <em>k·R</em> in
      the spec). The diagram is designed in unit space first; the viewport applies a uniform scale
      later, so geometry stays coherent across screen sizes.
    </p>
    <p class="software-nerd-route__p">
      That split lets the spec evolve, lets rendering change (SVG today, something else tomorrow),
      and keeps tide semantics out of path-drawing code.
    </p>
  </section>

  <section
    class="software-nerd-route__section"
    aria-labelledby="software-nerd-time-heading"
  >
    <h2 class="software-nerd-route__h" id="software-nerd-time-heading">Keeping time honest</h2>
    <p class="software-nerd-route__p">
      The dial is meant to feel alive. A <strong>minute cadence</strong> subscription fires on each
      local wall-clock minute boundary (and can fire immediately on subscribe) so the scene
      regenerates with updated time data and the SVG is replaced.
    </p>
    <p class="software-nerd-route__p">
      Crossing <strong>local midnight</strong> is handled separately: when the civil day advances,
      the app decides whether to reload tide extremes for the current place so “today” on the dial
      stays aligned with the calendar, not just the clock hand.
    </p>
  </section>

  <section
    class="software-nerd-route__section"
    aria-labelledby="software-nerd-tests-heading"
  >
    <h2 class="software-nerd-route__h" id="software-nerd-tests-heading">Tests</h2>
    <p class="software-nerd-route__p">
      Automated checks run with
      <a
        class="software-nerd-route__link"
        href="https://vitest.dev/"
        target="_blank"
        rel="noopener noreferrer">Vitest</a
      >: fast unit tests across application logic, time services, data pipelines, and UI helpers. Where
      outputs are stable and textual, snapshot tests guard regressions (diagram specs, SVG-related
      mapping). Network boundaries are exercised with mocks rather than live WorldTides or proxy
      server calls in CI.
    </p>
    <p class="software-nerd-route__p">
      <code>npm test</code> runs the full suite locally and in the deployment pipeline's build step.
    </p>
  </section>

  <section
    class="software-nerd-route__section"
    aria-labelledby="software-nerd-built-heading"
  >
    <h2 class="software-nerd-route__h" id="software-nerd-built-heading">How this got written</h2>
    <p class="software-nerd-route__p">
      Almost every line of code in the
      <a
        class="software-nerd-route__link"
        href={REPO_TIDECLOCK}
        target="_blank"
        rel="noopener noreferrer">tideclock</a
      >
      repository was <strong>AI-generated</strong> — chiefly through
      <a
        class="software-nerd-route__link"
        href={LINK_CURSOR}
        target="_blank"
        rel="noopener noreferrer">Cursor</a
      >
      (an AI-assisted code editor)
      — but not in one heroic paste. An experienced software developer directed the work across 574 small
      commits so far: scope, review, tests, naming, refactoring, housekeeping, and “no, not like that”
      corrections. The result is a governed, and engineering-grade build — not a one-shot autogenerated
      codebase left to run on its own.
    </p>
    <p class="software-nerd-route__p">
      Staged photos used to illustrate real-world use cases (for example on
      <a class="software-nerd-route__link" href="#/onwall">Stick it on the wall</a>) were also
      AI-generated.
    </p>
    <p class="software-nerd-route__p">
      If the human side of that story matters more than the stack, the
      <a class="software-nerd-route__link" href="#/story">Story</a> in the main menu is the better
      read.
    </p>
  </section>
</main>

<style>
  .software-nerd-route {
    display: grid;
    gap: 1.25rem;
    max-width: 34rem;
  }

  .software-nerd-route__lede {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-document-default);
  }

  .software-nerd-route__section {
    display: grid;
    gap: 0.4rem;
  }

  .software-nerd-route__h {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-document-default);
  }

  .software-nerd-route__p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-document-default);
  }

  .software-nerd-route__p code {
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
  }

  .software-nerd-route__link {
    color: var(--text-link-accent);
    text-decoration: underline;
    text-underline-offset: 0.12em;
  }

  .software-nerd-route__list {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.95rem;
    line-height: 1.45;
    color: var(--text-document-default);
    display: grid;
    gap: 0.35rem;
  }

  .software-nerd-route__list--ordered {
    list-style-type: decimal;
  }
</style>
