/**
 * homeUrlQuery.ts — Pure URL/query helpers for the home route (dev previews, debug flags, share links).
 * Keeps hash-vs-search resolution and flag parsing testable without mounting Svelte.
 */

export type PlaceCountyFromSearch =
  | { readonly kind: 'absent' }
  | {
      readonly kind: 'partial';
      readonly place: string | null;
      readonly county: string | null;
    }
  | { readonly kind: 'present'; readonly place: string; readonly county: string };

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

/**
 * Reads required `place` and `county` share-link params from a query string.
 * Both must be non-empty after trim; one without the other is `partial`.
 */
export function placeAndCountyFromSearch(search: string): PlaceCountyFromSearch {
  const query = search.startsWith('?') ? search.slice(1) : search;
  const params = new URLSearchParams(query);
  const hasPlace = params.has('place');
  const hasCounty = params.has('county');

  if (!hasPlace && !hasCounty) {
    return { kind: 'absent' };
  }

  const place = (params.get('place') ?? '').trim();
  const county = (params.get('county') ?? '').trim();

  if (place === '' || county === '') {
    return {
      kind: 'partial',
      place: place === '' ? null : place,
      county: county === '' ? null : county,
    };
  }

  return { kind: 'present', place, county };
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
