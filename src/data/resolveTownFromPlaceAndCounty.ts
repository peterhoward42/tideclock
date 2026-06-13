/**
 * resolveTownFromPlaceAndCounty.ts — Exact normalized lookup of a coastal place by name + county.
 * Kind: Definition. Used by URL deep links and boot resolution; does not persist selection.
 */

import { normalizeTownSearchText } from './townSchema';
import type { Town } from './townSchema';

export type ResolveTownFromPlaceAndCountyResult =
  | { readonly kind: 'found'; readonly town: Town }
  | { readonly kind: 'unknown' }
  | { readonly kind: 'ambiguous'; readonly count: number };

/** Find corpus rows whose normalized name and county exactly match the query pair. */
export function resolveTownByPlaceAndCounty(
  place: string,
  county: string,
  towns: readonly Town[],
): ResolveTownFromPlaceAndCountyResult {
  const normalizedPlace = normalizeTownSearchText(place);
  const normalizedCounty = normalizeTownSearchText(county);
  const matches = towns.filter(
    (town) =>
      normalizeTownSearchText(town.name) === normalizedPlace &&
      normalizeTownSearchText(town.county) === normalizedCounty,
  );
  if (matches.length === 0) {
    return { kind: 'unknown' };
  }
  if (matches.length > 1) {
    return { kind: 'ambiguous', count: matches.length };
  }
  return { kind: 'found', town: matches[0] };
}
