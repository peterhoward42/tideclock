<script lang="ts">
  /** About.svelte — Static about copy route. Kind: Presentation. */
  import { TIDECLOCK_BUILD_COMMIT } from "../../buildCommit";

  const title: string = "About";
</script>

<main class="route">
  <h1>{title}</h1>
  {#if TIDECLOCK_BUILD_COMMIT !== ""}
    <p class="muted about-build-fingerprint">
      Build <code class="about-build-fingerprint__sha">{TIDECLOCK_BUILD_COMMIT}</code>
      <span class="about-build-fingerprint__hint">
        (temporary — confirms which deploy this tab loaded)
      </span>
    </p>
  {/if}
</main>

<style>
  .about-build-fingerprint {
    font-size: 0.88rem;
  }

  .about-build-fingerprint__sha {
    font-size: 0.85em;
    font-weight: 600;
    letter-spacing: 0.06em;
  }

  .about-build-fingerprint__hint {
    font-size: 0.82em;
  }
</style>
