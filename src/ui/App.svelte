<script lang="ts">
  // Baseline app shell: keep routing and UI mount stable while domain code is being rebuilt.
  import { onMount } from "svelte";
  import type { TideExtremesAtLocation } from "../core-models/TideExtremesAtLocation";
  import { loadTideExtremesForCurrentCivilDayQuery } from "../application/tideExtremesForCivilDayQuery";
  import { attachHashListener, route } from "../infrastructure/router.js";
  import Home from "./routes/Home.svelte";
  import Settings from "./routes/Settings.svelte";
  import About from "./routes/About.svelte";
  import Acknowledgements from "./routes/Acknowledgements.svelte";
  import Support from "./routes/Support.svelte";
  import Cookies from "./routes/Cookies.svelte";

  type TidePredictionsLoadState = { status: "loading" | "ready" | "error" };
  let tideLoadState = $state<TidePredictionsLoadState>({ status: "ready" });

  function appDiag(...args: unknown[]) {
    if (!import.meta.env.DEV || import.meta.env.MODE === "test") return;
    console.log("[tideclock] app:", ...args);
  }

  /**
   * Tide data for the current civil day: reads `localStorage`, then the tide proxy if needed.
   * Dependencies are fixed at the UI root because `main.js` mounts this component without props.
   */
  async function loadTideExtremesForCurrentCivilDay(
    latitude: number,
    longitude: number
  ): Promise<TideExtremesAtLocation | undefined> {
    appDiag("loadTideExtremesForCurrentCivilDay invoked", { latitude, longitude });
    try {
      const result = await loadTideExtremesForCurrentCivilDayQuery(latitude, longitude, {
        loader: localStorage,
        storer: localStorage,
        baseUrl: import.meta.env.VITE_TIDE_PROXY_BASE_URL
      });
      appDiag("loadTideExtremesForCurrentCivilDay finished", {
        latitude,
        longitude,
        extremeCount: result?.extremes.length ?? null,
        ok: result !== undefined
      });
      return result;
    } catch (e) {
      appDiag("loadTideExtremesForCurrentCivilDay error", e);
      throw e;
    }
  }

  onMount(() => {
    attachHashListener();
    appDiag("shell mounted, hash listener attached");
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
      <Home
        tideLoadState={tideLoadState}
        loadTideExtremesForCurrentCivilDay={loadTideExtremesForCurrentCivilDay}
      />
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
