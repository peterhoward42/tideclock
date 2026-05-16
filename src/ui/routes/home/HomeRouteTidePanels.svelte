<script lang="ts">
  /**
   * Main tide route body: loading / error / empty / diagram host and overlay chrome.
   * DOM refs are bindable so the route’s effects (SVG glue, menu wiring, clock patch) stay in Home.
   */
  import type { TideExtremesAtLocation } from "../../../core-models/TideExtremesAtLocation";
  import PrimaryMenuContent, {
    type PwaDisplayMenu,
  } from "../../components/PrimaryMenuContent.svelte";
  import HomeDefaultLocationExplainerOverlay from "./HomeDefaultLocationExplainerOverlay.svelte";

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
    readonly showDefaultLocationExplainer: boolean;
    readonly defaultLocationExplainerPlaceLine: string;
    readonly onDismissDefaultLocationExplainer: () => void;
    readonly homeMenuOpen: boolean;
    readonly homeMenuPanelStyle: string;
    readonly homeFullscreenActive: boolean;
    readonly homeContactOpen: boolean;
    readonly onCloseHomeMenu: () => void;
    readonly onToggleHomeContact: () => void;
    readonly onToggleHomeFullscreen: () => void | Promise<void>;
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
    showDefaultLocationExplainer,
    defaultLocationExplainerPlaceLine,
    onDismissDefaultLocationExplainer,
    homeMenuOpen,
    homeMenuPanelStyle,
    homeFullscreenActive,
    homeContactOpen,
    onCloseHomeMenu,
    onToggleHomeContact,
    onToggleHomeFullscreen,
    pwa,
    diagramHostEl = $bindable(),
    homeInstrumentEl = $bindable(),
    homeMenuPanelEl = $bindable(),
  }: Props = $props();
</script>

{#if tideLoadState.status === "loading" || (tideLoadState.status === "ready" && tideExtremes === undefined)}
  <div class="home-panel" aria-live="polite">
    <p class="muted" role="status">Loading tides…</p>
  </div>
{:else if tideLoadState.status === "error"}
  <div class="home-panel" aria-live="polite">
    <p class="muted" role="alert">
      Tides could not be loaded. Check the connection and try again.
    </p>
  </div>
{:else if tideExtremes.extremes.length === 0}
  <div class="home-panel" aria-live="polite">
    <p class="muted" role="status">No tide extremes for this day.</p>
    {#if showDefaultLocationExplainer}
      <HomeDefaultLocationExplainerOverlay
        placeLine={defaultLocationExplainerPlaceLine}
        onDismiss={onDismissDefaultLocationExplainer}
        useViewportFixed={true}
      />
    {/if}
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
      {#if showDefaultLocationExplainer}
        <HomeDefaultLocationExplainerOverlay
          placeLine={defaultLocationExplainerPlaceLine}
          onDismiss={onDismissDefaultLocationExplainer}
        />
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
          contactOpen={homeContactOpen}
          onToggleContact={onToggleHomeContact}
          onNavigate={onCloseHomeMenu}
          fullscreenActionLabel={homeFullscreenActive
            ? "Exit fullscreen"
            : "Really fullscreen"}
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

  /* Positioning context for the menu flyout (sibling of figure, not clipped by figure overflow). */
  .home-panel--diagram-host {
    position: relative;
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
    max-width: min(36ch, calc(100% - 0.5rem));
    color: var(--text-home-landscape-hint);
    /* Mobile-first: large enough to read at arm’s length; clamp keeps it secondary vs the dial. */
    font-size: clamp(0.8125rem, 0.72rem + 1.25vw, 0.875rem);
    line-height: 1.35;
    font-weight: 600;
    letter-spacing: 0.01em;
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
