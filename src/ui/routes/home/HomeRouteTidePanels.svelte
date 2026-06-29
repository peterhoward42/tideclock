<script lang="ts">
  /**
   * Main tide route body: loading / error / empty / diagram host and overlay chrome.
   * DOM refs are bindable so the route’s effects (SVG glue, menu wiring, clock patch) stay in Home.
   */
  import type { TideExtremesAtLocation } from "../../../core-models/TideExtremesAtLocation";
  import PrimaryMenuContent from "../../components/PrimaryMenuContent.svelte";
  import HomeDefaultLocationExplainerOverlay from "./HomeDefaultLocationExplainerOverlay.svelte";
  import HomeFullscreenBrowserAdviceOverlay from "./HomeFullscreenBrowserAdviceOverlay.svelte";
  import HomeKeepAwakeExplainerOverlay from "./HomeKeepAwakeExplainerOverlay.svelte";
  import HomeShareLinkCopiedOverlay from "./HomeShareLinkCopiedOverlay.svelte";
  import type { Town } from "../../../data/townSchema";

  import type { TidePresentation } from "./routeProps";
  import {
    quotaExhaustedBodyParagraphs,
    quotaExhaustedHeadline,
    quotaExhaustedIntroEnd,
    quotaExhaustedIntroLead,
    quotaExhaustedIntroSiteLabel,
    quotaExhaustedWorldTidesHref,
    quotaExhaustedSoftwareNerdHref,
    quotaExhaustedCoffeeAsideBuyLinkLabel,
    quotaExhaustedCoffeeAsideEnd,
    quotaExhaustedCoffeeAsideMid,
    quotaExhaustedCoffeeAsidePrefix,
    quotaExhaustedCoffeeAsideStoryLinkLabel,
    quotaExhaustedSoftwareNerdLinkText,
    quotaExhaustedStoryHref,
  } from "../../quotaExhaustedCopy";
  import { externalLinkNewTabAttrs } from "../../externalLink";
  import {
    operatorNoticeBodyParagraphs,
    operatorNoticeHeadline,
  } from "../../operatorNoticeCopy";
  import {
    urlLocationErrorBodyExample,
    urlLocationErrorBodyLead,
    urlLocationErrorBodyTail,
    urlLocationErrorDetailForReason,
    urlLocationErrorHeadline,
    urlLocationErrorReceivedLine,
  } from "../../urlLocationErrorCopy";

  interface Props {
    readonly tidePresentation: TidePresentation;
    readonly tideExtremes: TideExtremesAtLocation | undefined;
    readonly currentTown: Town | undefined;
    readonly diagramError: string | undefined;
    readonly diagramSvg: string;
    readonly showLandscapeHint: boolean;
    readonly verticalLetterboxSlackPx: number;
    readonly showDefaultLocationExplainer: boolean;
    readonly defaultLocationExplainerPlaceLine: string;
    readonly onDismissDefaultLocationExplainer: () => void;
    readonly homeMenuOpen: boolean;
    readonly homeMenuPanelStyle: string;
    readonly homeFullscreenAdviceOpen: boolean;
    readonly homeFullscreenAdviceLead: string;
    readonly homeFullscreenAdviceBody: string;
    readonly onDismissHomeFullscreenAdvice: () => void;
    readonly homeKeepAwakeExplainerOpen: boolean;
    readonly homeKeepAwakeExplainerMessage: string;
    readonly onDismissHomeKeepAwakeExplainer: () => void;
    readonly homeShareLinkCopiedOpen: boolean;
    readonly homeShareLinkCopiedUrl: string;
    readonly onDismissHomeShareLinkCopied: () => void;
    readonly homeNerdsOpen: boolean;
    readonly homeContactOpen: boolean;
    readonly onCloseHomeMenu: () => void;
    readonly onToggleHomeNerds: () => void;
    readonly onToggleHomeContact: () => void;
    diagramHostEl?: HTMLElement | undefined;
    homeInstrumentEl?: HTMLElement | undefined;
    homeMenuPanelEl?: HTMLElement | undefined;
  }

  let {
    tidePresentation,
    tideExtremes,
    currentTown,
    diagramError,
    diagramSvg,
    showLandscapeHint,
    verticalLetterboxSlackPx,
    showDefaultLocationExplainer,
    defaultLocationExplainerPlaceLine,
    onDismissDefaultLocationExplainer,
    homeMenuOpen,
    homeMenuPanelStyle,
    homeFullscreenAdviceOpen,
    homeFullscreenAdviceLead,
    homeFullscreenAdviceBody,
    onDismissHomeFullscreenAdvice,
    homeKeepAwakeExplainerOpen,
    homeKeepAwakeExplainerMessage,
    onDismissHomeKeepAwakeExplainer,
    homeShareLinkCopiedOpen,
    homeShareLinkCopiedUrl,
    onDismissHomeShareLinkCopied,
    homeNerdsOpen,
    homeContactOpen,
    onCloseHomeMenu,
    onToggleHomeNerds,
    onToggleHomeContact,
    diagramHostEl = $bindable(),
    homeInstrumentEl = $bindable(),
    homeMenuPanelEl = $bindable(),
  }: Props = $props();

  const sharePlaceLine = $derived.by(() => {
    const town = currentTown;
    if (town === undefined) return "Unknown";
    return town.county !== "" ? `${town.name}, ${town.county}` : town.name;
  });
