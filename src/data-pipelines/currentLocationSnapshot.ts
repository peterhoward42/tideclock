/**
 * currentLocationSnapshot.ts — Key, serde, and validation for the selected-town JSON blob in storage.
 * Consumed by `currentLocation.ts`. Kind: Adapter / boundary (persistence shape). Does not pick towns.
 */

import type { Town } from '../data/bakedTowns';

/** Canonical `localStorage` key for a JSON snapshot of the user-selected {@link Town}. */
export const CURRENT_LOCATION_KEY = 'current-location';

/** Write-side persistence seam for the current-location snapshot. */
export interface CurrentLocationStorer {
  setItem(key: string, value: string): void;
}

/** Read-side persistence seam for the current-location snapshot. */
export interface CurrentLocationLoader {
  getItem(key: string): string | null;
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}

function isString(value: unknown): value is string {
  return typeof value === 'string';
}

function isTown(value: unknown): value is Town {
  if (!value || typeof value !== 'object') {
    return false;
  }

  const typed = value as Partial<Town>;
  return (
    isString(typed.id) &&
    isString(typed.name) &&
    isFiniteNumber(typed.lat) &&
    isFiniteNumber(typed.lon) &&
    isString(typed.localType) &&
    isString(typed.county) &&
    isString(typed.postcodeDistrict) &&
    isString(typed.region) &&
    isString(typed.country)
  );
}

/** serializeCurrentLocation converts a validated Town into the persisted JSON shape. */
export function serializeCurrentLocation(town: Town): string {
  return JSON.stringify(town);
}

/** deserializeCurrentLocation guards untrusted storage JSON and returns undefined on shape mismatch. */
export function deserializeCurrentLocation(raw: string): Town | undefined {
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!isTown(parsed)) {
      return undefined;
    }
    return parsed;
  } catch {
    return undefined;
  }
}
