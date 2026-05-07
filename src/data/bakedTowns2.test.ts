import { describe, expect, it } from 'vitest';
import {
  bakedTowns2,
  queryTowns2ByCountyAndNamePrefix,
  towns2ByTownId,
  towns2Counties,
  towns2StepbackLabelsByTownId,
} from './bakedTowns2';

describe('bakedTowns2 step-back query', () => {
  it('requires at least the default minimum prefix length', () => {
    const result = queryTowns2ByCountyAndNamePrefix('', 'a');
    expect(result.bucket).toBe('need_input');
    expect(result.totalMatches).toBe(0);
    expect(result.visibleTownIds).toEqual([]);
  });

  it('filters by exact normalized county and canonical name prefix', () => {
    const sampleTown = bakedTowns2[0];
    const prefix = sampleTown.name.slice(0, 2).toUpperCase();
    const county = `  ${sampleTown.county.toLowerCase()}  `;
    const result = queryTowns2ByCountyAndNamePrefix(county, prefix);

    expect(result.visibleTownIds.length).toBeGreaterThan(0);
    expect(result.visibleTownIds).toContain(sampleTown.id);
    for (const townId of result.visibleTownIds) {
      const town = towns2ByTownId.get(townId);
      expect(town).toBeDefined();
      expect(town?.county).toBe(sampleTown.county);
      expect(town?.name.toLowerCase().startsWith(sampleTown.name.slice(0, 2).toLowerCase())).toBe(true);
    }
  });

  it('returns no_matches when no canonical name starts with prefix', () => {
    const result = queryTowns2ByCountyAndNamePrefix('', 'zzzzzzzzzz');
    expect(result.bucket).toBe('no_matches');
    expect(result.totalMatches).toBe(0);
    expect(result.visibleTownIds).toEqual([]);
  });
});

describe('bakedTowns2 step-back supporting data', () => {
  it('exposes sorted non-empty county options', () => {
    expect(towns2Counties.length).toBeGreaterThan(0);
    expect(towns2Counties.every((county) => county.trim() !== '')).toBe(true);
    expect([...towns2Counties].sort((a, b) => a.localeCompare(b))).toEqual(towns2Counties);
  });

  it('builds deterministic visible labels per town id', () => {
    const sampleTowns = bakedTowns2.slice(0, 10);
    for (const sampleTown of sampleTowns) {
      const label = towns2StepbackLabelsByTownId.get(sampleTown.id);
      expect(label).toBeDefined();
      expect(label).toContain(sampleTown.name);
      expect(label).toContain(sampleTown.county);
    }
  });
});
