<script lang="ts">
  /**
   * Home route orchestration — civil-day tide diagram: props and stores in, diagram SVG and chrome out.
   * Skim order below: inputs → collaborator → state → derived readouts → effects → handlers.
   * Minute cadence drives full regen; sub-second cadence only patches the live clock inside SVG.
   * Does not own proxy fetch (receives extremes from the shell).
   */
  import { get } from "svelte/store";
  import { onMount, tick } from "svelte";

  import { nowMs } from "../../../application/appClock.js";
  import {
    buildDiagramGenerationSpec,
    utcIsoToLocalCanonicalTimeLocal,
  } from "../../../application/buildDiagramGenerationSpec";
  import {
    diagramDevPreviewIdFromSearch,
    type DiagramDevPreviewId,
  } from "../../../application/diagram-dev-preview/diagramDevPreviewCatalog";
  import {
    formatDiagramDevPreviewBannerLine,
    homeDiagramDevPreviewIsFrozen,
    resolveHomeDiagramDevPreview,
  } from "../../../application/diagram-dev-preview/diagramDevPreviewResolveForHome";
  import {
    localCanonicalTimeNowFromMs,
    localBlhcDatePrefixFromMs,
  } from "../../../application/localWallClockReadoutFromMs";
  import {
    createDiagramGenerationCollaborator,
    renderSceneSvg,
    type DiagramGenerationCollaborator,
  } from "../../../application/diagramGenerationCollaborator";
  import { deriveNextTideSemantics } from "../../../application/nextTideSemantics";
  import { subscribeSemanticMinuteCadence } from "../../../application/semanticMinuteCadence";
  import { displayOptimisation } from "../../displayOptimisation";
  import HomeRouteDevPreviewBanners from "./HomeRouteDevPreviewBanners.svelte";
  import HomeRouteDomDebugPanel from "./HomeRouteDomDebugPanel.svelte";
  import HomeRouteTidePanels from "./HomeRouteTidePanels.svelte";
  import HomePwaStandaloneSetupOverlay from "./HomePwaStandaloneSetupOverlay.svelte";
  import {
    computeHomeMenuPanelAnchorStyle,
    patchBlhcBundleInDiagramHost,
    queryHomeMenuTriggerGroupFromDiagramHost,
    scheduleDiagramHostSvgDevPresentation,
  } from "./homeRouteDiagramDom";
  import { mountInstrumentVerticalLetterboxSlackObserver } from "./homeRouteInstrumentLetterboxObserver";
  import { mountHomeMenuSvgTriggerWire } from "./homeRouteMenuSvgTriggerWire";
  import type { HomeRouteProps } from "./homeRouteProps";
  import { shouldShowHomeLandscapeHint } from "../../homeLandscapeHint";
  import {
    effectiveSearchStringFromLocationParts,
    homeRouteDevDebugFlagsFromSearch,
    pwaSetupDevPreviewWantedFromSearch,
    pwaSetupDevResetWantedFromSearch,
  } from "../../homeRouteUrlQuery";
  import { mountHomeRouteOrientationLock } from "./homeRouteOrientationLock";
  import { mountHomeRouteScreenWakeLock } from "./homeRouteScreenWakeLock";
  import {
    getKeepScreenAwakeUserEnabled,
    isWakeLockApiSupportedRuntime,
    keepScreenAwakeUserEnabledStore,
    setKeepScreenAwakeUserEnabled,
    setTideViewWakePresentation,
    tideViewWakePresentationStore,
  } from "./homeRoutePwaUi";
  import {
    clearStandaloneSetupHiddenForeverIn,
    clearStandaloneSetupSessionDismissal,
    readStandaloneSetupDismissedThisSession,
    readStandaloneSetupHiddenForever,
    writeStandaloneSetupDismissedThisSession,
    writeStandaloneSetupHiddenForever,
  } from "./homeRoutePwaPreferences";
  import { isStandaloneDisplayMode } from "./pwaDisplayMode";
  import {
    getHomeRouteDiagramFullscreenTarget,
    toggleInstrumentFullscreen,
  } from "./homeRouteFullscreen";
  import {
    homeInstallObserver,
    HOME_INSTALL_BENEFIT_LINES,
    manualInstallStepsForPlatform,
    promptForInstall,
  } from "./homeRouteInstallFlow";

  let {
    tideLoadState,
    tideExtremes,
    townName,
    tideUxDevPreviewBannerLine,
  }: HomeRouteProps = $props();

  // Diagram generation collaborator (generate + render entry; owns no DOM)
  const collaborator: DiagramGenerationCollaborator =
    createDiagramGenerationCollaborator();

  // Mutable route state ($state)
  /** Drives Loop B: bumps only on local minute rollover (aligned scheduler), not every second. */
  let semanticMinuteEpoch = $state(Math.floor(Date.now() / 60_000));

  /** Dev-only: `?diagramPreview=<id>` (see docs/planning/diagram-dev-preview-catalog.md). */
  let diagramPreviewIdFromUrl = $state<DiagramDevPreviewId | null>(null);

  let diagramSvg = $state("");
  let diagramError = $state<string | undefined>(undefined);
  /** Container for injected SVG; patches **BLHCBundle** + hand clock (**Hand.TimeReadout** / **Hand.TimeReadoutSeconds**) on ~1 Hz without full scene regen. */
  let diagramHostEl = $state<HTMLElement | undefined>(undefined);
  let homeRouteEl = $state<HTMLElement | undefined>(undefined);
  let homeInstrumentEl = $state<HTMLElement | undefined>(undefined);
  let homeMenuPanelEl = $state<HTMLElement | undefined>(undefined);
  let homeMenuOpen = $state(false);
  let homeMenuPanelStyle = $state("right: 0px; bottom: 0px;");
  let homeFullscreenActive = $state(false);
  let homeInstallInfoOpen = $state(false);
  let homeInstallObserverSnapshot = $state(get(homeInstallObserver));
  let homeInstallLastSeenAppInstalledCount = $state(0);
  let homeInstallStatusLine = $state<string | null>(null);

  let pwaUserWants = $state(get(keepScreenAwakeUserEnabledStore));
  let pwaTideViewPresentation = $state(get(tideViewWakePresentationStore));
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

  const homeDiagramDevPreview = $derived.by(() =>
    resolveHomeDiagramDevPreview({
      dev: import.meta.env.DEV,
      previewId: diagramPreviewIdFromUrl,
      tideExtremes,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
    }),
  );

  const diagramPreviewLive = $derived(
    homeDiagramDevPreviewIsFrozen(homeDiagramDevPreview),
  );

  const diagramPreviewBannerLine = $derived(
    formatDiagramDevPreviewBannerLine(homeDiagramDevPreview),
  );

  const homeInstallBenefitLines = $derived(HOME_INSTALL_BENEFIT_LINES);
  const homeInstallManualSteps = $derived(
    manualInstallStepsForPlatform(homeInstallObserverSnapshot.platform),
  );
  const homeInstallCanPrompt = $derived(
    homeInstallObserverSnapshot.promptEvent != null,
  );

  const pwaForHomeMenu = $derived({
    sectionOpen: pwaDisplaySectionOpen,
    apiSupported: isWakeLockApiSupportedRuntime(),
    isHomeRoute: true,
    userWants: pwaUserWants,
    homePresentation: pwaTideViewPresentation,
    showBatteryBlurb: pwaShowBatteryBlurb,
    onToggleSection: () => {
      pwaDisplaySectionOpen = !pwaDisplaySectionOpen;
    },
    onToggle: (next: boolean) => {
      setKeepScreenAwakeUserEnabled(next);
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
    return homeInstallObserver.subscribe(
      (snapshot) => (homeInstallObserverSnapshot = snapshot),
    );
  });

  onMount(() => {
    if (!import.meta.env.DEV) return;
    try {
      const debugFlags = homeRouteDevDebugFlagsFromSearch(
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
    subscribeSemanticMinuteCadence(
      (epoch) => {
        semanticMinuteEpoch = epoch;
      },
      { fireImmediately: false },
    ),
  );

  onMount(() => displayOptimisation.subscribe((v) => (displaySnapshot = v)));

  onMount(() =>
    keepScreenAwakeUserEnabledStore.subscribe((v) => (pwaUserWants = v)),
  );

  onMount(() =>
    tideViewWakePresentationStore.subscribe(
      (v) => (pwaTideViewPresentation = v),
    ),
  );

  onMount(() => {
    const wake = mountHomeRouteScreenWakeLock({
      shouldRequestLock: getKeepScreenAwakeUserEnabled,
      onPresentationChange: (p) => {
        setTideViewWakePresentation(p);
      },
    });
    const unsubKeep = keepScreenAwakeUserEnabledStore.subscribe(() => {
      wake.sync();
    });
    return () => {
      unsubKeep();
      wake.dispose();
      setTideViewWakePresentation(null);
    };
  });

  onMount(() => {
    if (typeof window === "undefined") return;
    const search = effectiveSearchStringFromLocationParts(
      window.location.search,
      window.location.hash,
    );
    isStandalonePwa = isStandaloneDisplayMode();

    if (import.meta.env.DEV) {
      if (pwaSetupDevResetWantedFromSearch(search)) {
        clearStandaloneSetupSessionDismissal();
        if (typeof localStorage !== "undefined") {
          clearStandaloneSetupHiddenForeverIn(localStorage);
        }
      }
      if (pwaSetupDevPreviewWantedFromSearch(search)) {
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
    return mountHomeRouteOrientationLock(routeRoot);
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

  // Reactive effects ($effect) — diagram regen, SVG glue, measurement, clock patch, menu wiring
  $effect(() => {
    if (!diagramPreviewLive) {
      void semanticMinuteEpoch;
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
      const preview = homeDiagramDevPreview;
      const extremesForSpec =
        preview.state === "frozen" ? preview.extremesAtLocation : extremes;
      const nowMsValue =
        preview.state === "frozen" ? preview.frozenEpochMs : Date.now();
      const timeNow = localCanonicalTimeNowFromMs(nowMsValue);
      const blhcDatePrefix = localBlhcDatePrefixFromMs(nowMsValue);
      const baseSpec = buildDiagramGenerationSpec({
        extremesAtLocation: extremesForSpec,
        timeNow,
        blhcDatePrefix,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
        townName,
      });
      const derived = deriveNextTideSemantics(baseSpec);
      const spec = buildDiagramGenerationSpec({
        extremesAtLocation: extremesForSpec,
        timeNow,
        blhcDatePrefix,
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
    scheduleDiagramHostSvgDevPresentation(diagramHostEl, {
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

    return mountInstrumentVerticalLetterboxSlackObserver(figure, (px) => {
      verticalLetterboxSlackPx = px;
    });
  });

  $effect(() => {
    const host = diagramHostEl;
    const svg = diagramSvg;
    if (host == null || svg === "") return;

    const frozenClockMs =
      homeDiagramDevPreview.state === "frozen"
        ? homeDiagramDevPreview.frozenEpochMs
        : null;

    let cancelled = false;
    const unsub = nowMs.subscribe((ms) => {
      if (!cancelled)
        patchBlhcBundleInDiagramHost(host, frozenClockMs ?? ms);
    });

    void tick().then(() => {
      if (!cancelled)
        patchBlhcBundleInDiagramHost(host, frozenClockMs ?? Date.now());
    });

    return () => {
      cancelled = true;
      unsub();
    };
  });

  $effect(() => {
    const installedCount = homeInstallObserverSnapshot.appInstalledCount;
    if (installedCount <= homeInstallLastSeenAppInstalledCount) return;
    homeInstallLastSeenAppInstalledCount = installedCount;
    homeInstallStatusLine = "App installed.";
  });

  $effect(() => {
    if (diagramSvg === "") {
      homeMenuOpen = false;
      return;
    }

    return mountHomeMenuSvgTriggerWire({
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
    void homeInstallInfoOpen;
    void pwaDisplaySectionOpen;
    void tick().then(() => {
      const host = diagramHostEl;
      if (host == null) return;
      const trigger = queryHomeMenuTriggerGroupFromDiagramHost(host);
      if (trigger == null) return;
      homeMenuPanelStyle = computeHomeMenuPanelAnchorStyle(host, trigger);
    });
  });

  // Event handlers & imperative helpers (onMount, $effect, template)
  function readDiagramPreviewIdFromLocation(): DiagramDevPreviewId | null {
    if (!import.meta.env.DEV) return null;
    if (typeof window === "undefined") return null;
    const search = effectiveSearchStringFromLocationParts(
      window.location.search,
      window.location.hash,
    );
    return diagramDevPreviewIdFromSearch(search);
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
    homeInstallInfoOpen = false;
    pwaDisplaySectionOpen = false;
    homeInstallStatusLine = null;
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
    const host = getHomeRouteDiagramFullscreenTarget(diagramHostEl);
    if (host == null) return;
    await toggleInstrumentFullscreen(host);
    homeMenuOpen = false;
  }

  function handleHomeInstallEntry(): void {
    homeInstallInfoOpen = !homeInstallInfoOpen;
    homeInstallStatusLine = null;
  }

  async function handleInstallPromptAction(): Promise<void> {
    const promptEvent = homeInstallObserverSnapshot.promptEvent;
    if (promptEvent == null) return;
    const outcome = await promptForInstall(promptEvent);
    homeInstallObserver.clearPromptEvent();
    if (outcome === "accepted") {
      homeInstallStatusLine = "Install request accepted.";
      return;
    }
    if (outcome === "dismissed") {
      homeInstallStatusLine = "Install dismissed. You can try again from this menu.";
      return;
    }
    homeInstallStatusLine = "Install dialog closed.";
  }
</script>

<main class="home-route" bind:this={homeRouteEl}>
  {#if pwaSetupOverlayOpen}
    <div class="home-route__pwa-setup">
      <HomePwaStandaloneSetupOverlay
        devPreviewInTab={pwaDevPreviewInTab}
        apiSupported={isWakeLockApiSupportedRuntime()}
        isHomeRoute={true}
        userWants={pwaUserWants}
        homePresentation={pwaTideViewPresentation}
        showBatteryBlurb={pwaShowBatteryBlurb}
        toggleEnabled={isWakeLockApiSupportedRuntime()}
        onToggleKeepAwake={setKeepScreenAwakeUserEnabled}
        onDismissThisSession={dismissPwaStandaloneSetupThisSession}
        onDismissForever={dismissPwaStandaloneSetupForever}
      />
    </div>
  {/if}
  <HomeRouteDevPreviewBanners
    diagramPreviewBannerLine={diagramPreviewBannerLine}
    tideUxDevPreviewBannerLine={tideUxDevPreviewBannerLine}
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
    {homeMenuOpen}
    {homeMenuPanelStyle}
    {homeFullscreenActive}
    {homeInstallInfoOpen}
    {homeInstallCanPrompt}
    {homeInstallBenefitLines}
    {homeInstallManualSteps}
    {homeInstallStatusLine}
    onCloseHomeMenu={closeHomeMenu}
    onToggleHomeFullscreen={handleHomeFullscreenToggle}
    onOpenInstallMenu={handleHomeInstallEntry}
    onPromptInstall={handleInstallPromptAction}
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
