<script lang="ts">
  /**
   * Main tide route body: loading / error / empty / diagram host and overlay chrome.
   * DOM refs are bindable so the route’s effects (SVG glue, menu wiring, clock patch) stay in Home.
   */
  import { THE_TIDE_DIAL } from "../../brand";
  import type { TideExtremesAtLocation } from "../../../core-models/TideExtremesAtLocation";
  import PrimaryMenuContent, {
    type PwaDisplayMenu,
  } from "../../components/PrimaryMenuContent.svelte";

  type TidePredictionsLoadState = {
    readonly status: "loading" | "ready" | "error";
  };

  interface Props {
    readonly tideLoadState: TidePredictionsLoadState;
    readonly tideExtremes: TideExtremesAtLocation | undefined;
    readonly diagramError: string | undefined;
    readonly diagramSvg: string;
    readonly showLandscapeHint: boolean;
    readonly verticalLetterboxSlackPx: number;
    readonly homeMenuOpen: boolean;
    readonly homeMenuPanelStyle: string;
    readonly homeFullscreenActive: boolean;
    readonly homeInstallInfoOpen: boolean;
    readonly homeInstallCanPrompt: boolean;
    readonly homeInstallBenefitLines: readonly string[];
    readonly homeInstallManualSteps: readonly string[];
    readonly homeInstallStatusLine: string | null;
    readonly onCloseHomeMenu: () => void;
    readonly onToggleHomeFullscreen: () => void | Promise<void>;
    readonly onOpenInstallMenu: () => void;
    readonly onPromptInstall: () => void | Promise<void>;
    readonly pwa: PwaDisplayMenu;
    diagramHostEl?: HTMLElement | undefined;
    homeInstrumentEl?: HTMLElement | undefined;
    homeMenuPanelEl?: HTMLElement | undefined;
  }

  let {
    tideLoadState,
    tideExtremes,
    diagramError,
    diagramSvg,
    showLandscapeHint,
    verticalLetterboxSlackPx,
    homeMenuOpen,
    homeMenuPanelStyle,
    homeFullscreenActive,
    homeInstallInfoOpen,
    homeInstallCanPrompt,
    homeInstallBenefitLines,
    homeInstallManualSteps,
    homeInstallStatusLine,
    onCloseHomeMenu,
    onToggleHomeFullscreen,
    onOpenInstallMenu,
    onPromptInstall,
    pwa,
    diagramHostEl = $bindable(),
    homeInstrumentEl = $bindable(),
    homeMenuPanelEl = $bindable(),
  }: Props = $props();
