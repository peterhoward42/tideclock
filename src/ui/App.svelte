<script lang="ts">
  // Root shell: hash router, tide proxy + `TidePredictionsCache`, and route outlets.
  import { onMount } from "svelte";
  import { attachHashListener, route } from "../infrastructure/router.js";
  import { createTidePredictionsModel } from "../core-models/tide-predictions";
  import { TidePredictionsCache } from "../datapipelines/tideprediction-cache";
  import { createTideProxyFetcher } from "../datapipelines/tideproxy-fetcher";
  import { LocalStorageFacade } from "../infrastructure/local-storage-facade";
  import Home from "./routes/Home.svelte";
  import Settings from "./routes/Settings.svelte";
  import About from "./routes/About.svelte";
  import Acknowledgements from "./routes/Acknowledgements.svelte";
  import Support from "./routes/Support.svelte";
  import Cookies from "./routes/Cookies.svelte";

  console.log("[tideclock] boot: App.svelte module evaluated");

  const TIDE_CACHE_KEY = "tidepredictions:v1";

  /** Placeholder coordinates; location selection will replace these. */
  const PLACEHOLDER_LAT = 51.5;
  const PLACEHOLDER_LON = -0.1;

  const tidePredictionsModel = createTidePredictionsModel();

  const tidePredictionsCache = new TidePredictionsCache({
    key: TIDE_CACHE_KEY,
    storage: new LocalStorageFacade(),
  });

  function tideProxyBaseUrl(): string {
    const url = import.meta.env.VITE_TIDE_PROXY_BASE_URL;
    if (typeof url !== "string" || url.trim() === "") {
      throw new Error("VITE_TIDE_PROXY_BASE_URL is missing or empty");
    }
    return url.trim();
  }

  async function loadTidePredictions(): Promise<void> {
    console.log("[tideclock] tides: loadTidePredictions() started");
    const baseUrl = tideProxyBaseUrl();
    console.log("[tideclock] tides: resolved proxy base URL and placeholder location", {
      baseUrl,
      lat: PLACEHOLDER_LAT,
      lon: PLACEHOLDER_LON,
    });

    const fetcher = createTideProxyFetcher({
      baseUrl,
      lat: PLACEHOLDER_LAT,
      lon: PLACEHOLDER_LON,
      model: tidePredictionsModel,
    });
    console.log(
      "[tideclock] tides: calling tidePredictionsCache.getOrFetch(fetcher) — network only runs on cache miss"
    );

    const result = await tidePredictionsCache.getOrFetch(fetcher);

    tidePredictionsModel.extremes = result.extremes;
    tidePredictionsModel.expiresAt = result.expiresAt;
    console.log("[tideclock] tides: loadTidePredictions() finished", {
      extremesCount: result.extremes.length,
    });
  }

  onMount(() => {
    console.log("[tideclock] boot: App onMount (DOM ready, starting router + tides)");
    attachHashListener();
    void loadTidePredictions();
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
      <Home tidePredictionsModel={tidePredictionsModel} />
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
