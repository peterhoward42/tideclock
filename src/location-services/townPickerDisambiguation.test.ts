import { describe, expect, it } from 'vitest';
import {
  buildTownPickerVisiblePresentation,
  buildVisibleTownRowsFromKeys,
  normalizeTownPickerPrimary,
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
