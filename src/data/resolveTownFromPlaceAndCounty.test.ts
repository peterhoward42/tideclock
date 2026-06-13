import { describe, expect, it } from 'vitest';
import type { Town } from './townSchema';
import { resolveTownByPlaceAndCounty } from './resolveTownFromPlaceAndCounty';

function town(overrides: Partial<Town> & Pick<Town, 'name' | 'county'>): Town {
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

describe('resolveTownByPlaceAndCounty', () => {
  const corpus: readonly Town[] = [
    town({ name: 'Looe', county: 'Cornwall' }),
    town({ name: 'Whitby', county: 'North Yorkshire' }),
    town({ name: 'Duplicate Place', county: 'Testshire' }),
    town({ name: 'Duplicate Place', county: 'Testshire' }),
  ];

  it('finds a unique normalized match', () => {
    expect(resolveTownByPlaceAndCounty('looe', 'cornwall', corpus)).toEqual({
      kind: 'found',
      town: corpus[0],
    });
    expect(
      resolveTownByPlaceAndCounty('  Whitby  ', 'North   Yorkshire', corpus),
    ).toEqual({
      kind: 'found',
      town: corpus[1],
    });
  });

  it('returns unknown when no row matches', () => {
    expect(resolveTownByPlaceAndCounty('Skegness', 'Lincolnshire', corpus)).toEqual({
      kind: 'unknown',
    });
  });

  it('returns ambiguous when multiple rows match', () => {
    expect(
      resolveTownByPlaceAndCounty('duplicate place', 'testshire', corpus),
    ).toEqual({
      kind: 'ambiguous',
      count: 2,
    });
  });
});
