<script lang="ts">
  /**
   * App.svelte — Root shell: header, hash routing, location and extremes orchestration, child routes.
   * Wires data pipelines and application queries into route props; delegates rendering to routes.
   * Kind: Orchestrator / coordinator. Does not build diagram geometry or call the proxy directly.
   */
  import { onMount } from "svelte";
  import type { TideExtremesAtLocation } from "../core-models/TideExtremesAtLocation";
  import type { Town } from "../data/townSchema";
  import { subscribeMinuteCadence } from "../time-services/minuteCadence";
  import { decideRolloverTideRefresh } from "../application/civilDayRolloverTick";
  import { createTideRefreshController } from "../application/tideRefreshController";
  import type { TidePresentation } from "./routes/home/routeProps";
  import {
    createQuotaSessionGate,
    loadCivilDayExtremes,
  } from "../application/civilDayExtremesQuery";
  import { defaultTideLocationTown } from "../data/bakedTowns2";
  import { loadTownPick, storeTownPick } from "../data-pipelines/townPick";
  import { attachHashListener, route } from "../infrastructure/router.js";
  import {
    tidePreviewIdFromSearch,
    tidePreviewMaybeOverrideLoad,
    tidePreviewShortHeadline,
    type TidePreviewId,
  } from "../application/tide-dev-preview/previewCatalog";
  import { civilDayWindowFromHostClock } from "../time-services/currentCivilDayWindow";
  import AppHeader from "./components/AppHeader.svelte";
  import Home from "./routes/Home.svelte";
  import LocationRoute from "./routes/LocationRoute.svelte";
  import AboutRoute from "./routes/AboutRoute.svelte";
  import OnWallRoute from "./routes/OnWallRoute.svelte";
  import StoryRoute from "./routes/StoryRoute.svelte";
  import TideNerdRoute from "./routes/TideNerdRoute.svelte";
  import SoftwareNerdRoute from "./routes/SoftwareNerdRoute.svelte";
  import { THE_TIDE_DIAL, TIDE_DIAL_PRODUCTION_ORIGIN } from "./brand";
  import { surfaceModeForRoute } from "./routeSurfaceMode";
  import { OPERATOR_NOTICE_ACTIVE } from "./operatorNoticeConfig";
  import { effectiveSearchFromLocation } from "./homeUrlQuery";
  import { handleOffSiteLinkClick } from "./externalLink";

  /** Mirrors {@link RouteId} in `router.js` for header copy and route surface mode mapping. */
  type AppRouteId = Parameters<typeof surfaceModeForRoute>[0];

  let tidePresentation = $state<TidePresentation>(
    OPERATOR_NOTICE_ACTIVE ? { kind: "operatorNotice" } : { kind: "ready" },
  );
  /** Last successful civil-day slice; Home assembles the diagram spec from this. Not cleared on transient errors. */
  let lastSuccessfulTideExtremes = $state<TideExtremesAtLocation | undefined>(undefined);
  /** Local civil-day window start (ms) after the last successful load completed; drives midnight rollover detection. */
  let civilDayWindowStartMsAtLastSuccessfulLoad = $state<number | undefined>(undefined);
  /** After a failed rollover fetch, suppress re-entry for the same civil day (see `decideRolloverTideRefresh`). */
  let lastRolloverAttemptCivilDayStartMs = $state<number | undefined>(undefined);
  /** Dev-only: `?tideUxPreview=<id>` — simulates Category-B tide load outcomes. */
  let tidePreviewIdFromUrl = $state<TidePreviewId | null>(null);
  /** Session-only: after proxy quota exhaustion, load path bypasses persisted extremes; cleared on successful fetch. */
  const tideQuotaSession = createQuotaSessionGate();

  function readStoredTownPickBrowser(): Town | undefined {
    try {
      if (typeof localStorage === "undefined") return undefined;
      return loadTownPick({ loader: localStorage });
    } catch {
      return undefined;
    }
  }

  const initialStoredTown = readStoredTownPickBrowser();
  const canAccessLocationStorage = typeof localStorage !== "undefined";

  let currentTown = $state<Town | undefined>(
    initialStoredTown ?? (canAccessLocationStorage ? defaultTideLocationTown : undefined),
  );

  /**
   * True when no town was in storage at boot: lower-left caption explains the shipped default until dismissed
   * (dismissal persists that default like a normal menu pick).
   */
  let showDefaultLocationExplainer = $state(
    canAccessLocationStorage && initialStoredTown === undefined,
  );

  const tidePreviewBannerLine = $derived.by(() => {
    if (!import.meta.env.DEV || tidePreviewIdFromUrl === null) {
      return null;
    }
    return `Preview: ${tidePreviewShortHeadline(tidePreviewIdFromUrl)}`;
  });

  const defaultLocationExplainerPlaceLine = $derived.by(() => {
    const town = currentTown;
    if (town === undefined) return "Unknown";
    return town.county !== "" ? `${town.name}, ${town.county}` : town.name;
  });

  function effectiveSearchFromWindow(): string {
    if (typeof window === "undefined") return "";
    return effectiveSearchFromLocation(
      window.location.search,
      window.location.hash,
    );
  }

  function readTidePreviewIdFromLocation(): TidePreviewId | null {
    if (!import.meta.env.DEV) return null;
    return tidePreviewIdFromSearch(effectiveSearchFromWindow());
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
    const devOverride = tidePreviewMaybeOverrideLoad(
      tidePreviewIdFromUrl,
      latitude,
      longitude,
    );
    if (devOverride !== null) {
      return await devOverride;
    }
    try {
      const result = await loadCivilDayExtremes(latitude, longitude, {
        loader: localStorage,
        storer: localStorage,
        baseUrl: import.meta.env.VITE_TIDE_PROXY_BASE_URL,
        quotaSession: tideQuotaSession,
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

  const { refreshTidesForTown } = createTideRefreshController(
    {
      loadTideExtremesForCurrentCivilDay,
      civilDayWindowStartMsAfterSuccessfulLoad: () =>
        civilDayWindowFromHostClock().startLocal.getTime(),
    },
    {
      onLoading: () => {
        tidePresentation = { kind: "loading" };
      },
      onSuccess: ({ extremes, civilDayWindowStartMs }) => {
        tideQuotaSession.clearSessionQuotaExhausted();
        lastSuccessfulTideExtremes = extremes;
        civilDayWindowStartMsAtLastSuccessfulLoad = civilDayWindowStartMs;
        lastRolloverAttemptCivilDayStartMs = undefined;
        tidePresentation = { kind: "ready" };
      },
      onLoadFailed: () => {
        tidePresentation = { kind: "loadFailed" };
      },
      onQuotaExhausted: () => {
        tideQuotaSession.setSessionQuotaExhausted();
        tidePresentation = { kind: "quotaExhausted" };
      },
      onLoadRejected: (e) => {
        appDiag("refreshTidesForTown error", e);
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
    storeTownPick(town, { storer: localStorage });
    appDiag("setCurrentLocation stored town in localStorage", { townId: town.id });
    showDefaultLocationExplainer = false;
    refreshTidesForTown(town);
  }

  function dismissDefaultLocationExplainer(): void {
    storeTownPick(defaultTideLocationTown, { storer: localStorage });
    showDefaultLocationExplainer = false;
    appDiag("default location explainer dismissed; Looe persisted", {
      townId: defaultTideLocationTown.id,
    });
  }

  function maybeRefreshTideAfterLocalMidnightRollover(): void {
    if (OPERATOR_NOTICE_ACTIVE) {
      return;
    }
    const town = loadTownPick({ loader: localStorage }) ?? currentTown;
    currentTown = town;
    const currentStart = civilDayWindowFromHostClock().startLocal.getTime();
    const decision = decideRolloverTideRefresh({
      town,
      tideLoadIsLoading: tidePresentation.kind === "loading",
      currentCivilDayStartMs: currentStart,
      civilDayWindowStartMsAtLastSuccessfulLoad,
      lastRolloverAttemptCivilDayStartMs
    });
    if (decision.action === "none") {
      return;
    }
    lastRolloverAttemptCivilDayStartMs = decision.markRolloverAttemptCivilDayStartMs;
    refreshTidesForTown(decision.town);
  }

  function headerPlaceholderForRoute(routeId: AppRouteId): string {
    switch (routeId) {
      case "location":
        return "Location";
      case "about":
        return "About";
      case "onwall":
        return "Stick it on the wall";
      case "story":
        return "Story";
      case "tidenerd":
        return "Tide Nerd";
      case "softwarenerd":
        return "Software Nerd";
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
    tidePreviewIdFromUrl = readTidePreviewIdFromLocation();
    if (!OPERATOR_NOTICE_ACTIVE && currentTown !== undefined) {
      refreshTidesForTown(currentTown);
    }
    let devUrlCleanup: (() => void) | undefined;
    if (import.meta.env.DEV) {
      const onUrlChange = (): void => {
        tidePreviewIdFromUrl = readTidePreviewIdFromLocation();
        const t = currentTown ?? loadTownPick({ loader: localStorage });
        if (t !== undefined) {
          refreshTidesForTown(t);
        }
      };
      window.addEventListener("hashchange", onUrlChange);
      window.addEventListener("popstate", onUrlChange);
      devUrlCleanup = () => {
        window.removeEventListener("hashchange", onUrlChange);
        window.removeEventListener("popstate", onUrlChange);
      };
    }
    const unsubMinute = subscribeMinuteCadence(() => {
      maybeRefreshTideAfterLocalMidnightRollover();
    });
    document.addEventListener("click", handleOffSiteLinkClick);
    return () => {
      unsubMinute();
      devUrlCleanup?.();
      document.removeEventListener("click", handleOffSiteLinkClick);
    };
  });
</script>

<svelte:head>
  <title
    >{OPERATOR_NOTICE_ACTIVE
      ? THE_TIDE_DIAL
      : documentTitleForRoute($route)}</title
  >
  {#if import.meta.env.PROD}
    <link rel="canonical" href={`${TIDE_DIAL_PRODUCTION_ORIGIN}/`} />
  {/if}
</svelte:head>

{#if OPERATOR_NOTICE_ACTIVE}
  <div class="app-frame" data-surface-mode="home">
    <section class="content content--home content--home-no-top-bar">
      <Home
        tidePresentation={{ kind: "operatorNotice" }}
        tideExtremes={undefined}
        townName={currentTown?.name ?? "Unknown"}
        tidePreviewBannerLine={null}
        defaultLocationExplainerOpen={false}
        defaultLocationExplainerPlaceLine={defaultLocationExplainerPlaceLine}
        onDismissDefaultLocationExplainer={dismissDefaultLocationExplainer}
      />
    </section>
  </div>
{:else}
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
          {tidePresentation}
          tideExtremes={tidePresentation.kind === "ready"
            ? lastSuccessfulTideExtremes
            : undefined}
          townName={currentTown?.name ?? "Unknown"}
          tidePreviewBannerLine={tidePreviewBannerLine}
          defaultLocationExplainerOpen={showDefaultLocationExplainer}
          defaultLocationExplainerPlaceLine={defaultLocationExplainerPlaceLine}
          onDismissDefaultLocationExplainer={dismissDefaultLocationExplainer}
        />
      {:else if $route === "location"}
        <LocationRoute setCurrentLocation={setCurrentLocation} />
      {:else if $route === "about"}
        <AboutRoute />
      {:else if $route === "onwall"}
        <OnWallRoute />
      {:else if $route === "story"}
        <StoryRoute />
      {:else if $route === "tidenerd"}
        <TideNerdRoute />
      {:else if $route === "softwarenerd"}
        <SoftwareNerdRoute />
      {/if}
    </section>
  </div>
{/if}
