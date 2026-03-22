<script lang="ts">
  // Root shell: hash router, tide proxy + `TidePredictionsCache`, location persistence, and route outlets.
  import { onMount } from "svelte";
  import { attachHashListener, route } from "../infrastructure/router.js";
  import { createTidePredictionsModel } from "../core-models/tide-predictions";
  import { TidePredictionsCache } from "../datapipelines/tideprediction-cache";
  import { createTideProxyFetcher } from "../datapipelines/tideproxy-fetcher";
  import { LocalStorageFacade } from "../infrastructure/local-storage-facade";
  import {
    loadLocationWithDefaultPersist,
    writeLocation,
  } from "../application/location-persistence";
  import type { TidePredictionsLoadState } from "../application/tide-predictions-load-state";
  import Home from "./routes/Home.svelte";
  import Settings from "./routes/Settings.svelte";
  import About from "./routes/About.svelte";
  import Acknowledgements from "./routes/Acknowledgements.svelte";
  import Support from "./routes/Support.svelte";
  import Cookies from "./routes/Cookies.svelte";

  console.log("[tideclock] boot: App.svelte module evaluated");

  const TIDE_CACHE_KEY = "tidepredictions:v1";

  const persistence = new LocalStorageFacade();

  const tidePredictionsModel = createTidePredictionsModel();

  const tidePredictionsCache = new TidePredictionsCache({
    key: TIDE_CACHE_KEY,
    storage: persistence,
  });

  let tideLoadState = $state<TidePredictionsLoadState>({ status: "loading" });

  function tideProxyBaseUrl(): string {
    const url = import.meta.env.VITE_TIDE_PROXY_BASE_URL;
    if (typeof url !== "string" || url.trim() === "") {
      throw new Error("VITE_TIDE_PROXY_BASE_URL is missing or empty");
    }
    return url.trim();
  }

  /**
   * Loads or refetches tides for coordinates via `getOrFetch` (cache hit only when fresh and lat/lon match the stored row).
   */
  async function fetchTidesForLocation(lat: number, lon: number): Promise<void> {
    tideLoadState = { status: "loading" };

    try {
      const baseUrl = tideProxyBaseUrl();
      console.log("[tideclock] tides: fetch for location", { baseUrl, lat, lon });

      const fetcher = createTideProxyFetcher({
        baseUrl,
        lat,
        lon,
        model: tidePredictionsModel,
      });

      const result = await tidePredictionsCache.getOrFetch(fetcher, { lat, lon });

      tidePredictionsModel.extremes = result.extremes;
      tidePredictionsModel.expiresAt = result.expiresAt;
      tideLoadState = { status: "ready" };
      console.log("[tideclock] tides: fetch finished", {
        extremesCount: result.extremes.length,
      });
    } catch (e) {
      console.error("[tideclock] tides: fetch failed", e);
      tideLoadState = { status: "error" };
    }
  }

  /**
   * Persist first, clear the in-memory model so the UI does not show the previous location’s tides while loading, then refetch.
   * Storage cache does not need a separate clear: `getOrFetch` misses when coordinates differ from the stored row.
   */
  export async function applyLocation(lat: number, lon: number): Promise<void> {
    writeLocation(persistence, lat, lon);
    tidePredictionsModel.extremes = [];
    delete tidePredictionsModel.expiresAt;
    await fetchTidesForLocation(lat, lon);
  }

  async function loadTidePredictionsOnBoot(): Promise<void> {
    const loc = loadLocationWithDefaultPersist(persistence);
    await fetchTidesForLocation(loc.lat, loc.lon);
  }

  onMount(() => {
    console.log("[tideclock] boot: App onMount (DOM ready, starting router + tides)");
    attachHashListener();
    void loadTidePredictionsOnBoot();
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
