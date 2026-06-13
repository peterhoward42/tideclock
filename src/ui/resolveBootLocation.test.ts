import { describe, expect, it } from 'vitest';
import { defaultTideLocationTown, bakedTowns2 } from '../data/bakedTowns2';
import type { Town } from '../data/townSchema';
import { resolveBootLocation } from './resolveBootLocation';

function storedTown(overrides: Partial<Town> & Pick<Town, 'name' | 'county'>): Town {
  return {
    lat: 50,
    lon: -4,
    localType: 'town',
    postcodeDistrict: '',
    region: '',
    country: 'England',
    ...overrides,
  };
}

describe('resolveBootLocation', () => {
  const defaultTown = defaultTideLocationTown;
  const looe = defaultTown;

  it('prefers a valid URL place over stored town', () => {
    const stored = storedTown({ name: 'Skegness', county: 'Lincolnshire' });
    expect(
      resolveBootLocation({
        search: '?place=Looe&county=Cornwall',
        storedTown: stored,
        defaultTown,
        towns: bakedTowns2,
      }),
    ).toEqual({
      kind: 'fromUrl',
      town: looe,
      showExplainer: false,
    });
  });

  it('shows explainer for first visit with a valid URL place', () => {
    expect(
      resolveBootLocation({
        search: '?place=Looe&county=Cornwall',
        storedTown: undefined,
        defaultTown,
        towns: bakedTowns2,
      }),
    ).toEqual({
      kind: 'fromUrl',
      town: looe,
      showExplainer: true,
    });
  });

  it('uses storage when URL params are absent', () => {
    const stored = storedTown({ name: 'Looe', county: 'Cornwall' });
    expect(
      resolveBootLocation({
        search: '',
        storedTown: stored,
        defaultTown,
        towns: bakedTowns2,
      }),
    ).toEqual({ kind: 'fromStorage', town: stored });
  });

  it('falls back to default with explainer when storage and URL are absent', () => {
    expect(
      resolveBootLocation({
        search: '',
        storedTown: undefined,
        defaultTown,
        towns: bakedTowns2,
      }),
    ).toEqual({
      kind: 'default',
      town: defaultTown,
      showExplainer: true,
    });
  });

  it('returns urlError for partial params', () => {
    expect(
      resolveBootLocation({
        search: '?place=Looe',
        storedTown: undefined,
        defaultTown,
        towns: bakedTowns2,
      }),
    ).toEqual({
      kind: 'urlError',
      error: { reason: 'missing_param', place: 'Looe', county: null },
    });
  });

  it('returns urlError for unknown place', () => {
    expect(
      resolveBootLocation({
        search: '?place=Nowhere&county=Cornwall',
        storedTown: undefined,
        defaultTown,
        towns: bakedTowns2,
      }),
    ).toEqual({
      kind: 'urlError',
      error: {
        reason: 'unknown',
        place: 'Nowhere',
        county: 'Cornwall',
      },
    });
  });

  it('returns urlError for ambiguous corpus pairs', () => {
    const ambiguousCorpus: readonly Town[] = [
      storedTown({ name: 'Duplicate Place', county: 'Testshire' }),
      storedTown({ name: 'Duplicate Place', county: 'Testshire' }),
    ];
    const result = resolveBootLocation({
      search: '?place=Duplicate%20Place&county=Testshire',
      storedTown: undefined,
      defaultTown,
      towns: ambiguousCorpus,
    });
    expect(result.kind).toBe('urlError');
    if (result.kind === 'urlError') {
      expect(result.error.reason).toBe('ambiguous');
    }
  });
});
