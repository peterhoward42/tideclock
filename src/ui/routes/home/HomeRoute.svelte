<script lang="ts">
  /**
   * Home route orchestration — civil-day tide diagram: props and stores in, diagram SVG and chrome out.
   * Skim order below: inputs → collaborator → state → derived readouts → effects → handlers.
   * Minute cadence drives full diagram regeneration (BRHC bundle + hand readout embedded in fresh SVG).
   * Does not own proxy fetch (receives extremes from the shell).
   */
  import { get } from "svelte/store";
  import { onMount, tick } from "svelte";

  import {
    buildDiagramSpec,
    utcIsoToLocalCanonicalTimeLocal,
  } from "../../../application/buildDiagramSpec";
  import {
    diagramPreviewIdFromSearch,
    type DiagramPreviewId,
  } from "../../../application/diagram-dev-preview/previewCatalog";
  import {
    formatDiagramPreviewBanner,
    homeDiagramPreviewIsFrozen,
    resolveHomeDiagramPreview,
  } from "../../../application/diagram-dev-preview/resolveForHome";
  import {
    localCanonicalTimeNow,
    localBrhcDatePrefix,
  } from "../../../application/localTimeStrings";
  import {
    createDiagramCollaborator,
    renderSceneSvg,
    type DiagramCollaborator,
  } from "../../../application/diagramCollaborator";
  import { deriveNextTideSemantics } from "../../../application/nextTideSemantics";
  import { subscribeMinuteCadence } from "../../../application/minuteCadence";
  import { displayOptimisation } from "../../displayOptimisation";
  import HomeRouteDevPreviewBanners from "./HomeRouteDevPreviewBanners.svelte";
  import HomeRouteDomDebugPanel from "./HomeRouteDomDebugPanel.svelte";
  import HomeRouteTidePanels from "./HomeRouteTidePanels.svelte";
  import HomePwaStandaloneSetupOverlay from "./HomePwaStandaloneSetupOverlay.svelte";
  import {
    computeMenuPanelAnchorStyle,
    queryMenuTriggerGroup,
    scheduleDiagramDevPresentation,
  } from "./diagramDom";
  import { mountLetterboxSlackObserver } from "./instrumentLetterboxObserver";
  import { mountMenuSvgTriggerWire } from "./menuSvgTriggerWire";
  import type { RouteProps } from "./routeProps";
  import {
    onboardingDeferDefaultLocationExplainerToLandscape,
    shouldShowHomeLandscapeHint,
  } from "../../homeLandscapeHint";
  import {
    effectiveSearchFromLocation,
    homeDevDebugFlagsFromSearch,
    pwaSetupDevPreviewWanted,
    pwaSetupDevResetWanted,
  } from "../../homeUrlQuery";
  import { mountOrientationLock } from "./orientationLock";
  import { mountScreenWakeLock } from "./screenWakeLock";
  import {
    getKeepAwakeUserEnabled,
    keepAwakeUserStore,
    setKeepAwakeUserEnabled,
    setTideWakePresentation,
    tideWakePresentationStore,
  } from "./pwaUi";
  import { isWakeLockApiSupported } from "./wakeLockSupport";
  import {
    clearStandaloneSetupHiddenForeverIn,
    clearStandaloneSetupSessionDismissal,
    readStandaloneSetupDismissedThisSession,
    readStandaloneSetupHiddenForever,
    writeStandaloneSetupDismissedThisSession,
    writeStandaloneSetupHiddenForever,
  } from "./pwaPreferences";
  import { isStandaloneDisplayMode } from "./pwaDisplayMode";
  import {
    getDiagramFullscreenTarget,
    toggleInstrumentFullscreen,
  } from "./fullscreen";
  import { manualInstallStepsFromUserAgent } from "./installFlow";

  let {
    tideLoadState,
    tideExtremes,
    townName,
    tidePreviewBannerLine,
    defaultLocationExplainerOpen,
    defaultLocationExplainerPlaceLine,
    onDismissDefaultLocationExplainer,
  }: RouteProps = $props();

  // Diagram generation collaborator (generate + render entry; owns no DOM)
  const collaborator: DiagramCollaborator = createDiagramCollaborator();

  // Mutable route state ($state)
  /** Drives Loop B: bumps only on local minute rollover (aligned scheduler), not every second. */
  let minuteEpoch = $state(Math.floor(Date.now() / 60_000));

  /** Dev-only: `?diagramPreview=<id>` (see docs/planning/diagram-dev-preview-catalog.md). */
  let diagramPreviewIdFromUrl = $state<DiagramPreviewId | null>(null);

  let diagramSvg = $state("");
  let diagramError = $state<string | undefined>(undefined);
  /** Container for injected SVG; diagram text updates each minute via full scene regen (see minute cadence below). */
  let diagramHostEl = $state<HTMLElement | undefined>(undefined);
  let homeRouteEl = $state<HTMLElement | undefined>(undefined);
  let homeInstrumentEl = $state<HTMLElement | undefined>(undefined);
  let homeMenuPanelEl = $state<HTMLElement | undefined>(undefined);
  let homeMenuOpen = $state(false);
  let homeMenuPanelStyle = $state("left: 0px; bottom: 0px;");
  let homeFullscreenActive = $state(false);
  let homeContactOpen = $state(false);
  let homeInstallInfoOpen = $state(false);

  let pwaUserWants = $state(get(keepAwakeUserStore));
  let pwaTideViewPresentation = $state(get(tideWakePresentationStore));
  let pwaDisplaySectionOpen = $state(false);
  let pwaSetupOverlayOpen = $state(false);
  /** In dev, `?pwaSetup=1` in a non-installed tab. */
  let pwaDevPreviewInTab = $state(false);
  /** For menu “show welcome” + first-run; set on mount. */
  let isStandalonePwa = $state(false);
  /** When true, show battery/heat blurb (off when charging, if we can tell). */
  let pwaShowBatteryBlurb = $state(true);

  /** Snapshot from {@link displayOptimisation}; sole source for hint device/aspect policy. */
  let displaySnapshot = $state(get(displayOptimisation));
  /** Vertical letterbox slack (px) for `xMidYMid meet` fit of the diagram SVG inside the instrument. */
  let verticalLetterboxSlackPx = $state(0);

  /** Dev-only: optional debug tooling (toggle with query params). */
  let domDumpEnabled = $state(false);
  let outlineEnabled = $state(false);
  let previewFrameEnabled = $state(false);
  let domSummary = $state<string>("");

  // Derived readouts ($derived)
  const showLandscapeHint = $derived(
    diagramSvg !== "" &&
      shouldShowHomeLandscapeHint(displaySnapshot, verticalLetterboxSlackPx),
  );

  const homeDiagramPreview = $derived.by(() =>
    resolveHomeDiagramPreview({
      dev: import.meta.env.DEV,
      previewId: diagramPreviewIdFromUrl,
      tideExtremes,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
    }),
  );

  const diagramPreviewLive = $derived(
    homeDiagramPreviewIsFrozen(homeDiagramPreview),
  );

  const diagramPreviewBannerLine = $derived(
    formatDiagramPreviewBanner(homeDiagramPreview),
  );

  const homeInstallManualSteps = $derived(
    manualInstallStepsFromUserAgent(
      typeof navigator !== "undefined" ? navigator.userAgent : null,
    ),
  );

  /**
   * Wait for tides + diagram paint before showing the caption so “showing tides for …”
   * is not ahead of the async fetch / SVG generation. Portrait touch phone/tablet: defer until
   * landscape so only the rotation encouragement shows (see docs/planning/onboarding.md).
   */
  const defaultLocationExplainerVisible = $derived.by(() => {
    if (!defaultLocationExplainerOpen) return false;
    if (onboardingDeferDefaultLocationExplainerToLandscape(displaySnapshot)) {
      return false;
    }
    if (tideLoadState.status !== "ready" || tideExtremes === undefined) {
      return false;
    }
    if (diagramError !== undefined) return false;
    if (tideExtremes.extremes.length === 0) {
      return true;
    }
    return diagramSvg !== "";
  });

  const pwaForHomeMenu = $derived({
    sectionOpen: pwaDisplaySectionOpen,
    apiSupported: isWakeLockApiSupported(),
    isHomeRoute: true,
    userWants: pwaUserWants,
    homePresentation: pwaTideViewPresentation,
    showBatteryBlurb: pwaShowBatteryBlurb,
    onToggleSection: () => {
      pwaDisplaySectionOpen = !pwaDisplaySectionOpen;
    },
    onToggle: (next: boolean) => {
      setKeepAwakeUserEnabled(next);
    },
    showWelcomeCardEntry: isStandalonePwa,
    onShowWelcomeCard: () => {
      pwaSetupOverlayOpen = true;
      pwaDisplaySectionOpen = false;
      homeMenuOpen = false;
    },
  });

  // Subscriptions and lifecycle (onMount)
  onMount(() => {
    if (!import.meta.env.DEV) return;
    try {
      const debugFlags = homeDevDebugFlagsFromSearch(
        window.location.search,
      );
      domDumpEnabled = debugFlags.domDump;
      outlineEnabled = debugFlags.outline;
      previewFrameEnabled = debugFlags.previewFrame;
      diagramPreviewIdFromUrl = readDiagramPreviewIdFromLocation();

      const onUrlChange = (): void => {
        diagramPreviewIdFromUrl = readDiagramPreviewIdFromLocation();
      };
      window.addEventListener("hashchange", onUrlChange);
      window.addEventListener("popstate", onUrlChange);
      if (domDumpEnabled) refreshDomSummary();

      return () => {
        window.removeEventListener("hashchange", onUrlChange);
        window.removeEventListener("popstate", onUrlChange);
      };
    } catch {
      // ignore (non-browser / tests)
    }
  });

  onMount(() =>
    subscribeMinuteCadence(
      (epoch) => {
        minuteEpoch = epoch;
      },
      { fireImmediately: false },
    ),
  );

  onMount(() => displayOptimisation.subscribe((v) => (displaySnapshot = v)));

  onMount(() =>
    keepAwakeUserStore.subscribe((v) => (pwaUserWants = v)),
  );

  onMount(() =>
    tideWakePresentationStore.subscribe(
      (v) => (pwaTideViewPresentation = v),
    ),
  );

  onMount(() => {
    const wake = mountScreenWakeLock({
      shouldRequestLock: getKeepAwakeUserEnabled,
      onPresentationChange: (p) => {
        setTideWakePresentation(p);
      },
    });
    const unsubKeep = keepAwakeUserStore.subscribe(() => {
      wake.sync();
    });
    return () => {
      unsubKeep();
      wake.dispose();
      setTideWakePresentation(null);
    };
  });

  onMount(() => {
    if (typeof window === "undefined") return;
    const search = effectiveSearchFromLocation(
      window.location.search,
      window.location.hash,
    );
    isStandalonePwa = isStandaloneDisplayMode();

    if (import.meta.env.DEV) {
      if (pwaSetupDevResetWanted(search)) {
        clearStandaloneSetupSessionDismissal();
        if (typeof localStorage !== "undefined") {
          clearStandaloneSetupHiddenForeverIn(localStorage);
        }
      }
      if (pwaSetupDevPreviewWanted(search)) {
        pwaSetupOverlayOpen = true;
        pwaDevPreviewInTab = !isStandalonePwa;
      }
    }

    if (pwaSetupOverlayOpen) return;

    try {
      if (typeof localStorage === "undefined") return;
      if (!isStandalonePwa) return;
      if (readStandaloneSetupHiddenForever(localStorage)) return;
      if (readStandaloneSetupDismissedThisSession()) return;
      pwaSetupOverlayOpen = true;
    } catch {
      // ignore
    }
  });

  onMount(() => {
    const nav = navigator as Navigator & {
      getBattery?: () => Promise<{
        charging: boolean;
        addEventListener: (type: string, fn: () => void) => void;
      }>;
    };
    if (!nav.getBattery) return;
    void nav.getBattery().then((b) => {
      const apply = (): void => {
        pwaShowBatteryBlurb = b.charging !== true;
      };
      apply();
      b.addEventListener("chargingchange", apply);
    });
  });

  onMount(() => {
    const routeRoot = homeRouteEl;
    if (routeRoot == null) return;
    return mountOrientationLock(routeRoot);
  });

  onMount(() => {
    if (typeof document === "undefined") return;
    const runtimeDocument = document as Document & {
      webkitFullscreenElement?: Element | null;
    };
    const syncFullscreenState = (): void => {
      homeFullscreenActive =
        runtimeDocument.fullscreenElement != null ||
        runtimeDocument.webkitFullscreenElement != null;
    };
    syncFullscreenState();
    runtimeDocument.addEventListener("fullscreenchange", syncFullscreenState);
    runtimeDocument.addEventListener("webkitfullscreenchange", syncFullscreenState as EventListener);
    return () => {
      runtimeDocument.removeEventListener("fullscreenchange", syncFullscreenState);
      runtimeDocument.removeEventListener(
        "webkitfullscreenchange",
        syncFullscreenState as EventListener,
      );
    };
  });

  // Reactive effects ($effect) — diagram regen, SVG glue, measurement, menu wiring
  $effect(() => {
    if (!diagramPreviewLive) {
      void minuteEpoch;
    }
    const extremes = tideExtremes;
    const load = tideLoadState;

    if (
      load.status !== "ready" ||
      extremes === undefined ||
      extremes.extremes.length === 0
    ) {
      diagramSvg = "";
      diagramError = undefined;
      return;
    }

    try {
      const preview = homeDiagramPreview;
      const extremesForSpec =
        preview.state === "frozen" ? preview.extremesAtLocation : extremes;
      const wallClockMs =
        preview.state === "frozen" ? preview.frozenEpochMs : Date.now();
      const timeNow = localCanonicalTimeNow(wallClockMs);
      const brhcDatePrefix = localBrhcDatePrefix(wallClockMs);
      const baseSpec = buildDiagramSpec({
        extremesAtLocation: extremesForSpec,
        timeNow,
        brhcDatePrefix,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
        townName,
      });
      const derived = deriveNextTideSemantics(baseSpec);
      const spec = buildDiagramSpec({
        extremesAtLocation: extremesForSpec,
        timeNow,
        brhcDatePrefix,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
        townName,
        derivedSemantics: { nextTide: derived.nextTide },
      });
      const { scene, styleRuntime } = collaborator.generate(spec);
      diagramSvg = renderSceneSvg(scene, {
        styleRuntime,
        debug: { previewFrame: import.meta.env.DEV && previewFrameEnabled },
      });
      diagramError = undefined;
    } catch (e) {
      diagramSvg = "";
      diagramError = e instanceof Error ? e.message : String(e);
    }
  });

  $effect(() => {
    if (diagramHostEl == null) return;
    if (diagramSvg === "") return;

    // The diagram SVG should scale via CSS (`width/height: 100%`) + preserveAspectRatio.
    // Keep only tiny debug affordances here (outline, summary refresh).
    scheduleDiagramDevPresentation(diagramHostEl, {
      outlineEnabled,
      onAfterPaint: refreshDomSummary,
    });
  });

  $effect(() => {
    const figure = homeInstrumentEl;
    if (figure == null || diagramSvg === "") {
      verticalLetterboxSlackPx = 0;
      return;
    }

    return mountLetterboxSlackObserver(figure, (px) => {
      verticalLetterboxSlackPx = px;
    });
  });

  $effect(() => {
    if (diagramSvg === "") {
      homeMenuOpen = false;
      return;
    }

    return mountMenuSvgTriggerWire({
      getDiagramHost: () => diagramHostEl,
      getMenuPanel: () => homeMenuPanelEl,
      isMenuOpen: () => homeMenuOpen,
      setMenuOpen: (open) => {
        homeMenuOpen = open;
      },
      setMenuPanelStyle: (cssText) => {
        homeMenuPanelStyle = cssText;
      },
      scheduleAfterDomReady: (fn) => {
        void tick().then(fn);
      },
    });
  });

  /**
   * When install / PWA “App display” sections grow, the menu height changes. Re-anchored from
   * the same geometry as the SVG trigger; avoids stale layout on long portrait viewports.
   */
  $effect(() => {
    if (!homeMenuOpen || diagramSvg === "") return;
    void homeContactOpen;
    void homeInstallInfoOpen;
    void pwaDisplaySectionOpen;
    void tick().then(() => {
      const host = diagramHostEl;
      if (host == null) return;
      const trigger = queryMenuTriggerGroup(host);
      if (trigger == null) return;
      homeMenuPanelStyle = computeMenuPanelAnchorStyle(host, trigger);
    });
  });

  // Event handlers & imperative helpers (onMount, $effect, template)
  function readDiagramPreviewIdFromLocation(): DiagramPreviewId | null {
    if (!import.meta.env.DEV) return null;
    if (typeof window === "undefined") return null;
    const search = effectiveSearchFromLocation(
      window.location.search,
      window.location.hash,
    );
    return diagramPreviewIdFromSearch(search);
  }

  function refreshDomSummary(): void {
    if (!domDumpEnabled) return;
    const host =
      diagramHostEl ??
      (document.querySelector(
        "main.home-route figure.home-instrument",
      ) as HTMLElement | null);
    const figure = document.querySelector(
      "main.home-route figure.home-instrument",
    ) as HTMLElement | null;
    const svg =
      (host?.querySelector("svg") as SVGSVGElement | null) ??
      (document.querySelector("main.home-route svg") as SVGSVGElement | null);
    const panel = document.querySelector(
      "main.home-route .home-panel",
    ) as HTMLElement | null;

    const svgRect = svg?.getBoundingClientRect();
    const figureRect = figure?.getBoundingClientRect();
    const panelRect = panel?.getBoundingClientRect();

    domSummary = JSON.stringify(
      {
        diagramSvgLen: diagramSvg.length,
        tideExtremesCount: tideExtremes?.extremes.length ?? 0,
        svgExists: svg != null,
        svg: svg
          ? {
              rect: svgRect
                ? {
                    w: svgRect.width,
                    h: svgRect.height,
                    x: svgRect.x,
                    y: svgRect.y,
                  }
                : null,
              client: { w: svg.clientWidth, h: svg.clientHeight },
              transform: svg.style.transform ?? "",
              transformOrigin: svg.style.transformOrigin ?? "",
              viewBox: svg.getAttribute("viewBox") ?? null,
              ariaHidden: svg.getAttribute("aria-hidden"),
            }
          : null,
        figure: figureRect
          ? {
              w: figureRect.width,
              h: figureRect.height,
              x: figureRect.x,
              y: figureRect.y,
            }
          : null,
        panel: panelRect ? { w: panelRect.width, h: panelRect.height } : null,
      },
      null,
      2,
    );
  }

  function closeHomeMenu(): void {
    homeMenuOpen = false;
    homeContactOpen = false;
    homeInstallInfoOpen = false;
    pwaDisplaySectionOpen = false;
  }

  function dismissPwaStandaloneSetupThisSession(): void {
    writeStandaloneSetupDismissedThisSession();
    pwaSetupOverlayOpen = false;
  }

  function dismissPwaStandaloneSetupForever(): void {
    try {
      if (typeof localStorage !== "undefined") {
        writeStandaloneSetupHiddenForever(localStorage);
      }
    } catch {
      // ignore
    }
    pwaSetupOverlayOpen = false;
  }

  async function handleHomeFullscreenToggle(): Promise<void> {
    const host = getDiagramFullscreenTarget(diagramHostEl);
    if (host == null) return;
    await toggleInstrumentFullscreen(host);
    homeMenuOpen = false;
  }

  function handleHomeInstallEntry(): void {
    homeInstallInfoOpen = !homeInstallInfoOpen;
  }

  function handleHomeContactEntry(): void {
    homeContactOpen = !homeContactOpen;
  }
