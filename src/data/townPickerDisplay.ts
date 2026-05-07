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

/**
 * Step-back picker row format: canonical place plus county, with optional one-step
 * extra qualifier only when duplicate labels still collide.
 */
export function buildTownPickerStepbackLabels(
  towns: readonly Town[],
): ReadonlyMap<string, string> {
  const baseCounts = new Map<string, number>();
  for (const town of towns) {
    const base = `${town.name} — ${town.county}`;
    baseCounts.set(base, (baseCounts.get(base) ?? 0) + 1);
  }

  const labels = new Map<string, string>();
  for (const town of towns) {
    const base = `${town.name} — ${town.county}`;
    if ((baseCounts.get(base) ?? 0) <= 1) {
      labels.set(town.id, base);
      continue;
    }
    labels.set(town.id, `${base} — ${town.localType}`);
  }
  return labels;
}
