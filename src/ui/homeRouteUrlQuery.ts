/**
 * homeRouteUrlQuery.ts — Pure URL/query helpers for the home route (dev previews, debug flags).
 * Keeps hash-vs-search resolution and flag parsing testable without mounting Svelte.
 */

export type HomeRouteDevDebugFlags = {
  readonly domDump: boolean;
  readonly outline: boolean;
  readonly previewFrame: boolean;
};

/**
 * Effective query string for parsing with `URLSearchParams`.
 * When the app uses hash routing, `location.search` may be empty while params live in `location.hash`
 * (for example `#/home?diagramPreview=…`).
 */
export function effectiveSearchStringFromLocationParts(
  locationSearch: string,
  locationHash: string,
): string {
  if (locationSearch !== "") {
    return locationSearch;
  }
  const q = locationHash.indexOf("?");
  if (q === -1) {
    return "";
  }
  return locationHash.slice(q);
}

/** Dev-only debug toggles from the current query string (`?dom`, `?outline`, `?pf`). */
export function homeRouteDevDebugFlagsFromSearch(
  search: string,
): HomeRouteDevDebugFlags {
  const params = new URLSearchParams(search);
  return {
    domDump: params.has("dom"),
    outline: params.has("outline"),
    previewFrame: params.has("pf"),
  };
}

/**
 * **Development only** — request to show the first-run / standalone PWA setup card
 * (use when testing in a normal tab; production ignores this in callers).
 * Example: `http://host:port/?pwaSetup=1` or `#/home?pwaSetup=1`.
 */
export function pwaSetupDevPreviewWantedFromSearch(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get("pwaSetup") === "1";
}

/**
 * **Development only** — clear "don't show again" + session dismiss so the setup card
 * can appear again. Use with `?pwaSetup=1&pwaReset=1` for a full first-run re-test.
 */
export function pwaSetupDevResetWantedFromSearch(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get("pwaReset") === "1";
}