</script>

{#if tidePresentation.kind === "operatorNotice"}
  <div class="home-panel home-panel--operator-notice" aria-live="polite">
    <div class="home-operator-notice-message" role="status">
      <p class="home-operator-notice-message__headline">
        {operatorNoticeHeadline}
      </p>
      {#each operatorNoticeBodyParagraphs as paragraph}
        <p class="home-operator-notice-message__body muted">{paragraph}</p>
      {/each}
    </div>
  </div>
{:else if tidePresentation.kind === "loading" || (tidePresentation.kind === "ready" && tideExtremes === undefined)}
  <div class="home-panel" aria-live="polite">
    <p class="muted" role="status">Loading tides…</p>
  </div>
{:else if tidePresentation.kind === "quotaExhausted"}
  <div class="home-panel home-panel--quota" aria-live="polite">
    <div class="home-quota-message" role="status">
      <p class="home-quota-message__headline">{quotaExhaustedHeadline}</p>
      <p class="home-quota-message__body muted">
        {quotaExhaustedIntroLead}<a
          class="home-quota-message__link"
          href={quotaExhaustedWorldTidesHref}
          {...externalLinkNewTabAttrs}>{quotaExhaustedIntroSiteLabel}</a
        >{quotaExhaustedIntroEnd}
      </p>
      {#each quotaExhaustedBodyParagraphs as paragraph}
        <p class="home-quota-message__body muted">{paragraph}</p>
      {/each}
      <div class="home-quota-asides">
        <aside class="home-quota-aside" aria-label="Optional support">
          <p class="home-quota-aside__line muted">
            {quotaExhaustedCoffeeAsidePrefix}<a
              class="home-quota-aside__link"
              href={quotaExhaustedStoryHref}
              >{quotaExhaustedCoffeeAsideBuyLinkLabel}</a
            >{quotaExhaustedCoffeeAsideMid}<a
              class="home-quota-aside__link"
              href={quotaExhaustedStoryHref}
              >{quotaExhaustedCoffeeAsideStoryLinkLabel}</a
            >{quotaExhaustedCoffeeAsideEnd}
          </p>
        </aside>
        <aside class="home-quota-aside" aria-label="How the dial gets its data">
          <p class="home-quota-aside__line muted">
            <a
              class="home-quota-aside__link"
              href={quotaExhaustedSoftwareNerdHref}
              >{quotaExhaustedSoftwareNerdLinkText}</a
            >
          </p>
        </aside>
      </div>
    </div>
  </div>
{:else if tidePresentation.kind === "urlLocationError"}
  <div class="home-panel home-panel--url-location-error" aria-live="polite">
    <div class="home-url-location-error-message" role="alert">
      <p class="home-url-location-error-message__headline">
        {urlLocationErrorHeadline}
      </p>
      {#if urlLocationErrorDetailForReason(tidePresentation.reason) !== null}
        <p class="home-url-location-error-message__body muted">
          {urlLocationErrorDetailForReason(tidePresentation.reason)}
        </p>
      {/if}
      <p class="home-url-location-error-message__body muted">
        {urlLocationErrorBodyLead}<span
          class="home-url-location-error-message__mono"
          >{urlLocationErrorBodyExample}</span
        >{urlLocationErrorBodyTail}
      </p>
      {#if urlLocationErrorReceivedLine(tidePresentation.place, tidePresentation.county) !== null}
        <p class="home-url-location-error-message__body muted">
          {urlLocationErrorReceivedLine(
            tidePresentation.place,
            tidePresentation.county,
          )}
        </p>
      {/if}
    </div>
  </div>
{:else if tidePresentation.kind === "loadFailed"}
  <div class="home-panel" aria-live="polite">
    <p class="muted" role="alert">
      Tides could not be loaded. Check the connection and try again.
    </p>
  </div>
{:else if tideExtremes === undefined || tideExtremes.extremes.length === 0}
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
  <div class="home-panel home-panel--diagram-host" bind:this={diagramHostEl}>
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
    {#if homeFullscreenAdviceOpen}
      <HomeFullscreenBrowserAdviceOverlay
        lead={homeFullscreenAdviceLead}
        body={homeFullscreenAdviceBody}
        onDismiss={onDismissHomeFullscreenAdvice}
      />
    {/if}
    {#if homeKeepAwakeExplainerOpen}
      <HomeKeepAwakeExplainerOverlay
        message={homeKeepAwakeExplainerMessage}
        onDismiss={onDismissHomeKeepAwakeExplainer}
      />
    {/if}
    {#if homeShareLinkCopiedOpen}
      <HomeShareLinkCopiedOverlay
        placeLine={sharePlaceLine}
        shareUrl={homeShareLinkCopiedUrl}
        onDismiss={onDismissHomeShareLinkCopied}
      />
    {/if}
    {#if homeMenuOpen}
      <div
        class="home-menu-panel"
        bind:this={homeMenuPanelEl}
        style={homeMenuPanelStyle}
      >
        <PrimaryMenuContent
          linksClassName="u-stack-sm u-nav-link-list"
          nerdsOpen={homeNerdsOpen}
          onToggleNerds={onToggleHomeNerds}
          contactOpen={homeContactOpen}
          onToggleContact={onToggleHomeContact}
          onNavigate={onCloseHomeMenu}
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

  .home-panel--quota,
  .home-panel--operator-notice,
  .home-panel--url-location-error {
    align-items: center;
    justify-content: center;
    padding: 1.5rem;
  }

  .home-url-location-error-message {
    max-width: min(42ch, 100%);
    margin: 0;
    display: grid;
    gap: 0.75rem;
  }

  .home-url-location-error-message__headline {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.35;
    color: var(--text-home-panel-muted);
  }

  .home-url-location-error-message__body {
    margin: 0;
    line-height: 1.5;
    text-align: left;
  }

  .home-url-location-error-message__mono {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      monospace;
    font-size: 0.92em;
    word-break: break-word;
  }

  .home-operator-notice-message {
    max-width: min(42ch, 100%);
    margin: 0;
    display: grid;
    gap: 0.75rem;
  }

  .home-operator-notice-message__headline {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.35;
    color: var(--text-home-panel-muted);
  }

  .home-operator-notice-message__body {
    margin: 0;
    line-height: 1.5;
    text-align: left;
  }

  .home-quota-message {
    max-width: min(42ch, 100%);
    margin: 0;
    display: grid;
    gap: 0.75rem;
  }

  .home-quota-message__headline {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    line-height: 1.35;
    color: var(--text-home-panel-muted);
  }

  .home-quota-message__body {
    margin: 0;
    line-height: 1.5;
    text-align: left;
  }

  .home-quota-message__link {
    color: var(--text-link-accent);
    text-decoration: underline;
    text-underline-offset: 0.12em;
  }

  .home-quota-asides {
    margin-top: 0.35rem;
    display: grid;
    gap: 0.65rem;
  }

  .home-quota-aside {
    margin: 0;
    padding: 0.85rem 1rem;
    border: 1px solid var(--border-subtle);
    border-left: 3px solid
      color-mix(in srgb, var(--text-link-accent) 55%, var(--border-subtle));
    border-radius: 0.35rem;
    background: color-mix(
      in srgb,
      var(--surface-page) 72%,
      var(--text-home-panel-muted) 8%
    );
    box-shadow: 0 1px 3px rgb(15 23 42 / 0.06);
  }

  .home-quota-aside__line {
    margin: 0;
    font-size: 0.9rem;
    line-height: 1.45;
    text-align: left;
  }

  .home-quota-aside__link {
    color: var(--text-link-accent);
    text-decoration: underline;
    text-underline-offset: 0.12em;
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
   * Make the Menu link’s bounds hit-testable (not only painted glyph edges).
   * Avoids flaky pointerenter/hover when the pointer crosses empty space in the group.
   */
  .home-instrument :global(svg g[data-name="HomeMenuTrigger"]) {
    pointer-events: all;
  }

  .home-instrument :global(svg g[data-name="FullScreenIcon"]) {
    pointer-events: all;
  }

  .home-instrument :global(svg g[data-name="KeepAwakeIcon"]) {
    pointer-events: none;
  }

  .home-instrument :global(svg g[data-name="KeepAwakeIcon.Control"]) {
    pointer-events: all;
  }

  .home-instrument
    :global(svg g[data-name="FullScreenIcon"]:not(.fullscreen-icon--active) g[data-name="FullScreenIcon.On"]),
  .home-instrument
    :global(svg g[data-name="FullScreenIcon"].fullscreen-icon--active g[data-name="FullScreenIcon.Off"]),
  .home-instrument
    :global(svg g[data-name="KeepAwakeIcon"]:not(.keep-awake-icon--active) g[data-name="KeepAwakeIcon.On"]),
  .home-instrument
    :global(svg g[data-name="KeepAwakeIcon"].keep-awake-icon--active g[data-name="KeepAwakeIcon.Off"]) {
    display: none;
  }

  .home-instrument
    :global(
      svg
        g[data-name="FullScreenIcon"]
        g[data-name="FullScreenIcon.HitFrame"]
        rect
    ) {
    transition:
      fill 120ms ease-out,
      stroke 120ms ease-out;
  }

  .home-instrument :global(svg g[data-name="FullScreenIcon"] g[data-name="FullScreenIcon.Off"] line),
  .home-instrument :global(svg g[data-name="FullScreenIcon"] g[data-name="FullScreenIcon.On"] line),
  .home-instrument :global(svg g[data-name="KeepAwakeIcon"] g[data-name="KeepAwakeIcon.Label"] text),
  .home-instrument
    :global(svg g[data-name="KeepAwakeIcon.Off.Checkbox"] rect),
  .home-instrument
    :global(svg g[data-name="KeepAwakeIcon.On.Checkbox"] rect),
  .home-instrument
    :global(svg g[data-name="KeepAwakeIcon.On.Checkmark"] line) {
    transition:
      stroke 120ms ease-out,
      fill 120ms ease-out;
  }

  .home-instrument
    :global(svg g[data-name="KeepAwakeIcon.Off.Checkbox"] rect),
  .home-instrument
    :global(svg g[data-name="KeepAwakeIcon.On.Checkbox"] rect) {
    fill: none;
  }

  .home-instrument
    :global(
      svg
        g[data-name="FullScreenIcon"].fullscreen-icon--hover
        g[data-name="FullScreenIcon.HitFrame"]
        rect
    ) {
    fill: var(--surface-home-instrument-plate-hover);
    stroke: var(--border-home-instrument-plate-hover);
    opacity: 1;
  }

  .home-instrument
    :global(
      svg
        g[data-name="FullScreenIcon"].fullscreen-icon--hover
        g[data-name="FullScreenIcon.Off"]
        line
    ),
  .home-instrument
    :global(
      svg
        g[data-name="FullScreenIcon"].fullscreen-icon--hover
        g[data-name="FullScreenIcon.On"]
        line
    ),
  .home-instrument
    :global(
      svg
        g[data-name="KeepAwakeIcon.Control"].keep-awake-icon--hover
        g[data-name="KeepAwakeIcon.Label"]
        text
    ) {
    fill: var(--text-home-instrument-text-hover);
  }

  .home-instrument :global(svg g[data-name="HomeShareTrigger"]),
  .home-instrument :global(svg g[data-name="HomeLocationTrigger"]) {
    pointer-events: all;
  }

  .home-instrument :global(svg g[data-name="HomeShareTrigger"] text),
  .home-instrument :global(svg g[data-name="HomeLocationTrigger"] text) {
    transition: fill 120ms ease-out;
  }

  .home-instrument
    :global(svg g[data-name="HomeShareTrigger"].home-share-trigger--hover text),
  .home-instrument
    :global(
      svg g[data-name="HomeLocationTrigger"].home-location-trigger--hover text
    ) {
    fill: var(--text-home-share-trigger-hover, #ccc);
  }

  .home-instrument :global(svg g[data-name="HomeMenuTrigger"] text) {
    transition: fill 120ms ease-out;
  }

  .home-instrument
    :global(
      svg g[data-name="HomeMenuTrigger"].home-menu-trigger--hover text
    ) {
    fill: var(--text-home-instrument-text-hover);
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
