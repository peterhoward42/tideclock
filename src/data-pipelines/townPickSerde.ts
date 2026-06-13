/**
 * townPickSerde.ts — Key, serde, and validation for the selected-town JSON blob in storage.
 * Consumed by `townPick.ts`. Kind: Adapter / boundary (persistence shape). Does not pick towns from the corpus.
 */

import type { Town } from '../data/townSchema';

/** Canonical `localStorage` key for a JSON snapshot of the user-selected {@link Town}. */
export const CURRENT_LOCATION_KEY = 'current-location';

/** Write-side persistence seam for the town-pick snapshot. */
export interface TownPickStorer {
  setItem(key: string, value: string): void;
}

/** Read-side persistence seam for the town-pick snapshot. */
export interface TownPickLoader {
  getItem(key: string): string | null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function parseStoredTown(value: unknown): Town | undefined {
  if (!value || typeof value !== 'object') {
    return undefined;
  }

  const typed = value as Record<string, unknown>;
  if (
    !isString(typed.name) ||
    !isFiniteNumber(typed.lat) ||
    !isFiniteNumber(typed.lon) ||
    !isString(typed.localType) ||
    !isString(typed.county) ||
    !isString(typed.postcodeDistrict) ||
    !isString(typed.region) ||
    !isString(typed.country)
  ) {
    return undefined;
  }

  return {
    name: typed.name,
    lat: typed.lat,
    lon: typed.lon,
    localType: typed.localType,
    county: typed.county,
    postcodeDistrict: typed.postcodeDistrict,
    region: typed.region,
    country: typed.country,
  };
}

/** Serializes a validated Town into the persisted JSON shape. */
export function serializeTownPick(town: Town): string {
  return JSON.stringify(town);
}

/** Guards untrusted storage JSON and returns undefined on shape mismatch. */
export function deserializeTownPick(raw: string): Town | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    return parseStoredTown(parsed);
  } catch {
    return undefined;
  }
}
