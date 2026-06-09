/**
 * resolveBootLocation.ts — Boot-time coastal place resolution: URL params beat storage, else default.
 * Pure orchestration for App.svelte init; does not touch localStorage or fetch tides.
 */

import { resolveTownByPlaceAndCounty } from '../data/resolveTownFromPlaceAndCounty';
import type { Town } from '../data/townSchema';
import { placeAndCountyFromSearch, type PlaceCountyFromSearch } from './homeUrlQuery';

export type UrlLocationErrorReason = 'missing_param' | 'unknown' | 'ambiguous';

export type UrlLocationError = {
  readonly reason: UrlLocationErrorReason;
  readonly place: string | null;
  readonly county: string | null;
};

export type BootLocationResult =
  | { readonly kind: 'fromStorage'; readonly town: Town }
  | { readonly kind: 'default'; readonly town: Town; readonly showExplainer: boolean }
  | { readonly kind: 'fromUrl'; readonly town: Town; readonly showExplainer: boolean }
  | { readonly kind: 'urlError'; readonly error: UrlLocationError };

function urlErrorFromPartialParams(
  params: Extract<PlaceCountyFromSearch, { readonly kind: 'partial' }>,
): UrlLocationError {
  return {
    reason: 'missing_param',
    place: params.place,
    county: params.county,
  };
}

function urlErrorFromResolve(
  place: string,
  county: string,
  resolveResult: Exclude<
    ReturnType<typeof resolveTownByPlaceAndCounty>,
    { readonly kind: 'found' }
  >,
): UrlLocationError {
  if (resolveResult.kind === 'ambiguous') {
    return { reason: 'ambiguous', place, county };
  }
  return { reason: 'unknown', place, county };
}

/** Resolve the town to show at boot from URL query, storage, and the shipped default. */
export function resolveBootLocation(input: {
  readonly search: string;
  readonly storedTown: Town | undefined;
  readonly defaultTown: Town;
  readonly towns: readonly Town[];
}): BootLocationResult {
  const params = placeAndCountyFromSearch(input.search);

  if (params.kind === 'partial') {
    return { kind: 'urlError', error: urlErrorFromPartialParams(params) };
  }

  if (params.kind === 'present') {
    const resolved = resolveTownByPlaceAndCounty(
      params.place,
      params.county,
      input.towns,
    );
    if (resolved.kind !== 'found') {
      return {
        kind: 'urlError',
        error: urlErrorFromResolve(params.place, params.county, resolved),
      };
    }
    return {
      kind: 'fromUrl',
      town: resolved.town,
      showExplainer: input.storedTown === undefined,
    };
  }

  if (input.storedTown !== undefined) {
    return { kind: 'fromStorage', town: input.storedTown };
  }

  return {
    kind: 'default',
    town: input.defaultTown,
    showExplainer: true,
  };
}
