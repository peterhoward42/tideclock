/**
 * homeUrlQuery.ts — Pure URL/query helpers for the home route (dev previews, debug flags).
 * Keeps hash-vs-search resolution and flag parsing testable without mounting Svelte.
 */

export type HomeDevDebugFlags = {
  readonly domDump: boolean;
  readonly outline: boolean;
  readonly previewFrame: boolean;
};

/**
 * Effective query string for parsing with `URLSearchParams`.
 * When the app uses hash routing, `location.search` may be empty while params live in `location.hash`
 * (for example `#/home?diagramPreview=…`).
 */
export function effectiveSearchFromLocation(
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
export function homeDevDebugFlagsFromSearch(
  search: string,
): HomeDevDebugFlags {
  const params = new URLSearchParams(search);
  return {
    domDump: params.has("dom"),
    outline: params.has("outline"),
    previewFrame: params.has("pf"),
  };
}
