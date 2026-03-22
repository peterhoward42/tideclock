<script lang="ts">
  import { onMount } from "svelte";
  import { attachHashListener, route } from "../infrastructure/router.js";
  import { createTidePredictionsModel } from "../core-models/tide-predictions";
  import { setTidePredictionsModel } from "../core-models/tide-predictions-context.svelte";
  import Home from "./routes/Home.svelte";
  import Settings from "./routes/Settings.svelte";
  import About from "./routes/About.svelte";
  import Acknowledgements from "./routes/Acknowledgements.svelte";
  import Support from "./routes/Support.svelte";
  import Cookies from "./routes/Cookies.svelte";

  // One shared TidePredictionsModel for this mounted app (`extremes` is public).
  const tidePredictionsModel = createTidePredictionsModel();

  // Publish that instance into Svelte context for descendants (e.g. getTidePredictionsModel()).
  setTidePredictionsModel(tidePredictionsModel);

  // Seed extremes (placeholder until loaders / API / cache wire in).
  tidePredictionsModel.extremes = [
    { type: "high", height: 4.2, time: "2026-03-22T01:15:00.000Z" },
    { type: "low", height: 1.1, time: "2026-03-22T07:32:00.000Z" },
    { type: "high", height: 4.5, time: "2026-03-22T13:48:00.000Z" },
    { type: "low", height: 0.9, time: "2026-03-22T20:05:00.000Z" },
  ];

  onMount(() => attachHashListener());
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
      <Home />
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
