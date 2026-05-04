<script lang="ts">
  /**
   * App.svelte — Root shell: header, hash routing, location and extremes orchestration, child routes.
   * Wires data pipelines and application queries into route props; delegates rendering to routes.
   * Kind: Orchestrator / coordinator. Does not build diagram geometry or call the proxy directly.
   */
  import { onMount } from "svelte";
  import type { TideExtremesAtLocation } from "../core-models/TideExtremesAtLocation";
  import type { Town } from "../data/townSchema";
  import { subscribeSemanticMinuteCadence } from "../application/semanticMinuteCadence";
  import { decideCivilDayRolloverTideRefresh } from "../application/civilDayRolloverTick";
  import { createTideExtremesRefreshController } from "../application/tideExtremesRefreshController";
  import { loadTideExtremesForCurrentCivilDayQuery } from "../application/tideExtremesForCivilDayQuery";
  import { loadCurrentLocation, storeCurrentLocation } from "../data-pipelines/currentLocation";
  import { attachHashListener, route } from "../infrastructure/router.js";
  import {
    tideUxDevPreviewIdFromSearch,
    tideUxDevPreviewMaybeOverrideLoad,
    tideUxDevPreviewShortHeadline,
    type TideUxDevPreviewId,
  } from "../application/tide-ux-dev-preview/tideUxDevPreviewCatalog";
  import { getCurrentTideClockCivilDayDisplayWindowFromSystemClock } from "../time-services/getCurrentTideClockCivilDayDisplayWindow";
  import AppHeader from "./components/AppHeader.svelte";
  import Home from "./routes/Home.svelte";
  import LocationTowns2 from "./routes/LocationTowns2.svelte";
  import Settings from "./routes/Settings.svelte";
  import About from "./routes/About.svelte";
  import Acknowledgements from "./routes/Acknowledgements.svelte";
  import Support from "./routes/Support.svelte";
  import Cookies from "./routes/Cookies.svelte";
  import { THE_TIDE_DIAL, TIDE_DIAL_PRODUCTION_ORIGIN } from "./brand";
  import { surfaceModeForRoute } from "./routeSurfaceMode";

  /** Mirrors {@link RouteId} in `router.js` for header copy and route surface mode mapping. */
  type AppRouteId = Parameters<typeof surfaceModeForRoute>[0];

  type TidePredictionsLoadState = { status: "loading" | "ready" | "error" };
  let tideLoadState = $state<TidePredictionsLoadState>({ status: "ready" });
  /** Last successful civil-day slice; Home assembles the diagram spec from this. Not cleared on transient errors. */
  let lastSuccessfulTideExtremes = $state<TideExtremesAtLocation | undefined>(undefined);
  /** Local civil-day window start (ms) after the last successful load completed; drives midnight rollover detection. */
  let civilDayWindowStartMsAtLastSuccessfulLoad = $state<number | undefined>(undefined);
  /** After a failed rollover fetch, suppress re-entry for the same civil day (see `decideCivilDayRolloverTideRefresh`). */
  let lastRolloverAttemptCivilDayStartMs = $state<number | undefined>(undefined);
  let currentTown = $state<Town | undefined>(undefined);

  /** Dev-only: `?tideUxPreview=<id>` — simulates Category-B tide load outcomes. */
  let tideUxDevPreviewIdFromUrl = $state<TideUxDevPreviewId | null>(null);

  const tideUxDevPreviewBannerLine = $derived.by(() => {
    if (!import.meta.env.DEV || tideUxDevPreviewIdFromUrl === null) {
      return null;
    }
    return `Preview: ${tideUxDevPreviewShortHeadline(tideUxDevPreviewIdFromUrl)}`;
  });

  function readTideUxDevPreviewIdFromLocation(): TideUxDevPreviewId | null {
    if (!import.meta.env.DEV) return null;
    if (typeof window === "undefined") return null;
    const search =
      window.location.search ||
      (window.location.hash.includes("?")
        ? window.location.hash.slice(window.location.hash.indexOf("?"))
        : "");
    return tideUxDevPreviewIdFromSearch(search);
  }

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
    const devOverride = tideUxDevPreviewMaybeOverrideLoad(
      tideUxDevPreviewIdFromUrl,
      latitude,
      longitude,
    );
    if (devOverride !== null) {
      return await devOverride;
    }
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

  const { refreshTideExtremesForTown } = createTideExtremesRefreshController(
    {
      loadTideExtremesForCurrentCivilDay,
      civilDayWindowStartMsAfterSuccessfulLoad: () =>
        getCurrentTideClockCivilDayDisplayWindowFromSystemClock().startLocal.getTime(),
    },
    {
      onLoading: () => {
        tideLoadState = { status: "loading" };
      },
      onSuccess: ({ extremes, civilDayWindowStartMs }) => {
        lastSuccessfulTideExtremes = extremes;
        civilDayWindowStartMsAtLastSuccessfulLoad = civilDayWindowStartMs;
        lastRolloverAttemptCivilDayStartMs = undefined;
        tideLoadState = { status: "ready" };
      },
      onError: () => {
        tideLoadState = { status: "error" };
      },
      onLoadRejected: (e) => {
        appDiag("refreshTideExtremesForTown error", e);
      },
    }
  );

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
    const decision = decideCivilDayRolloverTideRefresh({
      town,
      tideLoadIsLoading: tideLoadState.status === "loading",
      currentCivilDayStartMs: currentStart,
      civilDayWindowStartMsAtLastSuccessfulLoad,
      lastRolloverAttemptCivilDayStartMs
    });
    if (decision.action === "none") {
      return;
    }
    lastRolloverAttemptCivilDayStartMs = decision.markRolloverAttemptCivilDayStartMs;
    refreshTideExtremesForTown(decision.town);
  }

  function headerPlaceholderForRoute(routeId: AppRouteId): string {
    switch (routeId) {
      case "location2":
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

  function documentTitleForRoute(routeId: AppRouteId): string {
    const h = headerPlaceholderForRoute(routeId);
    return h === "" ? THE_TIDE_DIAL : `${h} — ${THE_TIDE_DIAL}`;
  }

  onMount(() => {
    attachHashListener();
    appDiag("app root mounted, hash listener attached");
    tideUxDevPreviewIdFromUrl = readTideUxDevPreviewIdFromLocation();
    const town = loadCurrentLocation({ loader: localStorage });
    if (town !== undefined) {
      currentTown = town;
      refreshTideExtremesForTown(town);
    }
    let devUrlCleanup: (() => void) | undefined;
    if (import.meta.env.DEV) {
      const onUrlChange = (): void => {
        tideUxDevPreviewIdFromUrl = readTideUxDevPreviewIdFromLocation();
        const t = currentTown ?? loadCurrentLocation({ loader: localStorage });
        if (t !== undefined) {
          refreshTideExtremesForTown(t);
        }
      };
      window.addEventListener("hashchange", onUrlChange);
      window.addEventListener("popstate", onUrlChange);
      devUrlCleanup = () => {
        window.removeEventListener("hashchange", onUrlChange);
        window.removeEventListener("popstate", onUrlChange);
      };
    }
    const unsubMinute = subscribeSemanticMinuteCadence(() => {
      maybeRefreshTideAfterLocalMidnightRollover();
    });
    return () => {
      unsubMinute();
      devUrlCleanup?.();
    };
  });
</script>

<svelte:head>
  <title>{documentTitleForRoute($route)}</title>
  {#if import.meta.env.PROD}
    <link rel="canonical" href={`${TIDE_DIAL_PRODUCTION_ORIGIN}/`} />
  {/if}
</svelte:head>

<div class="app-frame" data-surface-mode={surfaceModeForRoute($route)}>
  {#if $route !== "home"}
    <AppHeader
      tone={"light"}
      center={{ kind: "title", title: headerPlaceholderForRoute($route) }}
    />
  {/if}

  <section
    class="content"
    class:content--home={$route === "home"}
    class:content--home-no-top-bar={$route === "home"}
  >
    {#if $route === "home"}
      <Home
        tideLoadState={tideLoadState}
        tideExtremes={lastSuccessfulTideExtremes}
        townName={currentTown?.name ?? "Unknown"}
        tideUxDevPreviewBannerLine={tideUxDevPreviewBannerLine}
      />
    {:else if $route === "location2"}
      <LocationTowns2 setCurrentLocation={setCurrentLocation} />
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
