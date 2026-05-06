import {
  formatTownPickerPrimary,
  formatTownPickerQualified,
  type TownPickerDisplayParts,
} from '../data/townPickerDisplay';
import type { Town } from '../data/townSchema';

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
