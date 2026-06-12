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
    buildDiagramSpecWithDerivedNextTide,
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
  import { subscribeMinuteCadence } from "../../../time-services/minuteCadence";
  import { displayOptimisation } from "../../displayOptimisation";
  import HomeRouteDevPreviewBanners from "./HomeRouteDevPreviewBanners.svelte";
  import HomeRouteDomDebugPanel from "./HomeRouteDomDebugPanel.svelte";
  import HomeRouteTidePanels from "./HomeRouteTidePanels.svelte";
  import {
    computeMenuPanelAnchorStyle,
    queryMenuTriggerGroup,
    scheduleDiagramDevPresentation,
  } from "./diagramDom";
  import { mountLetterboxSlackObserver } from "./instrumentLetterboxObserver";
  import { mountMenuSvgTriggerWire } from "./menuSvgTriggerWire";
  import { mountShareSvgTriggerWire } from "./shareSvgTriggerWire";
  import { mountLocationSvgTriggerWire } from "./locationSvgTriggerWire";
  import { copyTextToClipboard } from "../../copyEmail";
  import { buildShareUrlForTown } from "../../homeUrlQuery";
  import type { RouteProps } from "./routeProps";
  import {
    onboardingDeferDefaultLocationExplainerToLandscape,
    shouldShowHomeLandscapeHint,
  } from "../../homeLandscapeHint";
  import {
    effectiveSearchFromLocation,
    homeDevDebugFlagsFromSearch,
  } from "../../homeUrlQuery";
  import { mountScreenWakeLock } from "./screenWakeLock";
  import {
    getKeepAwakeUserEnabled,
    keepAwakeUserStore,
    setKeepAwakeUserEnabled,
    setTideWakePresentation,
    tideWakePresentationStore,
  } from "./keepAwakeUi";
  import { isWakeLockApiSupported } from "./wakeLockSupport";
  import {
    elementSupportsFullscreenRequest,
    getDiagramFullscreenTarget,
    toggleInstrumentFullscreen,
  } from "./fullscreen";
  import {
    detectFullscreenBrowserAdvice,
    formatFullscreenBrowserAdviceMessage,
  } from "./fullscreenBrowserAdvice";
  import {
    trackProductError,
    trackProductEvent,
  } from "../../../infrastructure/analytics/trackProductEvent";

  let {
    tidePresentation,
    tideExtremes,
    currentTown,
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

  /** Dev-only: `?diagramPreview=<id>` (see README “Developer previews”). */
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
  let homeFullscreenAdviceOpen = $state(false);
  let homeFullscreenAdviceLead = $state("");
  let homeFullscreenAdviceBody = $state("");
  let homeNerdsOpen = $state(false);
  let homeContactOpen = $state(false);
  let homeShareLinkCopiedOpen = $state(false);
  let homeShareLinkCopiedUrl = $state("");
  let keepAwakeUserWants = $state(get(keepAwakeUserStore));
  let keepAwakeTideViewPresentation = $state(get(tideWakePresentationStore));
  let keepAwakeSectionOpen = $state(false);
  /** Snapshot from {@link displayOptimisation}; sole source for hint device/aspect policy. */
  let displaySnapshot = $state(get(displayOptimisation));
  /** Vertical letterbox slack (px) for `xMidYMid meet` fit of the diagram SVG inside the instrument. */
  let verticalLetterboxSlackPx = $state(0);
  let diagramErrorTelemetrySent = $state(false);

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

  /**
   * Wait for tides + diagram paint before showing the caption so “showing tides for …”
   * is not ahead of the async fetch / SVG generation. Portrait touch phone/tablet: defer until
   * landscape so only the rotation encouragement shows.
   */
  const defaultLocationExplainerVisible = $derived.by(() => {
    if (!defaultLocationExplainerOpen) return false;
    if (onboardingDeferDefaultLocationExplainerToLandscape(displaySnapshot)) {
      return false;
    }
    if (tidePresentation.kind !== "ready" || tideExtremes === undefined) {
      return false;
    }
    if (diagramError !== undefined) return false;
    if (tideExtremes.extremes.length === 0) {
      return true;
    }
    return diagramSvg !== "";
  });

  const shareTriggerEnabled = $derived(
    tidePresentation.kind === "ready" &&
      currentTown !== undefined &&
      !defaultLocationExplainerVisible,
  );

  const keepAwakeForHomeMenu = $derived({
    sectionOpen: keepAwakeSectionOpen,
    apiSupported: isWakeLockApiSupported(),
    isHomeRoute: true,
    userWants: keepAwakeUserWants,
    homePresentation: keepAwakeTideViewPresentation,
    onToggleSection: () => {
      keepAwakeSectionOpen = !keepAwakeSectionOpen;
    },
    onToggle: (next: boolean) => {
      setKeepAwakeUserEnabled(next);
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
    keepAwakeUserStore.subscribe((v) => (keepAwakeUserWants = v)),
  );

  onMount(() =>
    tideWakePresentationStore.subscribe(
      (v) => (keepAwakeTideViewPresentation = v),
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
    if (typeof document === "undefined") return;
    const runtimeDocument = document as Document & {
      webkitFullscreenElement?: Element | null;
    };
    const syncFullscreenState = (): void => {
      const active =
        runtimeDocument.fullscreenElement != null ||
        runtimeDocument.webkitFullscreenElement != null;
      homeFullscreenActive = active;
      if (!active) {
        homeFullscreenAdviceOpen = false;
      }
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
    const presentation = tidePresentation;

    if (
      presentation.kind !== "ready" ||
      extremes === undefined ||
      extremes.extremes.length === 0 ||
      currentTown === undefined
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
      const spec = buildDiagramSpecWithDerivedNextTide({
        extremesAtLocation: extremesForSpec,
        timeNow,
        brhcDatePrefix,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
        townName,
        shareUrl: buildShareUrlForTown(currentTown),
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
    if (diagramError === undefined) {
      diagramErrorTelemetrySent = false;
      return;
    }
    if (diagramErrorTelemetrySent) {
      return;
    }
    diagramErrorTelemetrySent = true;
    trackProductError("diagram_render_failed");
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
    if (!shareTriggerEnabled || diagramSvg === "") {
      return;
    }

    return mountShareSvgTriggerWire({
      getDiagramHost: () => diagramHostEl,
      onShareClick: handleShareLocationClick,
      scheduleAfterDomReady: (fn) => {
        void tick().then(fn);
      },
    });
  });

  $effect(() => {
    if (!shareTriggerEnabled || diagramSvg === "") {
      return;
    }

    return mountLocationSvgTriggerWire({
      getDiagramHost: () => diagramHostEl,
      onLocationClick: handleChangeLocationClick,
      scheduleAfterDomReady: (fn) => {
        void tick().then(fn);
      },
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
        if (open && !homeMenuOpen) {
          trackProductEvent("opened_menu");
        }
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
   * When Contact / keep-awake sections grow, the menu height changes. Re-anchored from
   * the same geometry as the SVG trigger; avoids stale layout on long portrait viewports.
   */
  $effect(() => {
    if (!homeMenuOpen || diagramSvg === "") return;
    void homeNerdsOpen;
    void homeContactOpen;
    void keepAwakeSectionOpen;
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
    homeNerdsOpen = false;
    homeContactOpen = false;
    keepAwakeSectionOpen = false;
  }

  function dismissHomeFullscreenAdvice(): void {
    homeFullscreenAdviceOpen = false;
  }

  async function handleHomeFullscreenToggle(): Promise<void> {
    const host = getDiagramFullscreenTarget(diagramHostEl);
    if (host == null) return;
    const entering = !homeFullscreenActive;
    await toggleInstrumentFullscreen(host);
    homeMenuOpen = false;

    if (!entering) {
      homeFullscreenAdviceOpen = false;
      return;
    }

    trackProductEvent("used_really_full");

    if (typeof navigator === "undefined") return;
    const advice = detectFullscreenBrowserAdvice(
      navigator.userAgent,
      navigator.maxTouchPoints,
      elementSupportsFullscreenRequest(host),
    );
    if (advice == null) return;

    await tick();
    const copy = formatFullscreenBrowserAdviceMessage(advice, homeFullscreenActive);
    homeFullscreenAdviceLead = copy.lead;
    homeFullscreenAdviceBody = copy.body;
    homeFullscreenAdviceOpen = true;
  }

  function handleHomeNerdsEntry(): void {
    const opening = !homeNerdsOpen;
    homeNerdsOpen = opening;
    if (opening) {
      trackProductEvent("expanded_for_nerds");
    }
  }

  function handleHomeContactEntry(): void {
    const opening = !homeContactOpen;
    homeContactOpen = opening;
    if (opening) {
      trackProductEvent("visited_contact");
    }
  }

  function dismissHomeShareLinkCopied(): void {
    homeShareLinkCopiedOpen = false;
  }

  async function handleChangeLocationClick(): Promise<void> {
    trackProductEvent("clicked_change_location_diagram");
    if (typeof window !== "undefined") {
      window.location.hash = "#/location";
    }
  }

  async function handleShareLocationClick(): Promise<void> {
    const town = currentTown;
    if (town === undefined) return;
    const shareUrl = buildShareUrlForTown(town);
    const ok = await copyTextToClipboard(shareUrl);
    if (!ok) return;
    trackProductEvent("copied_location_link", {
      label: `${town.name} - ${town.county}`,
    });
    homeShareLinkCopiedUrl = shareUrl;
    homeShareLinkCopiedOpen = true;
  }
</script>

<main class="home-route" bind:this={homeRouteEl}>
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
    {tidePresentation}
    {tideExtremes}
    {currentTown}
    {diagramError}
    {diagramSvg}
    {showLandscapeHint}
    {verticalLetterboxSlackPx}
    showDefaultLocationExplainer={defaultLocationExplainerVisible}
    shareTriggerEnabled={shareTriggerEnabled}
    defaultLocationExplainerPlaceLine={defaultLocationExplainerPlaceLine}
    onDismissDefaultLocationExplainer={onDismissDefaultLocationExplainer}
    {homeMenuOpen}
    {homeMenuPanelStyle}
    {homeFullscreenActive}
    homeFullscreenAdviceOpen={homeFullscreenAdviceOpen}
    homeFullscreenAdviceLead={homeFullscreenAdviceLead}
    homeFullscreenAdviceBody={homeFullscreenAdviceBody}
    onDismissHomeFullscreenAdvice={dismissHomeFullscreenAdvice}
    homeShareLinkCopiedOpen={homeShareLinkCopiedOpen}
    homeShareLinkCopiedUrl={homeShareLinkCopiedUrl}
    onDismissHomeShareLinkCopied={dismissHomeShareLinkCopied}
    {homeNerdsOpen}
    {homeContactOpen}
    onCloseHomeMenu={closeHomeMenu}
    onToggleHomeFullscreen={handleHomeFullscreenToggle}
    onToggleHomeNerds={handleHomeNerdsEntry}
    onToggleHomeContact={handleHomeContactEntry}
    keepAwake={keepAwakeForHomeMenu}
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
</style>
