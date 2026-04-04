import { describe, expect, it } from 'vitest';
import { bakedTowns, hydrateTownsCompact, type Town } from './bakedTowns';

describe('hydrateTownsCompact', () => {
  it('hydrates a minimal valid document', () => {
    const doc = {
      v: 1,
      columns: [
        'id',
        'name',
        'lat',
        'lon',
        'localType',
        'county',
        'postcodeDistrict',
        'region',
        'country',
      ],
      rows: [
        [
          'id-1',
          'Testville',
          51.5,
          -0.1,
          'Town',
          '',
          'AB1',
          'London',
          'England',
        ],
      ],
    };
    const towns = hydrateTownsCompact(doc);
    expect(towns).toHaveLength(1);
    expect(towns[0]).toEqual<Town>({
      id: 'id-1',
      name: 'Testville',
      lat: 51.5,
      lon: -0.1,
      localType: 'Town',
      county: '',
      postcodeDistrict: 'AB1',
      region: 'London',
      country: 'England',
    });
  });

  it('accepts columns in non-canonical order when all required names exist', () => {
    const doc = {
      v: 1,
      columns: [
        'country',
        'name',
        'id',
        'lat',
        'lon',
        'localType',
        'county',
        'postcodeDistrict',
        'region',
      ],
      rows: [['England', 'X', 'i', 1, 2, 'Town', '', 'P1', 'Eastern']],
    };
    const towns = hydrateTownsCompact(doc);
    expect(towns[0]?.id).toBe('i');
    expect(towns[0]?.name).toBe('X');
    expect(towns[0]?.lat).toBe(1);
    expect(towns[0]?.lon).toBe(2);
  });

  it('rejects unsupported v', () => {
    expect(() =>
      hydrateTownsCompact({
        v: 2,
        columns: [
          'id',
          'name',
          'lat',
          'lon',
          'localType',
          'county',
          'postcodeDistrict',
          'region',
          'country',
        ],
        rows: [],
      }),
    ).toThrow(/unsupported v/);
  });

  it('rejects missing column', () => {
    expect(() =>
      hydrateTownsCompact({
        v: 1,
        columns: ['id', 'name'],
        rows: [],
      }),
    ).toThrow(/missing column/);
  });

  it('rejects non-finite numeric fields', () => {
    const base = {
      v: 1 as const,
      columns: [
        'id',
        'name',
        'lat',
        'lon',
        'localType',
        'county',
        'postcodeDistrict',
        'region',
        'country',
      ],
    };
    expect(() =>
      hydrateTownsCompact({
        ...base,
        rows: [['i', 'N', Number.NaN, 0, 'Town', '', 'P1', 'R', 'England']],
      }),
    ).toThrow(/finite number/);
    expect(() =>
      hydrateTownsCompact({
        ...base,
        rows: [['i', 'N', Infinity, 0, 'Town', '', 'P1', 'R', 'England']],
      }),
    ).toThrow(/finite number/);
  });
});

describe('bakedTowns', () => {
  it('hydrates the committed towns.compact.json', () => {
    expect(bakedTowns.length).toBe(1424);
    const first = bakedTowns[0];
    expect(first).toMatchObject({
      id: expect.stringMatching(/^osgb/),
      name: expect.any(String),
      lat: expect.any(Number),
      lon: expect.any(Number),
      localType: expect.stringMatching(/^(Town|City)$/),
      county: expect.any(String),
      postcodeDistrict: expect.any(String),
      region: expect.any(String),
      country: expect.stringMatching(/^(England|Scotland|Wales)$/),
    });
  });
});
