import { describe, expect, it } from 'vitest';
import {
  buildTownPickerStepbackLabels,
  formatTownPickerPrimary,
  formatTownPickerQualified,
} from './townPickerDisplay';
import { townPickerRowKey } from './townSchema';

describe('townPickerDisplay', () => {
  it('formats a qualified picker label from structured town fields', () => {
    expect(
      formatTownPickerQualified({
        name: 'Looe',
        county: 'Cornwall',
        country: 'England',
      }),
    ).toBe('Looe (Cornwall, England)');
  });

  it('formats a primary-only picker label from town name', () => {
    expect(formatTownPickerPrimary({ name: 'Looe' })).toBe('Looe');
  });

  it('formats step-back labels as name and county by default', () => {
    const town = {
      name: 'Looe',
      county: 'Cornwall',
      localType: 'town',
      lat: 50.35,
      lon: -4.45,
    } as const;
    const labels = buildTownPickerStepbackLabels([town]);
    expect(labels.get(townPickerRowKey(town))).toBe('Looe — Cornwall');
  });

  it('adds local type only when name/county duplicate labels collide', () => {
    const townA = {
      name: 'Newport',
      county: 'Isle of Wight',
      localType: 'town',
      lat: 50.7,
      lon: -1.3,
    } as const;
    const townB = {
      name: 'Newport',
      county: 'Isle of Wight',
      localType: 'village',
      lat: 50.71,
      lon: -1.31,
    } as const;
    const labels = buildTownPickerStepbackLabels([townA, townB]);
    expect(labels.get(townPickerRowKey(townA))).toBe('Newport — Isle of Wight — town');
    expect(labels.get(townPickerRowKey(townB))).toBe('Newport — Isle of Wight — village');
  });
});
