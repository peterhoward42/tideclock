import { describe, expect, it } from 'vitest';
import {
  buildTownPickerStepbackLabels,
  formatTownPickerPrimary,
  formatTownPickerQualified,
} from './townPickerDisplay';

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
    const labels = buildTownPickerStepbackLabels([
      {
        id: 'a',
        name: 'Looe',
        county: 'Cornwall',
        localType: 'town',
      } as const,
    ]);
    expect(labels.get('a')).toBe('Looe — Cornwall');
  });

  it('adds local type only when name/county duplicate labels collide', () => {
    const labels = buildTownPickerStepbackLabels([
      {
        id: 'a',
        name: 'Newport',
        county: 'Isle of Wight',
        localType: 'town',
      } as const,
      {
        id: 'b',
        name: 'Newport',
        county: 'Isle of Wight',
        localType: 'village',
      } as const,
    ]);
    expect(labels.get('a')).toBe('Newport — Isle of Wight — town');
    expect(labels.get('b')).toBe('Newport — Isle of Wight — village');
  });
});
