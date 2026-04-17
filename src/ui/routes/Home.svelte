<script lang="ts">
  /**
   * Home.svelte — Civil-day tide diagram: builds specs, runs diagram-generation collaborator, swaps SVG.
   * Minute cadence for full regen; second cadence only for the live clock label. Kind: Presentation + orchestration.
   * Does not own proxy fetch (receives extremes from the shell).
   */
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
  import PrimaryNavLinks from "../components/PrimaryNavLinks.svelte";

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

  const collaborator: DiagramGenerationCollaborator =
    createDiagramGenerationCollaborator();

  /** Drives Loop B: bumps only on local minute rollover (aligned scheduler), not every second. */
  let semanticMinuteEpoch = $state(Math.floor(Date.now() / 60_000));

  /** Dev-only: `?diagramPreview=<id>` (see docs/planning/diagram-dev-preview-catalog.md). */
  let diagramPreviewIdFromUrl = $state<DiagramDevPreviewId | null>(null);

  function readDiagramPreviewIdFromLocation(): DiagramDevPreviewId | null {
    if (!import.meta.env.DEV) return null;
    if (typeof window === "undefined") return null;
    const search =
      window.location.search ||
      (window.location.hash.includes("?")
        ? window.location.hash.slice(window.location.hash.indexOf("?"))
        : "");
    return diagramDevPreviewIdFromSearch(search);
  }

  onMount(() => {
    if (!import.meta.env.DEV) return;
    try {
      const params = new URLSearchParams(window.location.search);
      domDumpEnabled = params.has("dom");
      outlineEnabled = params.has("outline");
      previewFrameEnabled = params.has("pf");
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

  let diagramSvg = $state("");
  let diagramError = $state<string | undefined>(undefined);
  /** Container for injected SVG; patches TimeNowDate and TimeNowClock text without regenerating the scene. */
  let diagramHostEl = $state<HTMLElement | undefined>(undefined);
  let homeInstrumentEl = $state<HTMLElement | undefined>(undefined);
  let homeMenuPanelEl = $state<HTMLElement | undefined>(undefined);
  let homeMenuOpen = $state(false);
  let homeMenuPanelStyle = $state("left: 0px; bottom: 0px;");

  /** Dev-only: optional debug tooling (toggle with query params). */
  let domDumpEnabled = $state(false);
  let outlineEnabled = $state(false);
  let previewFrameEnabled = $state(false);
  let domSummary = $state<string>("");

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
</script>

<main class="home-route">
  {#if import.meta.env.DEV && diagramPreviewBannerLine !== null}
    <div class="home-diagram-preview-banner" role="status">
      {diagramPreviewBannerLine}
    </div>
  {/if}
  {#if import.meta.env.DEV && tideUxDevPreviewBannerLine !== null}
    <div class="home-tide-ux-preview-banner" role="status">
      {tideUxDevPreviewBannerLine}
    </div>
  {/if}
  {#if domDumpEnabled}
    <div class="home-debug">
      <button type="button" class="home-debug__btn" onclick={refreshDomSummary}
        >Refresh DOM summary</button
      >
      <details open>
        <summary>Home route DOM (summary)</summary>
        <pre class="home-debug__pre">{domSummary}</pre>
      </details>
    </div>
  {/if}
  {#if tideLoadState.status === "loading"}
    <div class="home-panel" aria-live="polite">
      <p class="muted" role="status">Loading tides…</p>
    </div>
  {:else if tideLoadState.status === "error"}
    <div class="home-panel" aria-live="polite">
      <p class="muted" role="alert">
        Tides could not be loaded. Check the connection and try again.
      </p>
    </div>
  {:else if tideExtremes === undefined}
    <div class="home-panel home-panel--corner-nav-host">
      <section
        class="home-empty-state"
        aria-labelledby="home-empty-state-title"
      >
        <p class="home-empty-state__eyebrow">First use</p>
        <h1 id="home-empty-state-title" class="home-empty-state__title">
          Choose your location
        </h1>
        <p class="home-empty-state__body">
          Set a coastal location to see today&apos;s tide clock. You can change
          it later from the menu.
        </p>
        <a class="home-empty-state__action" href="#/location2"
          >Choose location</a
        >
      </section>
    </div>
  {:else if tideExtremes.extremes.length === 0}
    <div class="home-panel" aria-live="polite">
      <p class="muted" role="status">No tide extremes for this day.</p>
    </div>
  {:else if diagramError !== undefined}
    <div class="home-panel" aria-live="polite">
      <p class="muted" role="alert">
        Diagram could not be rendered: {diagramError}
      </p>
    </div>
  {:else if diagramSvg !== ""}
    <div class="home-panel" bind:this={diagramHostEl}>
      <figure
        class="home-instrument"
        bind:this={homeInstrumentEl}
        aria-label="Tide diagram for the current civil day"
      >
        <!-- Trusted: SVG from diagram-generation scene graph (renderSceneSvg). -->
        {@html diagramSvg}
        {#if homeMenuOpen}
          <div
            class="home-menu-panel"
            bind:this={homeMenuPanelEl}
            style={homeMenuPanelStyle}
          >
            <PrimaryNavLinks
              className="home-menu-panel__links"
              onNavigate={closeHomeMenu}
            />
          </div>
        {/if}
      </figure>
    </div>
  {/if}
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

  .home-diagram-preview-banner {
    flex: 0 0 auto;
    padding: 0.35rem 0.75rem;
    background: #422006;
    color: #fef3c7;
    font-size: 0.75rem;
    font-weight: 600;
    border-bottom: 1px solid rgb(251 191 36 / 0.35);
  }

  .home-tide-ux-preview-banner {
    flex: 0 0 auto;
    padding: 0.35rem 0.75rem;
    background: #172554;
    color: #dbeafe;
    font-size: 0.75rem;
    font-weight: 600;
    border-bottom: 1px solid rgb(96 165 250 / 0.35);
  }

  .home-panel {
    flex: 1;
    min-height: 0;
    width: 100%;
    background: #000;
    display: flex;
    align-items: stretch;
    justify-content: stretch;
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  .home-panel--corner-nav-host {
    position: relative;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }

  .home-empty-state {
    width: min(28rem, calc(100% - 2rem));
    display: grid;
    gap: 0.9rem;
    justify-items: start;
    padding: 1.5rem;
    border: 1px solid #d1d5db;
    border-radius: 0.875rem;
    background: #fff;
    box-shadow: 0 18px 40px rgb(0 0 0 / 0.16);
  }

  .home-empty-state__eyebrow {
    margin: 0;
    color: #1d4ed8;
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .home-empty-state__title {
    margin: 0;
    color: #111827;
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    line-height: 1.05;
  }

  .home-empty-state__body {
    margin: 0;
    max-width: 28ch;
    line-height: 1.5;
    color: #374151;
  }

  .home-empty-state__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.75rem;
    padding: 0.7rem 1rem;
    border-radius: 999px;
    background: #dbeafe;
    color: #1d4ed8;
    font-weight: 600;
    text-decoration: none;
    box-shadow: 0 8px 20px rgb(0 0 0 / 0.1);
  }

  .home-empty-state__action:hover {
    background: #bfdbfe;
    color: #1e40af;
  }

  .home-empty-state__action:focus-visible {
    outline: 2px solid #1d4ed8;
    outline-offset: 3px;
  }

  .home-instrument {
    margin: 0;
    padding: 0;
    width: 100%;
    flex: 1;
    min-height: 0;
    position: relative;
    overflow: hidden;
  }

  /*
   * Make the whole menu control’s bounds hit-testable (not only painted glyph edges).
   * Avoids flaky pointerenter/hover when the pointer crosses “empty” parts of the group.
   */
  .home-instrument :global(svg g[data-name="HomeMenuTrigger"]) {
    pointer-events: all;
  }

  .home-instrument :global(svg g[data-name="HomeMenuTrigger"] > rect) {
    transition:
      fill 120ms ease-out,
      stroke 120ms ease-out;
  }

  .home-instrument
    :global(
      svg
        g[data-name="HomeMenuTrigger"]
        g[data-name="HomeMenuTriggerLabel"]
        text
    ) {
    transition: fill 120ms ease-out;
  }

  .home-instrument
    :global(
      svg g[data-name="HomeMenuTrigger"].home-menu-trigger--hover > rect
    ) {
    fill: #191919;
    stroke: #aaa;
  }

  .home-instrument
    :global(
      svg
        g[data-name="HomeMenuTrigger"].home-menu-trigger--hover
        g[data-name="HomeMenuTriggerLabel"]
        text
    ) {
    fill: #ffffff;
  }

  .home-instrument :global(svg) {
    display: block;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    max-height: none;
  }

  /*
   * Hard-coded pulse for TimeNowLabelSecondsColon only (not in style model).
   * ~600ms cycle: dip and return reads as a subtle “heartbeat” on the : before SS.
   */
  @keyframes home-time-now-colon-heartbeat {
    0%,
    100% {
      opacity: 1;
    }
    50% {
      opacity: 0.22;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .home-instrument :global(svg g[data-name="TimeNowLabelSecondsColon"] text) {
      animation: home-time-now-colon-heartbeat 600ms ease-in-out infinite;
    }
  }

  /*
   * Time-now pointer wedge (rendered as path.home-now-triangle-pulse): 50%→100% opacity in 600ms, full cycle 1s.
   */
  @keyframes home-now-triangle-pulse {
    0%,
    100% {
      opacity: 0.45;
    }
    60% {
      opacity: 1;
    }
  }

  @media (prefers-reduced-motion: no-preference) {
    .home-instrument :global(svg path.home-now-triangle-pulse) {
      animation: home-now-triangle-pulse 1s linear infinite;
    }
  }

  .home-panel .muted {
    color: #dbeafe;
  }

  .home-menu-panel {
    position: absolute;
    transform: translate(-4px, 0);
    z-index: 30;
    min-width: 12rem;
    padding: 0.5rem;
    background: rgb(2 6 23 / 0.92);
    border: 1px solid rgb(148 163 184 / 0.2);
    border-radius: 0.375rem;
    box-shadow: 0 10px 30px rgb(0 0 0 / 0.45);
  }

  .home-menu-panel :global(.home-menu-panel__links) {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .home-menu-panel :global(.home-menu-panel__links a) {
    color: rgb(241 245 249 / 0.92);
    text-decoration: none;
    padding: 0.35rem 0.5rem;
    border-radius: 0.25rem;
  }

  .home-menu-panel :global(.home-menu-panel__links a:hover) {
    background: rgb(148 163 184 / 0.12);
  }

  .home-debug {
    padding: 0.5rem 0.75rem;
    background: #0b1020;
    color: #e5e7eb;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      "Liberation Mono", "Courier New", monospace;
    font-size: 12px;
  }

  .home-debug__btn {
    background: rgba(255, 255, 255, 0.06);
    border: 1px solid rgba(255, 255, 255, 0.12);
    color: inherit;
    padding: 0.25rem 0.5rem;
    border-radius: 0.375rem;
    cursor: pointer;
    margin-bottom: 0.5rem;
  }

  .home-debug__pre {
    white-space: pre-wrap;
    word-break: break-word;
    max-height: 35vh;
    overflow: auto;
    margin: 0.5rem 0 0;
  }
</style>
