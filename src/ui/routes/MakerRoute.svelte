<script lang="ts">
  import CopyableEmail from "../components/CopyableEmail.svelte";
  import { THE_TIDE_DIAL } from "../brand";
</script>

<main class="route story-route">
  <h1>A little bit about me</h1>

  <div class="story-route__body">
    <p>
      I can't help myself — I have always created software because I enjoy it so
      much. Until recently people employed me to do it. But now I'm semi retired
      I haven't stopped — because it's still just as much fun as it always has
      been. But now I can make software systems to please
      <strong>me</strong>. {THE_TIDE_DIAL} is exactly that.
    </p>

    <p>
      In a way, that's kinda the story of my professional life. 40 years of
      software engineering, focussed on making complicated systems easier to see
      and understand using diagrams: engineering design systems, physics
      simulations, the circuit inside a computer chip, a visualisation of how
      you mix and dilute chemicals with microscopic accuracy for your research
      experiments about sequencing DNA.
    </p>

    <h2 class="story-route__h">Collaboration</h2>
    <p>
      This story is also partly about me the person, and to encourage you to
      engage with me professionally if you'd like to. I don't want to sneak that
      transition in — so I'm choosing to be up front about it.
    </p>

    <h2 class="story-route__h">Your ideas</h2>
    <p>
      Do you have an idea for bringing information alive through software
      created diagrams and interaction? If so it might be fun (or fruitful) to
      get in touch at <CopyableEmail textClass="story-route__link" />.
    </p>

    <p>
      For bugs, questions, or general reach-out, see the
      <a class="story-route__link" href="#/contact">Contact</a> page.
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

  .story-route__body {
    display: grid;
    gap: 0.85rem;
  }

  .story-route__h {
    font-size: 1.05rem;
    font-weight: 600;
    margin: 0;
    color: var(--text-document-default);
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
</style>
