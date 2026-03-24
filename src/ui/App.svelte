<script lang="ts">
  // Baseline app shell: keep routing and UI mount stable while domain code is being rebuilt.
  import { onMount } from "svelte";
  import type { TideExtremesAtLocation } from "../core-models/TideExtremesAtLocation";
  import type { Town } from "../data/bakedTowns";
  import { storeCurrentLocation } from "../data-pipelines/currentLocation";
  import { loadTideExtremesForCurrentCivilDayQuery } from "../application/tideExtremesForCivilDayQuery";
  import { attachHashListener, route } from "../infrastructure/router.js";
  import Home from "./routes/Home.svelte";
  import Location from "./routes/Location.svelte";
  import Settings from "./routes/Settings.svelte";
  import About from "./routes/About.svelte";
  import Acknowledgements from "./routes/Acknowledgements.svelte";
  import Support from "./routes/Support.svelte";
  import Cookies from "./routes/Cookies.svelte";

  type TidePredictionsLoadState = { status: "loading" | "ready" | "error" };
  let tideLoadState = $state<TidePredictionsLoadState>({ status: "ready" });
  let menuDetails = $state<HTMLDetailsElement | undefined>(undefined);

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

  /**
   * Central write-orchestrator for the selected town.
   * Future follow-on flows (reloads/navigation/etc.) should be added here.
   */
  function setCurrentLocation(town: Town): void {
    appDiag("setCurrentLocation called from Location route", {
      townId: town.id,
      townName: town.name,
      county: town.county,
      country: town.country
    });
    storeCurrentLocation(town, { storer: localStorage });
    appDiag("setCurrentLocation stored town in localStorage", { townId: town.id });
  }

  function closeMenu(): void {
    menuDetails?.removeAttribute("open");
  }

  onMount(() => {
    attachHashListener();
    appDiag("shell mounted, hash listener attached");
  });
</script>

<div class="app-shell">
  <header class="top-bar">
    <a class="brand" href="#/home">Tide clock</a>
    <details class="menu" bind:this={menuDetails}>
      <summary class="menu-toggle" aria-label="Menu">Menu</summary>
      <nav class="nav-links" aria-label="Primary">
        <a href="#/home" onclick={closeMenu}>Home</a>
        <a href="#/location" onclick={closeMenu}>Location</a>
        <a href="#/settings" onclick={closeMenu}>Settings</a>
        <a href="#/about" onclick={closeMenu}>About</a>
        <a href="#/acknowledgements" onclick={closeMenu}>Acknowledgements</a>
        <a href="#/support" onclick={closeMenu}>Support</a>
        <a href="#/cookies" onclick={closeMenu}>Cookies</a>
      </nav>
    </details>
  </header>

  <section class="content">
    {#if $route === "home"}
      <Home
        tideLoadState={tideLoadState}
        loadTideExtremesForCurrentCivilDay={loadTideExtremesForCurrentCivilDay}
      />
    {:else if $route === "location"}
      <Location setCurrentLocation={setCurrentLocation} />
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
