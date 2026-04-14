/**
 * bakedTowns.ts — Loads and queries the shipped compact towns table for location search.
 * Kind: Definition + query. Does not persist the user’s selection (see `currentLocation`).
 */

import townsCompactJson from './towns.compact.json';
import { hydrateTownsCompact } from './townSchema';
import type { Town } from './townSchema';

export type { Town };
export { hydrateTownsCompact };

/** All towns from the committed compact JSON, hydrated at module load. */
export const bakedTowns: readonly Town[] = hydrateTownsCompact(townsCompactJson);
