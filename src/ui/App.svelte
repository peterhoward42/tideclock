<script lang="ts">
  /**
   * App.svelte — Root shell: header, hash routing, location and extremes orchestration, child routes.
   * Wires data pipelines and application queries into route props; delegates rendering to routes.
   * Kind: Orchestrator / coordinator. Does not build diagram geometry or call the proxy directly.
   */
  import { onMount } from "svelte";
  import type { TideExtremesAtLocation } from "../core-models/TideExtremesAtLocation";
  import type { Town } from "../data/bakedTowns";
  import { nowMs } from "../application/appClock.js";
  import {
    shouldTriggerCivilDayRolloverRefresh,
    type CivilDayRolloverRefreshInput
  } from "../application/civilDayRolloverRefresh";
  import { loadTideExtremesForCurrentCivilDayQuery } from "../application/tideExtremesForCivilDayQuery";
  import { loadCurrentLocation, storeCurrentLocation } from "../data-pipelines/currentLocation";
  import { attachHashListener, route } from "../infrastructure/router.js";
  import { getCurrentTideClockCivilDayDisplayWindowFromSystemClock } from "../time-services/getCurrentTideClockCivilDayDisplayWindow";
  import Home from "./routes/Home.svelte";
  import Location from "./routes/Location.svelte";
  import Settings from "./routes/Settings.svelte";
  import About from "./routes/About.svelte";
  import Acknowledgements from "./routes/Acknowledgements.svelte";
  import Support from "./routes/Support.svelte";
  import Cookies from "./routes/Cookies.svelte";

  /** Mirrors {@link RouteId} in `router.js` for header copy without importing JS typedefs. */
  type AppRouteId =
    | "home"
    | "location"
    | "settings"
    | "about"
    | "acknowledgements"
    | "support"
    | "cookies";

  type TidePredictionsLoadState = { status: "loading" | "ready" | "error" };
  let tideLoadState = $state<TidePredictionsLoadState>({ status: "ready" });
  /**
   * Monotonic counter for in-flight tide loads. Each refresh captures the value after incrementing;
   * when the async work finishes, it only updates state if that capture still matches. Rationale:
   * network latency is unbounded, so responses can complete out of order (town A slow, town B fast).
   * Without this guard, a late response for an abandoned location would overwrite the UI with the
   * wrong place's tides.
   */
  let tideLoadSerial = $state(0);
  /** Last successful civil-day slice; Home assembles the diagram spec from this. Not cleared on transient errors. */
  let lastSuccessfulTideExtremes = $state<TideExtremesAtLocation | undefined>(undefined);
  /** Local civil-day window start (ms) after the last successful load completed; drives midnight rollover detection. */
  let civilDayWindowStartMsAtLastSuccessfulLoad = $state<number | undefined>(undefined);
  /** After a failed rollover fetch, suppress re-entry for the same civil day (see `shouldTriggerCivilDayRolloverRefresh`). */
  let lastRolloverAttemptCivilDayStartMs = $state<number | undefined>(undefined);
  let menuDetails = $state<HTMLDetailsElement | undefined>(undefined);
  let currentTown = $state<Town | undefined>(undefined);

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
   * Intent hold (Phase 5): this refresh flow is retained as orchestration policy
   * (load sequencing + stale-response guards), not diagram-semantic ownership.
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
        if (result !== undefined) {
          lastSuccessfulTideExtremes = result;
          civilDayWindowStartMsAtLastSuccessfulLoad =
            getCurrentTideClockCivilDayDisplayWindowFromSystemClock().startLocal.getTime();
          lastRolloverAttemptCivilDayStartMs = undefined;
          tideLoadState = { status: "ready" };
        } else {
          tideLoadState = { status: "error" };
        }
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
   * Intent hold (Phase 5): keep this as the single trigger point for follow-on
   * orchestration work (reloads/navigation/etc.) until a concrete replacement exists.
   */
  function setCurrentLocation(town: Town): void {
    appDiag("setCurrentLocation called from Location route", {
      townId: town.id,
      townName: town.name,
      county: town.county,
      country: town.country
    });
    lastSuccessfulTideExtremes = undefined;
    civilDayWindowStartMsAtLastSuccessfulLoad = undefined;
    lastRolloverAttemptCivilDayStartMs = undefined;
    currentTown = town;
    storeCurrentLocation(town, { storer: localStorage });
    appDiag("setCurrentLocation stored town in localStorage", { townId: town.id });
    refreshTideExtremesForTown(town);
  }

  function maybeRefreshTideAfterLocalMidnightRollover(): void {
    const town = loadCurrentLocation({ loader: localStorage });
    currentTown = town;
    const currentStart = getCurrentTideClockCivilDayDisplayWindowFromSystemClock().startLocal.getTime();
    const rolloverInput: CivilDayRolloverRefreshInput = {
      hasSelectedTown: town !== undefined,
      tideLoadIsLoading: tideLoadState.status === "loading",
      currentCivilDayStartMs: currentStart,
      lastSuccessfulLoadCivilDayStartMs: civilDayWindowStartMsAtLastSuccessfulLoad,
      lastRolloverAttemptCivilDayStartMs: lastRolloverAttemptCivilDayStartMs
    };
    if (!shouldTriggerCivilDayRolloverRefresh(rolloverInput)) {
      return;
    }
    if (town === undefined) {
      return;
    }
    lastRolloverAttemptCivilDayStartMs = currentStart;
    refreshTideExtremesForTown(town);
  }

  function closeMenu(): void {
    menuDetails?.removeAttribute("open");
  }

  function headerPlaceholderForRoute(routeId: AppRouteId): string {
    switch (routeId) {
      case "location":
        return "Location";
      case "settings":
        return "Settings";
      case "about":
        return "About";
      case "acknowledgements":
        return "Acknowledgements";
      case "support":
        return "Support";
      case "cookies":
        return "Cookies";
      case "home":
        return "";
      default:
        return "";
    }
  }

  onMount(() => {
    attachHashListener();
    appDiag("app root mounted, hash listener attached");
    const town = loadCurrentLocation({ loader: localStorage });
    if (town !== undefined) {
      currentTown = town;
      refreshTideExtremesForTown(town);
    }
    const unsubNow = nowMs.subscribe(() => {
      maybeRefreshTideAfterLocalMidnightRollover();
    });
    return () => unsubNow();
  });
</script>

<div class="app-frame">
  <header class="top-bar">
    <div class="header-left">
      {#if $route === "home"}
        {#if currentTown}
          <span class="header-location">
            Tides in <strong>{currentTown.name}</strong> today
          </span>
        {:else}
          <span class="header-location">Tides today</span>
        {/if}
        <a
          class="location-change"
          href="#/location"
          onclick={closeMenu}
          aria-label="Change location"
        >
          &gt;&gt;
        </a>
      {:else}
        <span class="header-route-placeholder">{headerPlaceholderForRoute($route)}</span>
      {/if}
    </div>
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

  <section class="content" class:content--home={$route === "home"}>
    {#if $route === "home"}
      <Home tideLoadState={tideLoadState} tideExtremes={lastSuccessfulTideExtremes} />
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