</script>

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
        Set a coastal location to use {THE_TIDE_DIAL}. You can change
        it later from the menu.
      </p>
      <a class="home-empty-state__action" href="#/location2">Choose location</a>
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
  <div
    class="home-panel home-panel--diagram-host"
    bind:this={diagramHostEl}
  >
    <figure
      class="home-instrument"
      bind:this={homeInstrumentEl}
      aria-label="Tide diagram for the current civil day"
    >
      <!-- Trusted: SVG from diagram-generation scene graph (renderSceneSvg). -->
      {@html diagramSvg}
      {#if showLandscapeHint}
        <div
          class="home-landscape-hint-strip home-landscape-hint-strip--top"
          style={`--home-landscape-hint-band-px: ${verticalLetterboxSlackPx}px`}
          role="note"
        >
          <p class="home-landscape-hint-strip__text">
            The diagram will be bigger if you turn your phone
          </p>
        </div>
      {/if}
    </figure>
    {#if homeMenuOpen}
      <div
        class="home-menu-panel"
        bind:this={homeMenuPanelEl}
        style={homeMenuPanelStyle}
      >
        <PrimaryMenuContent
          linksClassName="u-stack-sm u-nav-link-list"
          installInfoOpen={homeInstallInfoOpen}
          installCanPrompt={homeInstallCanPrompt}
          installBenefitLines={homeInstallBenefitLines}
          installManualSteps={homeInstallManualSteps}
          installStatusLine={homeInstallStatusLine}
          onToggleInstallInfo={onOpenInstallMenu}
          onPromptInstall={onPromptInstall}
          onNavigate={onCloseHomeMenu}
          fullscreenActionLabel={homeFullscreenActive
            ? "Exit fullscreen"
            : "Enter fullscreen"}
          onToggleFullscreen={onToggleHomeFullscreen}
          {pwa}
        />
      </div>
    {/if}
  </div>
{/if}

<style>
  .home-panel {
    flex: 1;
    min-height: 0;
    width: 100%;
    background: var(--surface-page);
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

  /* Positioning context for the menu flyout (sibling of figure, not clipped by figure overflow). */
  .home-panel--diagram-host {
    position: relative;
  }

  .home-empty-state {
    width: min(28rem, calc(100% - 2rem));
    display: grid;
    gap: 0.9rem;
    justify-items: start;
    padding: 1.5rem;
    border: 1px solid var(--border-home-support-card);
    border-radius: 0.875rem;
    background: var(--surface-home-support-card);
    box-shadow: var(--shadow-menu-flyout);
  }

  .home-empty-state__eyebrow {
    margin: 0;
    color: var(--text-home-support-accent);
    font-size: 0.82rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .home-empty-state__title {
    margin: 0;
    color: var(--text-home-support-primary);
    font-size: clamp(1.8rem, 4vw, 2.4rem);
    line-height: 1.05;
  }

  .home-empty-state__body {
    margin: 0;
    max-width: 28ch;
    line-height: 1.5;
    color: var(--text-home-support-secondary);
  }

  .home-empty-state__action {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-height: 2.75rem;
    padding: 0.7rem 1rem;
    border-radius: 999px;
    background: var(--surface-home-support-action);
    color: var(--text-home-support-action);
    font-weight: 600;
    text-decoration: none;
    box-shadow: var(--shadow-overlay);
  }

  .home-empty-state__action:hover {
    background: var(--surface-home-support-action-hover);
    color: var(--text-home-support-action-hover);
  }

  .home-empty-state__action:focus-visible {
    outline: 2px solid var(--focus-ring);
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
        g[data-name="HomeMenuTriggerIcon"]
        line
    ) {
    transition: stroke 120ms ease-out;
  }

  .home-instrument
    :global(
      svg g[data-name="HomeMenuTrigger"].home-menu-trigger--hover > rect
    ) {
    fill: var(--surface-home-menu-trigger-hover);
    stroke: var(--border-home-menu-trigger-hover);
  }

  .home-instrument
    :global(
      svg
        g[data-name="HomeMenuTrigger"].home-menu-trigger--hover
        g[data-name="HomeMenuTriggerIcon"]
        line
    ) {
    stroke: var(--text-home-menu-trigger-hover);
  }

  .home-instrument :global(svg) {
    display: block;
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    max-height: none;
  }

  .home-landscape-hint-strip {
    position: absolute;
    left: 0;
    right: 0;
    z-index: 8;
    height: var(--home-landscape-hint-band-px, 0px);
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    padding-inline: 0.75rem;
    pointer-events: none;
    text-align: center;
  }

  .home-landscape-hint-strip--top {
    top: 0;
  }

  .home-landscape-hint-strip__text {
    margin: 0;
    max-width: 36ch;
    color: var(--text-home-landscape-hint);
    font-size: 0.72rem;
    line-height: 1.3;
    font-weight: 500;
    letter-spacing: 0.02em;
  }

  /* No colon animation: keep the HH:MM:SS clock row stable. */

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
    color: var(--text-home-panel-muted);
  }

  .home-menu-panel {
    position: absolute;
    z-index: 30;
    min-width: 12rem;
    max-width: min(24rem, calc(100% - 1rem));
    min-height: 0;
    /*
     * Cap height with dvh *and* the positioned host (%). In landscape, dvh (shorter edge) is small, so
     * this dvh term usually wins the min() and inner scroll is obvious. In portrait, dvh is
     * large, so the % term can win; if the % chain is off, scroll feels wrong. Put dvh first
     * and use a slightly tighter 80dvh so portrait is less likely to “win” on a bad % only.
     */
    max-height: min(80dvh, calc(100% - 1rem));
    overflow-y: auto;
    -webkit-overflow-scrolling: touch;
    overscroll-behavior: contain;
    padding: 0.5rem;
    background: var(--surface-menu-flyout);
    border: 1px solid var(--border-menu-flyout);
    border-radius: 0.375rem;
    box-shadow: var(--shadow-menu-flyout);
  }

</style>
