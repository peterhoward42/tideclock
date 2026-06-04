<script lang="ts">
  import { THE_TIDE_DIAL } from "../brand";
</script>

<main class="route install-route">
  <h1>Install app / Add to home screen</h1>

  <p class="install-route__p install-route__lead">
    You can add a launcher icon for {THE_TIDE_DIAL} on your phone, or tablet, or computer
    - to make it easier to fire it up next time. (Like other apps)
  </p>

  <p class="install-route__p">
    Use your browser’s own install or Add to Home Screen option. The steps differ
    by device; find yours below.
  </p>

  <section
    class="install-route__section"
    aria-labelledby="install-ios-heading"
  >
    <h2 class="install-route__h" id="install-ios-heading">iPhone and iPad</h2>
    <ol class="install-route__list">
      <li>Open the Share menu (square with arrow).</li>
      <li>Choose <strong>Add to Home Screen</strong>.</li>
      <li>Tap <strong>Add</strong> to confirm.</li>
    </ol>
    <p class="install-route__p install-route__note">
      The icon opens {THE_TIDE_DIAL} in a focused window, separate from browser tabs.
    </p>
  </section>

  <section
    class="install-route__section"
    aria-labelledby="install-android-heading"
  >
    <h2 class="install-route__h" id="install-android-heading">Android</h2>
    <ol class="install-route__list">
      <li>Open the browser menu (three dots).</li>
      <li>
        Choose <strong>Install app</strong> or <strong>Add to Home screen</strong>
        (wording varies).
      </li>
      <li>Confirm <strong>Install</strong>.</li>
    </ol>
  </section>

  <section
    class="install-route__section"
    aria-labelledby="install-desktop-heading"
  >
    <h2 class="install-route__h" id="install-desktop-heading">Computer</h2>
    <ol class="install-route__list">
      <li>Open the browser menu.</li>
      <li>Choose <strong>Install app</strong> or <strong>Install The Tide Dial</strong>.</li>
      <li>Confirm install when prompted.</li>
    </ol>
    <p class="install-route__p install-route__note">
      You may also see an install icon in the address bar when the browser offers it.
    </p>
  </section>

  <p class="install-route__p">
    Once it opens from your icon, see
    <a class="install-route__link" href="#/onwall">Stick it on the wall</a>
    if you are leaving a screen on permanently.
  </p>
</main>

<style>
  .install-route {
    display: grid;
    gap: 1.25rem;
    max-width: 34rem;
  }

  .install-route__lead {
    margin: 0;
  }

  .install-route__section {
    display: grid;
    gap: 0.4rem;
  }

  .install-route__h {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-document-default);
  }

  .install-route__p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-document-default);
  }

  .install-route__note {
    font-size: 0.9rem;
  }

  .install-route__list {
    margin: 0;
    padding-left: 1.2rem;
    font-size: 0.95rem;
    line-height: 1.45;
    color: var(--text-document-default);
    display: grid;
    gap: 0.35rem;
  }

  .install-route__link {
    color: var(--text-link-accent);
    text-decoration: underline;
    text-underline-offset: 0.12em;
  }
</style>
