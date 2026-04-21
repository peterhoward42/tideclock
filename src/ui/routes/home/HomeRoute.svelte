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
    localTimeNowDatePrefixFromMs,
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
  import {
    patchTimeNowReadoutInDiagramHost,
    scheduleDiagramHostSvgDevPresentation,
  } from "./homeRouteDiagramDom";
  import { mountInstrumentVerticalLetterboxSlackObserver } from "./homeRouteInstrumentLetterboxObserver";
  import { mountHomeMenuSvgTriggerWire } from "./homeRouteMenuSvgTriggerWire";
  import type { HomeRouteProps } from "./homeRouteProps";
  import { shouldShowHomeLandscapeHint } from "../../homeLandscapeHint";
  import {
    effectiveSearchStringFromLocationParts,
    homeRouteDevDebugFlagsFromSearch,
  } from "../../homeRouteUrlQuery";
  import { mountHomeRouteOrientationLock } from "./homeRouteOrientationLock";
  import { mountHomeRouteScreenWakeLock } from "./homeRouteScreenWakeLock";

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
  /** Container for injected SVG; patches TimeNowDate and TimeNowClock text without regenerating the scene. */
  let diagramHostEl = $state<HTMLElement | undefined>(undefined);
  let homeRouteEl = $state<HTMLElement | undefined>(undefined);
  let homeInstrumentEl = $state<HTMLElement | undefined>(undefined);
  let homeMenuPanelEl = $state<HTMLElement | undefined>(undefined);
  let homeMenuOpen = $state(false);
  let homeMenuPanelStyle = $state("left: 0px; bottom: 0px;");

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

  // Subscriptions and lifecycle (onMount)
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

  onMount(() => mountHomeRouteScreenWakeLock());

  onMount(() => {
    const routeRoot = homeRouteEl;
    if (routeRoot == null) return;
    return mountHomeRouteOrientationLock(routeRoot);
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
      const timeNowDatePrefix = localTimeNowDatePrefixFromMs(nowMsValue);
      const baseSpec = buildDiagramGenerationSpec({
        extremesAtLocation: extremesForSpec,
        timeNow,
        timeNowDatePrefix,
        utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeLocal,
        townName,
      });
      const derived = deriveNextTideSemantics(baseSpec);
      const spec = buildDiagramGenerationSpec({
        extremesAtLocation: extremesForSpec,
        timeNow,
        timeNowDatePrefix,
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
        patchTimeNowReadoutInDiagramHost(host, frozenClockMs ?? ms);
    });

    void tick().then(() => {
      if (!cancelled)
        patchTimeNowReadoutInDiagramHost(host, frozenClockMs ?? Date.now());
    });

    return () => {
      cancelled = true;
      unsub();
    };
  });

  $effect(() => {
    if (diagramSvg === "") {
      homeMenuOpen = false;
      return;
    }

    return mountHomeMenuSvgTriggerWire({
      getDiagramHost: () => diagramHostEl,
      getInstrumentFigure: () => homeInstrumentEl,
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
  }
</script>

<main class="home-route" bind:this={homeRouteEl}>
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
    onCloseHomeMenu={closeHomeMenu}
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
    width: 100%;
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
  }

</style>
