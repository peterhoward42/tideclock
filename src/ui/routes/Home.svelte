<script lang="ts">
  /**
   * Home route — civil-day tide diagram: props and stores in, diagram SVG and chrome out.
   * Skim order below: inputs → collaborator → state → derived readouts → effects → handlers.
   * Minute cadence drives full regen; sub-second cadence only patches the live clock inside SVG.
   * Does not own proxy fetch (receives extremes from the shell).
   */
  import { get } from "svelte/store";
  import { onMount, tick } from "svelte";

  import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
  import { nowMs } from "../../application/appClock.js";
  import {
    buildDiagramGenerationSpec,
    utcIsoToLocalCanonicalTimeLocal,
  } from "../../application/buildDiagramGenerationSpec";
  import {
    diagramDevPreviewIdFromSearch,
    type DiagramDevPreviewId,
  } from "../../application/diagram-dev-preview/diagramDevPreviewCatalog";
  import {
    formatDiagramDevPreviewBannerLine,
    homeDiagramDevPreviewIsFrozen,
    resolveHomeDiagramDevPreview,
  } from "../../application/diagram-dev-preview/diagramDevPreviewResolveForHome";
  import {
    localCanonicalTimeNowFromMs,
    localTimeNowDatePrefixFromMs,
  } from "../../application/localWallClockReadoutFromMs";
  import {
    createDiagramGenerationCollaborator,
    renderSceneSvg,
    type DiagramGenerationCollaborator,
  } from "../../application/diagramGenerationCollaborator";
  import { deriveNextTideSemantics } from "../../application/nextTideSemantics";
  import { subscribeSemanticMinuteCadence } from "../../application/semanticMinuteCadence";
  import { displayOptimisation } from "../displayOptimisation";
  import HomeRouteDevPreviewBanners from "./home/HomeRouteDevPreviewBanners.svelte";
  import HomeRouteDomDebugPanel from "./home/HomeRouteDomDebugPanel.svelte";
  import HomeRouteTidePanels from "./home/HomeRouteTidePanels.svelte";
  import {
    shouldShowHomeLandscapeHint,
    verticalLetterboxSlackMidMeetPx,
  } from "../homeLandscapeHint";
  import {
    effectiveSearchStringFromLocationParts,
    homeRouteDevDebugFlagsFromSearch,
  } from "../homeRouteUrlQuery";

  // Route inputs — `$props` contract
  type TidePredictionsLoadState = {
    readonly status: "loading" | "ready" | "error";
  };

  interface Props {
    readonly tideLoadState: TidePredictionsLoadState;
    readonly tideExtremes: TideExtremesAtLocation | undefined;
    readonly townName: string;
    /** Dev-only copy from shell when `?tideUxPreview=` is active; null in production or when idle. */
    readonly tideUxDevPreviewBannerLine: string | null;
  }

  let { tideLoadState, tideExtremes, townName, tideUxDevPreviewBannerLine }: Props =
    $props();

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
    queueMicrotask(() => {
      requestAnimationFrame(() => {
        const host = diagramHostEl;
        if (host == null) return;
        const svg = host.querySelector("svg") as SVGSVGElement | null;
        if (svg == null) return;

        svg.style.transformOrigin = "50% 50%";
        svg.style.transform = "scale(1)";

        if (outlineEnabled) {
          svg.style.outline = "2px solid rgba(255,0,0,0.6)";
          svg.style.background = "rgba(255,0,0,0.06)";
        } else {
          svg.style.outline = "";
          svg.style.background = "";
        }

        refreshDomSummary();
      });
    });
  });

  $effect(() => {
    const figure = homeInstrumentEl;
    if (figure == null || diagramSvg === "") {
      verticalLetterboxSlackPx = 0;
      return;
    }

    const measure = (): void => {
      const el = homeInstrumentEl;
      if (el == null) return;
      const svg = el.querySelector("svg") as SVGSVGElement | null;
      const vb = svg?.viewBox?.baseVal;
      if (svg == null || vb == null) {
        verticalLetterboxSlackPx = 0;
        return;
      }
      verticalLetterboxSlackPx = verticalLetterboxSlackMidMeetPx(
        el.clientWidth,
        el.clientHeight,
        vb.width,
        vb.height,
      );
    };

    const ro = new ResizeObserver(() => {
      queueMicrotask(measure);
    });
    ro.observe(figure);
    queueMicrotask(measure);

    return () => {
      ro.disconnect();
    };
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
      if (!cancelled) patchTimeNowReadout(host, frozenClockMs ?? ms);
    });

    void tick().then(() => {
      if (!cancelled)
        patchTimeNowReadout(host, frozenClockMs ?? Date.now());
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

    let cancelled = false;
    let rafId = 0;
    let wiredTrigger: SVGGElement | null = null;

    const detach = (): void => {
      if (wiredTrigger == null) return;
      const trigger = wiredTrigger;
      trigger.classList.remove("home-menu-trigger--hover");
      trigger.style.cursor = "";
      trigger.removeEventListener("pointerenter", onEnter);
      trigger.removeEventListener("pointerleave", onLeave);
      trigger.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      document.removeEventListener("pointerdown", onPointerDown);
      wiredTrigger = null;
    };

    const onEnter = (): void => {
      wiredTrigger?.classList.add("home-menu-trigger--hover");
    };
    const onLeave = (): void => {
      wiredTrigger?.classList.remove("home-menu-trigger--hover");
    };
    const onClick = (event: Event): void => {
      event.preventDefault();
      event.stopPropagation();
      updateHomeMenuPanelAnchorFromSvgTrigger();
      homeMenuOpen = !homeMenuOpen;
    };
    const onResize = (): void => {
      if (!homeMenuOpen) return;
      updateHomeMenuPanelAnchorFromSvgTrigger();
    };
    const onPointerDown = (event: Event): void => {
      if (!homeMenuOpen) return;
      const target = event.target;
      if (!(target instanceof Node)) return;
      if (homeMenuPanelEl?.contains(target)) return;
      const trigger = wiredTrigger;
      if (trigger !== null && trigger.contains(target)) return;
      closeHomeMenu();
    };

    const MAX_ATTACH_FRAMES = 45;
    let frames = 0;

    const tryWireTrigger = (): void => {
      if (cancelled) return;
      const trigger = homeMenuTriggerGroup();
      if (trigger == null) {
        frames += 1;
        if (frames < MAX_ATTACH_FRAMES) {
          rafId = requestAnimationFrame(tryWireTrigger);
        }
        return;
      }
      detach();
      wiredTrigger = trigger;
      trigger.style.cursor = "pointer";
      trigger.addEventListener("pointerenter", onEnter);
      trigger.addEventListener("pointerleave", onLeave);
      trigger.addEventListener("click", onClick);
      window.addEventListener("resize", onResize);
      document.addEventListener("pointerdown", onPointerDown);
    };

    void tick().then(() => {
      if (cancelled) return;
      frames = 0;
      rafId = requestAnimationFrame(tryWireTrigger);
    });

    return () => {
      cancelled = true;
      cancelAnimationFrame(rafId);
      detach();
    };
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

  function homeMenuTriggerGroup(): SVGGElement | null {
    const host = diagramHostEl;
    if (host == null) return null;
    return host.querySelector('svg g[data-name="HomeMenuTrigger"]');
  }

  function updateHomeMenuPanelAnchorFromSvgTrigger(): void {
    const figure = homeInstrumentEl;
    const trigger = homeMenuTriggerGroup();
    if (figure == null || trigger == null) return;
    const figureRect = figure.getBoundingClientRect();
    const triggerRect = trigger.getBoundingClientRect();
    const left = Math.max(0, triggerRect.left - figureRect.left);
    const bottom = Math.max(0, figureRect.bottom - triggerRect.top + 8);
    homeMenuPanelStyle = `left: ${left}px; bottom: ${bottom}px;`;
  }

  function closeHomeMenu(): void {
    homeMenuOpen = false;
  }

  /** Patch live clock text inside injected SVG; host must contain the current diagram. */
  function patchTimeNowReadout(host: HTMLElement, ms: number): void {
    const canonical = localCanonicalTimeNowFromMs(ms);
    const datePrefix = localTimeNowDatePrefixFromMs(ms);
    const dateEl = host.querySelector(
      'svg g[data-name="TimeNowDate"] text',
    ) as SVGTextElement | null;
    const hhmmEl = host.querySelector(
      'svg g[data-name="TimeNowLabelHms"] text',
    ) as SVGTextElement | null;
    const colonEl = host.querySelector(
      'svg g[data-name="TimeNowLabelSecondsColon"] text',
    ) as SVGTextElement | null;
    const secEl = host.querySelector(
      'svg g[data-name="TimeNowLabelSeconds"] text',
    ) as SVGTextElement | null;
    if (dateEl !== null) dateEl.textContent = datePrefix;
    if (hhmmEl !== null) hhmmEl.textContent = canonical.slice(0, 5);
    if (colonEl !== null) colonEl.textContent = canonical.slice(5, 6);
    if (secEl !== null) secEl.textContent = canonical.slice(6);
  }
</script>

<main class="home-route">
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
