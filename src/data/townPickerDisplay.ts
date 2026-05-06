import type { Town } from './townSchema';

export type TownPickerDisplayParts = Pick<Town, 'name' | 'county' | 'country'>;

/** Current picker line format used by towns2 search results. */
export function formatTownPickerQualified(parts: TownPickerDisplayParts): string {
  return `${parts.name} (${parts.county}, ${parts.country})`;
}

/** Primary-only town label for picker rows that omit qualification. */
export function formatTownPickerPrimary(parts: Pick<Town, 'name'>): string {
  return parts.name;
}
