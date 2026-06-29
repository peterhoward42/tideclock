<script lang="ts">
  import CopyableEmail from "../components/CopyableEmail.svelte";
</script>

<main class="route contact-route">
  <h1>Please get in touch</h1>
  <p class="contact-route__p">
    Questions, bug reports, thoughtful suggestions.
  </p>
  <p class="contact-route__p">
    This app is personally designed and maintained by me, so responses may
    occasionally be slow, but I do read everything.
  </p>
  <p class="contact-route__email">
    <CopyableEmail textClass="contact-route__link" />
  </p>
</main>

<style>
  .contact-route {
    display: grid;
    gap: 1.25rem;
    max-width: 34rem;
  }

  .contact-route h1 {
    font-size: 1.35rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-document-default);
  }

  .contact-route__p {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-document-default);
  }

  .contact-route__email {
    margin: 0;
    font-size: 0.95rem;
    line-height: 1.5;
    color: var(--text-document-default);
  }

  .contact-route__link {
    color: var(--text-link-accent);
    text-decoration: underline;
    text-underline-offset: 0.12em;
  }
</style>
