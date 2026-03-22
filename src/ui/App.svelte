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

  // Create one TidePredictionsModel instance for this mounted app.
  //
  // createTidePredictionsModel is a factory function. It returns a model
  // instance object exposing setAll(...) and getAll(). Internally the model
  // holds private mutable state that is not exposed directly here.
  const tidePredictionsModel = createTidePredictionsModel();

  // Publish that exact model instance into Svelte context for this component
  // subtree.
  //
  // setTidePredictionsModel is the setter half of the context pair. Its role
  // is dependency injection, scoped to descendants of this App component.
  // Child components can later retrieve this same instance with
  // getTidePredictionsModel().
  setTidePredictionsModel(tidePredictionsModel);

  // Populate the model with initial tide-extreme data.
  //
  // This is placeholder or seed content, hard-coded here simply to initialise
  // the app with valid data. In a fuller version of the app, the array passed
  // to setAll(...) would likely come from a loader, API call, file parse, or
  // some other upstream source.
  //
  // The model interface places the obligation on the caller to provide the
  // array in the desired order already. setAll(...) then copies that array
  // into the model's private state.
  tidePredictionsModel.setAll([
    { type: "high", height: 4.2, time: "2026-03-22T01:15:00.000Z" },
    { type: "low", height: 1.1, time: "2026-03-22T07:32:00.000Z" },
    { type: "high", height: 4.5, time: "2026-03-22T13:48:00.000Z" },
    { type: "low", height: 0.9, time: "2026-03-22T20:05:00.000Z" },
  ]);

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
