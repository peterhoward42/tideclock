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

/** Serializes a validated Town into the persisted JSON shape. */
export function serializeTownPick(town: Town): string {
  return JSON.stringify(town);
}

/** Guards untrusted storage JSON and returns undefined on shape mismatch. */
export function deserializeTownPick(raw: string): Town | undefined {
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
