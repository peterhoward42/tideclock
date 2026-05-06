import { describe, expect, it } from 'vitest';
import {
  buildTownPickerVisiblePresentation,
  buildVisibleTownRowsFromKeys,
  normalizeTownPickerPrimary,
  sortTownPickerExhaustiveResultKeys,
} from './townPickerDisambiguation';
import type { Town } from '../data/townSchema';

describe('normalizeTownPickerPrimary', () => {
  it.each([
    { input: 'Looe', want: 'looe' },
    { input: '  Looe  ', want: 'looe' },
    { input: 'WEST  LOOE', want: 'west  looe' },
  ])('normalizes "$input" to "$want"', ({ input, want }) => {
    expect(normalizeTownPickerPrimary(input)).toBe(want);
  });
});

describe('buildTownPickerVisiblePresentation', () => {
  it.each([
    {
      name: 'empty rows',
      rows: [],
      labels: [],
      showQualifier: [],
    },
    {
      name: 'no primary collisions in visible rows',
      rows: [
        { name: 'Looe', county: 'Cornwall', country: 'England' },
        { name: 'West Looe', county: 'Cornwall', country: 'England' },
      ],
      labels: ['Looe', 'West Looe'],
      showQualifier: [false, false],
    },
    {
      name: 'collision by case and trim',
      rows: [
        { name: 'Looe', county: 'Cornwall', country: 'England' },
        { name: '  looe  ', county: 'Devon', country: 'England' },
      ],
      labels: ['Looe (Cornwall, England)', '  looe   (Devon, England)'],
      showQualifier: [true, true],
    },
    {
      name: 'only colliding rows are qualified',
      rows: [
        { name: 'Looe', county: 'Cornwall', country: 'England' },
        { name: 'West Looe', county: 'Cornwall', country: 'England' },
        { name: 'looe', county: 'Devon', country: 'England' },
      ],
      labels: [
        'Looe (Cornwall, England)',
        'West Looe',
        'looe (Devon, England)',
      ],
      showQualifier: [true, false, true],
    },
  ])('$name', ({ rows, labels, showQualifier }) => {
    expect(buildTownPickerVisiblePresentation(rows)).toEqual({
      labels,
      showQualifier,
    });
  });
});

describe('buildVisibleTownRowsFromKeys', () => {
  const townA: Town = {
    id: 'a',
    name: 'Looe',
    lat: 0,
    lon: 0,
    localType: 'town',
    county: 'Cornwall',
    postcodeDistrict: 'PL13',
    region: 'South West',
    country: 'England',
  };
  const townB: Town = {
    id: 'b',
    name: 'West Looe',
    lat: 1,
    lon: 1,
    localType: 'town',
    county: 'Cornwall',
    postcodeDistrict: 'PL13',
    region: 'South West',
    country: 'England',
  };

  it('returns rows aligned to result key order', () => {
    const townsById = new Map<string, Town>([
      [townA.id, townA],
      [townB.id, townB],
    ]);
    expect(buildVisibleTownRowsFromKeys(['b', 'a'], townsById)).toEqual([
      {
        id: 'b',
        name: 'West Looe',
        county: 'Cornwall',
        country: 'England',
      },
      {
        id: 'a',
        name: 'Looe',
        county: 'Cornwall',
        country: 'England',
      },
    ]);
  });

  it('throws when any result key is missing', () => {
    const townsById = new Map<string, Town>([[townA.id, townA]]);
    expect(() => buildVisibleTownRowsFromKeys(['a', 'missing'], townsById)).toThrowError(
      'town key not found in townsById: missing',
    );
  });
});

function minimalTown(overrides: Partial<Town> & Pick<Town, 'id' | 'name'>): Town {
  return {
    lat: 0,
    lon: 0,
    localType: 'town',
    county: 'Cornwall',
    postcodeDistrict: 'PL1',
    region: 'South West',
    country: 'England',
    ...overrides,
  };
}

describe('sortTownPickerExhaustiveResultKeys', () => {
  it('returns a copy unchanged for 0 or 1 keys', () => {
    const byId = new Map<string, Town>();
    expect(sortTownPickerExhaustiveResultKeys([], byId)).toEqual([]);
    const one = minimalTown({ id: 'x', name: 'Solo' });
    const keys = ['x'];
    expect(sortTownPickerExhaustiveResultKeys(keys, new Map([['x', one]]))).toEqual(['x']);
    keys.push('y');
    expect(keys).toEqual(['x', 'y']);
  });

  it('orders strict name supersets after their subsets (Seaton family shape)', () => {
    const seaton = minimalTown({ id: 's', name: 'Seaton' });
    const foreshore = minimalTown({ id: 'f', name: 'Seaton foreshore' });
    const cliffs = minimalTown({ id: 'c', name: 'Seaton Cliffs' });
    const cliffsSssi = minimalTown({ id: 'csssi', name: 'Seaton Cliffs SSSI' });
    const byId = new Map<string, Town>([
      [cliffsSssi.id, cliffsSssi],
      [foreshore.id, foreshore],
      [seaton.id, seaton],
      [cliffs.id, cliffs],
    ]);
    const input = [cliffsSssi.id, foreshore.id, seaton.id, cliffs.id];
    expect(sortTownPickerExhaustiveResultKeys(input, byId)).toEqual([
      seaton.id,
      cliffs.id,
      foreshore.id,
      cliffsSssi.id,
    ]);
  });

  it('breaks ties among incomparable same-size names lexicographically', () => {
    const a = minimalTown({ id: 'a', name: 'Seaton foreshore' });
    const b = minimalTown({ id: 'b', name: 'Seaton harbour' });
    const byId = new Map<string, Town>([
      [b.id, b],
      [a.id, a],
    ]);
    expect(sortTownPickerExhaustiveResultKeys(['b', 'a'], byId)).toEqual(['a', 'b']);
  });

  it('uses full label when primary names collide', () => {
    const cornwall = minimalTown({
      id: 'c',
      name: 'Looe',
      county: 'Cornwall',
      country: 'England',
    });
    const devon = minimalTown({
      id: 'd',
      name: 'Looe',
      county: 'Devon',
      country: 'England',
    });
    const byId = new Map<string, Town>([
      [devon.id, devon],
      [cornwall.id, cornwall],
    ]);
    expect(sortTownPickerExhaustiveResultKeys(['d', 'c'], byId)).toEqual(['c', 'd']);
  });
});
