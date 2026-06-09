/**
 * homeUrlQuery.ts — Pure URL/query helpers for the home route (dev previews, debug flags, share links).
 * Keeps hash-vs-search resolution and flag parsing testable without mounting Svelte.
 */

import { TIDE_DIAL_PRODUCTION_ORIGIN } from './brand';

/** Town fields encoded in share-link query params. */
export type ShareLocationTown = {
  readonly name: string;
  readonly county: string;
};

/** Dev-only query keys stripped when syncing share params into the address bar. */
export const HOME_DEV_QUERY_KEYS = [
  'dom',
  'outline',
  'pf',
  'diagramPreview',
  'tideUxPreview',
] as const;

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

/** Required `place` + `county` pair as a query string (includes leading `?`). */
export function buildShareSearchForTown(town: ShareLocationTown): string {
  const params = new URLSearchParams();
  params.set('place', town.name);
  params.set('county', town.county);
  return `?${params.toString()}`;
}

/**
 * Canonical share URL for a coastal place.
 * Production uses {@link TIDE_DIAL_PRODUCTION_ORIGIN}; dev defaults to `window.location.origin`.
 */
export function buildShareUrlForTown(
  town: ShareLocationTown,
  options?: { readonly origin?: string },
): string {
  const origin =
    options?.origin ??
    (import.meta.env.PROD
      ? TIDE_DIAL_PRODUCTION_ORIGIN
      : typeof window !== 'undefined'
        ? window.location.origin
        : TIDE_DIAL_PRODUCTION_ORIGIN);
  return `${origin}/${buildShareSearchForTown(town)}`;
}

/**
 * Updates the browser address bar with share params for the active town.
 * Strips dev-only flags and moves params into `location.search` (hash query segment removed).
 */
export function syncShareParamsInLocationBar(town: ShareLocationTown): void {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  for (const key of HOME_DEV_QUERY_KEYS) {
    url.searchParams.delete(key);
  }
  url.searchParams.set('place', town.name);
  url.searchParams.set('county', town.county);
  const hashQ = url.hash.indexOf('?');
  if (hashQ !== -1) {
    url.hash = url.hash.slice(0, hashQ);
  }
  history.replaceState(null, '', url.href);
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
