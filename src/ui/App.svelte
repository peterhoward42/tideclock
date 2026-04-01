<script lang="ts">
  // App root: `.app-frame` wraps header + routed content; host orchestration (localStorage, tide loads). Routes stay thin.
  import { onMount } from "svelte";
  import type { TideExtremesAtLocation } from "../core-models/TideExtremesAtLocation";
  import type { Town } from "../data/bakedTowns";
  import { createDiagramGenerationCollaborator } from "../application/diagramGenerationCollaborator";
  import { loadCurrentLocation, storeCurrentLocation } from "../data-pipelines/currentLocation";
  import { loadTideExtremesForCurrentCivilDayQuery } from "../application/tideExtremesForCivilDayQuery";
  import { defaultHomeScreenModel, type HomeScreenModel } from "../clock-presentation/homeScreenModel";
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
  const diagramGeneration = createDiagramGenerationCollaborator();
  /**
   * Monotonic counter for in-flight tide loads. Each refresh captures the value after incrementing;
   * when the async work finishes, it only updates state if that capture still matches. Rationale:
   * network latency is unbounded, so responses can complete out of order (town A slow, town B fast).
   * Without this guard, a late response for an abandoned location would overwrite the UI with the
   * wrong place’s tides and corrupt `homeScreenModel`.
   */
  let tideLoadSerial = $state(0);
  let homeScreenModel = $state<HomeScreenModel>({
    ...defaultHomeScreenModel,
    diagramGeneration
  });
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
   * Loads civil-day tide extremes for `town` and refreshes the home screen model so clock-scene tide
   * semantics stay aligned with the latest successful fetch.
   */
  function refreshTideExtremesForTown(town: Town): void {
    const serial = ++tideLoadSerial;
    tideLoadState = { status: "loading" };
    void (async () => {
      try {
        const result = await loadTideExtremesForCurrentCivilDay(town.lat, town.lon);
        if (serial !== tideLoadSerial) {
          return;
        }
        tideLoadState = result !== undefined ? { status: "ready" } : { status: "error" };
      } catch (e) {
        if (serial !== tideLoadSerial) {
          return;
        }
        appDiag("refreshTideExtremesForTown error", e);
        tideLoadState = { status: "error" };
      }
    })();
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
    refreshTideExtremesForTown(town);
  }

  function closeMenu(): void {
    menuDetails?.removeAttribute("open");
  }

  onMount(() => {
    attachHashListener();
    appDiag("app root mounted, hash listener attached");
    const town = loadCurrentLocation({ loader: localStorage });
    if (town !== undefined) {
      refreshTideExtremesForTown(town);
    }
  });
</script>

<div class="app-frame">
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
      <Home homeScreenModel={homeScreenModel} tideLoadState={tideLoadState} />
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
