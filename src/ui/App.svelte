<script lang="ts">
  // Baseline app shell: keep routing and UI mount stable while domain code is being rebuilt.
  import { onMount } from "svelte";
  import { attachHashListener, route } from "../infrastructure/router.js";
  import Home from "./routes/Home.svelte";
  import Settings from "./routes/Settings.svelte";
  import About from "./routes/About.svelte";
  import Acknowledgements from "./routes/Acknowledgements.svelte";
  import Support from "./routes/Support.svelte";
  import Cookies from "./routes/Cookies.svelte";

  type TidePredictionsLoadState = { status: "loading" | "ready" | "error" };
  let tideLoadState = $state<TidePredictionsLoadState>({ status: "ready" });

  onMount(() => {
    attachHashListener();
  });
</script>

<div class="app-shell">
  <header class="top-bar">
    <a class="brand" href="#/home">Tide clock</a>
    <details class="menu">
      <summary class="menu-toggle" aria-label="Menu">Menu</summary>
      <nav class="nav-links" aria-label="Primary">
        <a href="#/home">Home</a>
        <a href="#/settings">Settings</a>
        <a href="#/about">About</a>
        <a href="#/acknowledgements">Acknowledgements</a>
        <a href="#/support">Support</a>
        <a href="#/cookies">Cookies</a>
      </nav>
    </details>
  </header>

  <section class="content">
    {#if $route === "home"}
      <Home tideLoadState={tideLoadState} />
    {:else if $route === "settings"}
      <Settings />
    {:else if $route === "about"}
      <About />
    {:else if $route === "acknowledgements"}
      <Acknowledgements />
    {:else if $route === "support"}
      <Support />
    {:else if $route === "cookies"}
      <Cookies />
    {/if}
  </section>
</div>
