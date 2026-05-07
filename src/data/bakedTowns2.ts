/**
 * bakedTowns2.ts — Coastal place rows baked from tools/towns2/coastal-geocoded/*.tsv plus a
 * {@link SearchSpaceQueryer} aligned by row index. Regenerate JSON via
 * `node tools/towns2/build-towns2-compact.mjs`.
 * Kind: Definition + query. Does not persist the user’s selection.
 */

import { SearchSpaceQueryer } from '../location-services/searchSpaceQueryer';
import { hydrateTownsCompact, type Town } from './townSchema';
import {
  buildTownPickerStepbackLabels,
  formatTownPickerQualified,
} from './townPickerDisplay';
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

const displaySpace = bakedTowns2.map((t) => formatTownPickerQualified(t));
const keySpace = bakedTowns2.map((t) => t.id);
const primarySpace = bakedTowns2.map((t) => t.name);

export const towns2SearchSpaceQueryer = new SearchSpaceQueryer(
  searchLines,
  displaySpace,
  keySpace,
  primarySpace,
);

export const towns2ByTownId: ReadonlyMap<string, Town> = new Map(
  bakedTowns2.map((t) => [t.id, t]),
);

export type TownPrefixBucket =
  | 'need_input'
  | 'no_matches'
  | 'single_match'
  | 'few_matches'
  | 'many_matches'
  | 'too_many_matches';

export type TownPrefixQueryResult = {
  readonly normalizedPrefix: string;
  readonly normalizedCounty: string | null;
  readonly minPrefixLength: number;
  readonly totalMatches: number;
  readonly bucket: TownPrefixBucket;
  readonly visibleTownIds: readonly string[];
};

const DEFAULT_MIN_PREFIX_LENGTH = 2;
const DEFAULT_MAX_VISIBLE_MATCHES = 12;

type IndexedTown = {
  readonly town: Town;
  readonly normalizedName: string;
  readonly normalizedCounty: string;
};

function normalizeTownSearchText(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ');
}

const indexedTowns: readonly IndexedTown[] = bakedTowns2.map((town) => ({
  town,
  normalizedName: normalizeTownSearchText(town.name),
  normalizedCounty: normalizeTownSearchText(town.county),
}));

export const towns2StepbackLabelsByTownId = buildTownPickerStepbackLabels(bakedTowns2);

export const towns2Counties: readonly string[] = [...new Set(bakedTowns2.map((t) => t.county))]
  .filter((county) => county.trim() !== '')
  .sort((a, b) => a.localeCompare(b));

export function queryTowns2ByCountyAndNamePrefix(
  county: string,
  prefix: string,
  options?: {
    readonly minPrefixLength?: number;
    readonly maxVisibleMatches?: number;
  },
): TownPrefixQueryResult {
  const minPrefixLength = options?.minPrefixLength ?? DEFAULT_MIN_PREFIX_LENGTH;
  const maxVisibleMatches = options?.maxVisibleMatches ?? DEFAULT_MAX_VISIBLE_MATCHES;
  if (minPrefixLength < 1) {
    throw new RangeError('minPrefixLength must be >= 1');
  }
  if (maxVisibleMatches < 1) {
    throw new RangeError('maxVisibleMatches must be >= 1');
  }

  const normalizedPrefix = normalizeTownSearchText(prefix);
  const normalizedCountyRaw = normalizeTownSearchText(county);
  const normalizedCounty = normalizedCountyRaw === '' ? null : normalizedCountyRaw;

  if (normalizedPrefix.length < minPrefixLength) {
    return {
      normalizedPrefix,
      normalizedCounty,
      minPrefixLength,
      totalMatches: 0,
      bucket: 'need_input',
      visibleTownIds: [],
    };
  }

  const visibleTownIds: string[] = [];
  let totalMatches = 0;
  for (const row of indexedTowns) {
    if (normalizedCounty !== null && row.normalizedCounty !== normalizedCounty) {
      continue;
    }
    if (!row.normalizedName.startsWith(normalizedPrefix)) {
      continue;
    }
    totalMatches += 1;
    if (visibleTownIds.length < maxVisibleMatches) {
      visibleTownIds.push(row.town.id);
    }
  }

  const bucket: TownPrefixBucket =
    totalMatches === 0
      ? 'no_matches'
      : totalMatches === 1
        ? 'single_match'
        : totalMatches <= 12
          ? 'few_matches'
          : totalMatches <= 80
            ? 'many_matches'
            : 'too_many_matches';

  return {
    normalizedPrefix,
    normalizedCounty,
    minPrefixLength,
    totalMatches,
    bucket,
    visibleTownIds,
  };
}
