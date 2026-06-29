<script lang="ts">
  import { TIDECLOCK_BUILD_COMMIT } from "../../buildCommit";
  import { THE_TIDE_DIAL } from "../brand";
  import { externalLinkNewTabAttrs } from "../externalLink";

  const versionLabel =
    TIDECLOCK_BUILD_COMMIT.length > 0 ? TIDECLOCK_BUILD_COMMIT : "unknown";
</script>

<main class="route about-route">
  <h1>About {THE_TIDE_DIAL}</h1>
  <section class="about-route__section" aria-labelledby="about-version-heading">
    <h2 class="about-route__h" id="about-version-heading">Version</h2>
    <p class="about-route__p">
      Build <span class="about-route__mono">{versionLabel}</span>
    </p>
  </section>

  <section class="about-route__section" aria-labelledby="about-safety-heading">
    <h2 class="about-route__h" id="about-safety-heading">Safety</h2>
    <p class="about-route__p">
      {THE_TIDE_DIAL} provides information for leisure, entertainment and tourism
      purposes. It is strictly not suitable or dependable for any safety critical
      purposes.
    </p>
  </section>

  <section class="about-route__section" aria-labelledby="about-story-heading">
    <h2 class="about-route__h" id="about-story-heading">Story</h2>
    <p class="about-route__p">
      {THE_TIDE_DIAL} has been created by Pete Howard.
    </p>
    <p class="about-route__p">
      You can read more on the
      <a class="about-route__link" href="#/story">Story</a>
      page — you’ll find it in <strong>Menu</strong>.
    </p>
  </section>

  <section class="about-route__section" aria-labelledby="about-data-heading">
    <h2 class="about-route__h" id="about-data-heading">
      Tide data and copyright
    </h2>
    <p class="about-route__p">
      Tidal data retrieved from
      <a
        class="about-route__link"
        href="https://www.worldtides.info/"
        {...externalLinkNewTabAttrs}>www.worldtides.info</a
      >. Copyright © 2014-2026 Brainware LLC. Licensed for use of individual
      spatial coordinates by an end-user. NO GUARANTEES ARE MADE ABOUT THE
      CORRECTNESS OF THIS TIDAL DATA. You may not use this data if anyone or
      anything could come to harm as a result of using it (e.g. for navigational
      purposes). Tidal data is obtained from various sources and is covered in
      part or whole by various copyrights. For details see:
      <a
        class="about-route__link"
        href="https://www.worldtides.info/copyright"
        {...externalLinkNewTabAttrs}>www.worldtides.info/copyright</a
      >
      (required notice per
      <a
        class="about-route__link"
        href="https://www.worldtides.info/terms"
        {...externalLinkNewTabAttrs}>WorldTides terms — Additional provisions</a
      >).
    </p>
  </section>

  <section class="about-route__section" aria-labelledby="about-share-heading">
    <h2 class="about-route__h" id="about-share-heading">Share a place</h2>
    <p class="about-route__p">
      You can link directly to tides for a place using both a place name and a
      county in the web address, for example
      <span class="about-route__mono">?place=Looe&amp;county=Cornwall</span>
      on
      <a
        class="about-route__link"
        href="https://thetidedial.page/?place=Looe&amp;county=Cornwall"
        >thetidedial.page</a
      >. Use the same spelling as when you choose a place with Change on the tide
      dial. Opening a share link
      applies that place even if you already saved another one.
    </p>
  </section>

  <section class="about-route__section" aria-labelledby="about-towns-heading">
    <h2 class="about-route__h" id="about-towns-heading">Town list</h2>
    <p class="about-route__p">
      Place names and coordinates are compiled into the app from a curated list,
      with many entries geocoded against OpenStreetMap via Nominatim. ©
      OpenStreetMap contributors. OpenStreetMap data is licensed under the Open
      Data Commons Open Database License (ODbL). See
      <a
        class="about-route__link"
        href="https://www.openstreetmap.org/copyright"
        {...externalLinkNewTabAttrs}>openstreetmap.org/copyright</a
      >.
    </p>
  </section>

  <section class="about-route__section" aria-labelledby="about-licence-heading">
    <h2 class="about-route__h" id="about-licence-heading">Source code</h2>
    <p class="about-route__p">
      {THE_TIDE_DIAL} source code is licensed under the MIT License.
    </p>
  </section>

  <section class="about-route__section" aria-labelledby="about-cookies-heading">
    <h2 class="about-route__h" id="about-cookies-heading">Cookies</h2>
    <p class="about-route__p">
      {THE_TIDE_DIAL} uses only necessary cookies. Specifically:
    </p>
    <ul class="about-route__list">
      <li>
        We do not discover, nor ever know your identity, and do not store it in
        any form.
      </li>
      <li>
        We do fetch the required tide information over the internet and the app
        cannot function without doing so.
      </li>
      <li>
        We do store the location you have chosen to show tides for — but only on
        your own computer. This avoids you having to choose it every time you
        visit {THE_TIDE_DIAL}.
      </li>
    </ul>
  </section>
</main>

<style>
  .about-route {
    display: grid;
    gap: 1.25rem;
    max-width: 34rem;
  }

  .about-route__section {
    display: grid;
    gap: 0.4rem;
  }

  .about-route__h {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-document-default);
  }

  .about-route__p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-document-default);
  }

  .about-route__mono {
    font-family: ui-monospace, monospace;
    font-size: 0.9em;
  }

  .about-route__link {
    color: var(--text-link-accent);
    text-decoration: underline;
    text-underline-offset: 0.12em;
  }

  .about-route__list {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.95rem;
    line-height: 1.45;
    color: var(--text-document-default);
    display: grid;
    gap: 0.35rem;
  }
</style>
