<script lang="ts">
  import { manualInstallStepsFromUserAgent } from "./home/installFlow";

  const installSteps = $derived(
    manualInstallStepsFromUserAgent(
      typeof navigator !== "undefined" ? navigator.userAgent : null,
    ),
  );
</script>

<main class="route onwall-route">
  <h1>Stick it on the wall</h1>

  <section class="onwall-route__section" aria-labelledby="onwall-idea-heading">
    <h2 class="onwall-route__h" id="onwall-idea-heading">The idea</h2>
    <p class="onwall-route__p">
      The tide dial is designed deliberately to work well if you &ldquo;stick it on the wall&rdquo;.
      Perhaps on a tablet that lives in your kitchen, or a wall mounted screen that people walk
      past.
    </p>
    <p class="onwall-route__p">
      There&rsquo;s a dedicated <strong>install option</strong> to make the best of that choice.
    </p>
    <p class="onwall-route__p">
      It will then fill the screen completely, and most importantly keep the screen awake.
    </p>
  </section>

  <section class="onwall-route__section" aria-labelledby="onwall-install-heading">
    <h2 class="onwall-route__h" id="onwall-install-heading">How to install</h2>
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
