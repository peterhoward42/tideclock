/**
 * bakedTowns2.ts — Coastal place rows baked from tools/towns2/coastal-geocoded/*.tsv plus a
 * {@link SearchSpaceQueryer} aligned by row index. Regenerate JSON via
 * `node tools/towns2/build-towns2-compact.mjs`.
 * Kind: Definition + query. Does not persist the user’s selection.
 */

import { SearchSpaceQueryer } from '../location-services/searchSpaceQueryer';
import { hydrateTownsCompact, type Town } from './bakedTowns';
import towns2CompactJson from './towns2.compact.json';
import towns2SearchLinesJson from './towns2-search-lines.json';

export type { Town };

function readSearchLines(doc: unknown): readonly string[] {
  if (!doc || typeof doc !== 'object' || !('lines' in doc)) {
    throw new Error('towns2-search-lines: root must be an object with lines');
  }
  const { lines } = doc as { lines: unknown };
  if (!Array.isArray(lines) || lines.some((l) => typeof l !== 'string')) {
    throw new Error('towns2-search-lines: lines must be string[]');
  }
  return lines;
}

const searchLines = readSearchLines(towns2SearchLinesJson);

export const bakedTowns2: readonly Town[] = hydrateTownsCompact(towns2CompactJson);

if (searchLines.length !== bakedTowns2.length) {
  throw new Error(
    `towns2 data length mismatch: search ${searchLines.length} vs towns ${bakedTowns2.length}`,
  );
}

const displaySpace = bakedTowns2.map(
  (t) => `${t.name} (${t.county}, ${t.country})`,
);
const keySpace = bakedTowns2.map((t) => t.id);

export const towns2SearchSpaceQueryer = new SearchSpaceQueryer(
  searchLines,
  displaySpace,
  keySpace,
);

export const towns2ByTownId: ReadonlyMap<string, Town> = new Map(
  bakedTowns2.map((t) => [t.id, t]),
);
