import { describe, expect, it } from 'vitest';
import {
  bakedTowns2,
  defaultTideLocationTown,
  normalizeTownSearchText,
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
    expect(result.exactPrefixTownId).toBeNull();
    expect(result.narrowingAppends).toEqual([]);
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
    expect(result.exactPrefixTownId).toBeNull();
    expect(result.narrowingAppends).toEqual([]);
  });

  it('includes deterministic lexical append suggestions for broad sets', () => {
    const result = queryTowns2ByCountyAndNamePrefix('Cornwall', 'port');
    expect(result.bucket === 'many_matches' || result.bucket === 'too_many_matches').toBe(true);
    expect(result.narrowingAppends.length).toBeGreaterThan(0);
    expect(result.narrowingAppends.length).toBeLessThanOrEqual(5);
    expect(new Set(result.narrowingAppends).size).toBe(result.narrowingAppends.length);
    expect(result.narrowingAppends.every((append) => append.length > 0)).toBe(true);
    expect(
      result.narrowingAppends.every((append) => /^ [^\s]+$|^[^\s]$/.test(append)),
    ).toBe(true);
    expect(result.narrowingAppends.some((append) => append.startsWith(' '))).toBe(true);
  });

  it('surfaces an exact prefix town id even when the set is broad', () => {
    const result = queryTowns2ByCountyAndNamePrefix('Newport', 'newport');
    expect(result.bucket).toBe('many_matches');
    expect(result.exactPrefixTownId).not.toBeNull();
    const town = towns2ByTownId.get(result.exactPrefixTownId!);
    expect(town).toBeDefined();
    expect(town?.name.toLowerCase()).toBe('newport');
    expect(town?.county).toBe('Newport');
  });
});

describe('bakedTowns2 step-back supporting data', () => {
  it('ships a unique normalized name and county pair per town', () => {
    const seen = new Map<string, string>();
    for (const town of bakedTowns2) {
      const key = `${normalizeTownSearchText(town.name)}|${normalizeTownSearchText(town.county)}`;
      const priorId = seen.get(key);
      expect(priorId, `duplicate place+county: ${key} (${priorId}, ${town.id})`).toBeUndefined();
      seen.set(key, town.id);
    }
  });

  it('pins Looe, Cornwall as the default tide location', () => {
    expect(defaultTideLocationTown.name).toBe('Looe');
    expect(defaultTideLocationTown.county).toBe('Cornwall');
    expect(towns2ByTownId.get(defaultTideLocationTown.id)).toEqual(defaultTideLocationTown);
  });

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
