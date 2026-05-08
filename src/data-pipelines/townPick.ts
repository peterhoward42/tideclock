/**
 * townPick.ts — Read/write validated {@link Town} snapshots via injectable storage seams.
 * Used by the shell for picker state and persistence. Kind: Service. Does not search the baked town list.
 */

import type { Town } from '../data/townSchema';
import {
  CURRENT_LOCATION_KEY,
  deserializeTownPick,
  serializeTownPick,
  type TownPickLoader,
  type TownPickStorer
} from './townPickSerde';

export interface StoreTownPickInput {
  readonly storer: TownPickStorer;
  /** Override for tests or an alternate slot; production uses {@link CURRENT_LOCATION_KEY}. */
  readonly storageKey?: string;
}

export interface LoadTownPickInput {
  readonly loader: TownPickLoader;
  readonly storageKey?: string;
}

/** Persists a validated town snapshot via the given storer (default key: {@link CURRENT_LOCATION_KEY}). */
export function storeTownPick(
  town: Town,
  { storer, storageKey = CURRENT_LOCATION_KEY }: StoreTownPickInput
): void {
  storer.setItem(storageKey, serializeTownPick(town));
}

/** Loads and validates a town snapshot, or `undefined` if missing or malformed. */
export function loadTownPick({
  loader,
  storageKey = CURRENT_LOCATION_KEY
}: LoadTownPickInput): Town | undefined {
  const raw = loader.getItem(storageKey);
  if (raw === null) {
    return undefined;
  }
  return deserializeTownPick(raw);
}