</script>

<main class="home-route" bind:this={homeRouteEl}>
  {#if pwaSetupOverlayOpen}
    <div class="home-route__pwa-setup">
      <HomePwaStandaloneSetupOverlay
        devPreviewInTab={pwaDevPreviewInTab}
        apiSupported={isWakeLockApiSupported()}
        isHomeRoute={true}
        userWants={pwaUserWants}
        homePresentation={pwaTideViewPresentation}
        showBatteryBlurb={pwaShowBatteryBlurb}
        toggleEnabled={isWakeLockApiSupported()}
        onToggleKeepAwake={setKeepAwakeUserEnabled}
        onDismissThisSession={dismissPwaStandaloneSetupThisSession}
        onDismissForever={dismissPwaStandaloneSetupForever}
      />
    </div>
  {/if}
  <HomeRouteDevPreviewBanners
    diagramPreviewBannerLine={diagramPreviewBannerLine}
    tidePreviewBannerLine={tidePreviewBannerLine}
  />
  {#if domDumpEnabled}
    <HomeRouteDomDebugPanel
      domSummary={domSummary}
      onRefreshDomSummary={refreshDomSummary}
    />
  {/if}
  <HomeRouteTidePanels
    bind:diagramHostEl
    bind:homeInstrumentEl
    bind:homeMenuPanelEl
    {tideLoadState}
    {tideExtremes}
    {diagramError}
    {diagramSvg}
    {showLandscapeHint}
    {verticalLetterboxSlackPx}
    showDefaultLocationExplainer={defaultLocationExplainerVisible}
    defaultLocationExplainerPlaceLine={defaultLocationExplainerPlaceLine}
    onDismissDefaultLocationExplainer={onDismissDefaultLocationExplainer}
    {homeMenuOpen}
    {homeMenuPanelStyle}
    {homeFullscreenActive}
    {homeContactOpen}
    {homeInstallInfoOpen}
    {homeInstallManualSteps}
    onCloseHomeMenu={closeHomeMenu}
    onToggleHomeFullscreen={handleHomeFullscreenToggle}
    onToggleHomeContact={handleHomeContactEntry}
    onOpenInstallMenu={handleHomeInstallEntry}
    pwa={pwaForHomeMenu}
  />
</main>

<style>
  /*
   * Layout-neutral host stack:
   * - `.home-route` remains the fit container.
   * - Intermediate wrappers do not add spacing.
   * - Any visible slack comes only from aspect-ratio fitting in SVG.
   */
  .home-route {
    position: relative;
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

  .home-route__pwa-setup {
    /* Fixed: avoids clipping in nested flex/overflow; stays above the diagram (see menu z-index). */
    position: fixed;
    z-index: 40;
    left: 50%;
    bottom: max(0.75rem, env(safe-area-inset-bottom, 0.75rem));
    transform: translateX(-50%);
    max-width: min(22rem, calc(100% - 1.25rem));
    pointer-events: auto;
  }

</style>
