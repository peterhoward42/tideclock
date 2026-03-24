import type { Town } from '../data/bakedTowns';
import {
  CURRENT_LOCATION_KEY,
  deserializeCurrentLocation,
  serializeCurrentLocation,
  type CurrentLocationLoader,
  type CurrentLocationStorer
} from './currentLocationSnapshot';

interface StoreCurrentLocationParams {
  storer: CurrentLocationStorer;
  storageKey?: string;
}

interface LoadCurrentLocationParams {
  loader: CurrentLocationLoader;
  storageKey?: string;
}

/** storeCurrentLocation is the write-side adapter from Town to localStorage snapshot. */
export function storeCurrentLocation(
  town: Town,
  { storer, storageKey = CURRENT_LOCATION_KEY }: StoreCurrentLocationParams
): void {
  storer.setItem(storageKey, serializeCurrentLocation(town));
}

/** loadCurrentLocation is the read-side adapter that validates stored JSON before returning Town. */
export function loadCurrentLocation({
  loader,
  storageKey = CURRENT_LOCATION_KEY
}: LoadCurrentLocationParams): Town | undefined {
  const raw = loader.getItem(storageKey);
  if (raw === null) {
    return undefined;
  }
  return deserializeCurrentLocation(raw);
}
