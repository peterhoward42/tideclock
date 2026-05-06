import {
  formatTownPickerPrimary,
  formatTownPickerQualified,
  type TownPickerDisplayParts,
} from '../data/townPickerDisplay';
import type { Town } from '../data/townSchema';

/** Lowercased words from a place primary name; word order is ignored for comparisons. */
function nameWordSet(name: string): Set<string> {
  const t = name.trim().toLowerCase();
  if (t === '') {
    return new Set();
  }
  return new Set(t.split(/\s+/));
}

function isStrictSubset(a: Set<string>, b: Set<string>): boolean {
  if (a.size >= b.size) {
    return false;
  }
  for (const w of a) {
    if (!b.has(w)) {
      return false;
    }
  }
  return true;
}

/**
 * When every visible row is a final choice (exhaustive shortlist), order from more general
 * names to more specific ones using strict subset on name word-sets (unordered tokens).
 */
function compareTownPickerExhaustiveRowOrder(
  nameA: string,
  nameB: string,
  labelA: string,
  labelB: string,
): number {
  const setA = nameWordSet(nameA);
  const setB = nameWordSet(nameB);
  if (isStrictSubset(setA, setB)) {
    return -1;
  }
  if (isStrictSubset(setB, setA)) {
    return 1;
  }
  const sizeDelta = setA.size - setB.size;
  if (sizeDelta !== 0) {
    return sizeDelta;
  }
  const nameCmp = nameA.localeCompare(nameB, undefined, { sensitivity: 'base' });
  if (nameCmp !== 0) {
    return nameCmp;
  }
  return labelA.localeCompare(labelB, undefined, { sensitivity: 'base' });
}

export type TownPickerVisibleRow = Pick<Town, 'id' | 'name' | 'county' | 'country'>;

export type TownPickerVisiblePresentation = {
  readonly labels: string[];
  readonly showQualifier: boolean[];
};

/**
 * Normalizes a display primary for collision detection only.
 * Rendering should still use source data exactly as provided.
 */
export function normalizeTownPickerPrimary(primary: string): string {
  return primary.trim().toLowerCase();
}

/**
 * Builds per-row qualifier visibility for a visible towns2 result slice.
 * Rows whose normalized primary appears more than once get qualified labels.
 */
export function buildTownPickerVisiblePresentation(
  rows: readonly TownPickerDisplayParts[],
): TownPickerVisiblePresentation {
  const collisionCounts = new Map<string, number>();
  for (const row of rows) {
    const key = normalizeTownPickerPrimary(row.name);
    collisionCounts.set(key, (collisionCounts.get(key) ?? 0) + 1);
  }

  const showQualifier = rows.map(
    (row) => (collisionCounts.get(normalizeTownPickerPrimary(row.name)) ?? 0) > 1,
  );
  const labels = rows.map((row, i) =>
    showQualifier[i] ? formatTownPickerQualified(row) : formatTownPickerPrimary(row),
  );

  return { labels, showQualifier };
}

/**
 * Derives structured visible rows by key for downstream disambiguation helpers.
 * Throws when any key is missing so callers do not silently desync UI rows.
 */
export function buildVisibleTownRowsFromKeys(
  resultKeys: readonly string[],
  townsById: ReadonlyMap<string, Town>,
): readonly TownPickerVisibleRow[] {
  return resultKeys.map((townId) => {
    const town = townsById.get(townId);
    if (town === undefined) {
      throw new Error(`town key not found in townsById: ${townId}`);
    }
    return {
      id: town.id,
      name: town.name,
      county: town.county,
      country: town.country,
    };
  });
}

/**
 * Reorders an exhaustive picker key list so broader place names (strict subset of another row’s
 * name words) appear before narrower ones. Only for full shortlists where every match is shown
 * (search UI: `overflowCount === 0`).
 */
export function sortTownPickerExhaustiveResultKeys(
  resultKeys: readonly string[],
  townsById: ReadonlyMap<string, Town>,
): string[] {
  if (resultKeys.length <= 1) {
    return [...resultKeys];
  }
  const rows = buildVisibleTownRowsFromKeys(resultKeys, townsById);
  const { labels } = buildTownPickerVisiblePresentation(rows);
  const idx = resultKeys.map((_, i) => i);
  idx.sort((i, j) =>
    compareTownPickerExhaustiveRowOrder(rows[i].name, rows[j].name, labels[i], labels[j]),
  );
  return idx.map((i) => resultKeys[i]);
}
