import type { Town } from '../data/bakedTowns';
import {
  CURRENT_LOCATION_KEY,
  deserializeCurrentLocation,
  serializeCurrentLocation,
  type CurrentLocationLoader,
  type CurrentLocationStorer
} from './currentLocationSnapshot';

export interface StoreCurrentLocationInput {
  readonly storer: CurrentLocationStorer;
  /** Override for tests or an alternate slot; production uses {@link CURRENT_LOCATION_KEY}. */
  readonly storageKey?: string;
}

export interface LoadCurrentLocationInput {
  readonly loader: CurrentLocationLoader;
  readonly storageKey?: string;
}

/** Persists a validated town snapshot via the given storer (default key: {@link CURRENT_LOCATION_KEY}). */
export function storeCurrentLocation(
  town: Town,
  { storer, storageKey = CURRENT_LOCATION_KEY }: StoreCurrentLocationInput
): void {
  storer.setItem(storageKey, serializeCurrentLocation(town));
}

/** Loads and validates a town snapshot, or `undefined` if missing or malformed. */
export function loadCurrentLocation({
  loader,
  storageKey = CURRENT_LOCATION_KEY
}: LoadCurrentLocationInput): Town | undefined {
  const raw = loader.getItem(storageKey);
  if (raw === null) {
    return undefined;
  }
  return deserializeCurrentLocation(raw);
}
