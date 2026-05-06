import { describe, expect, it } from 'vitest';
import { formatTownPickerPrimary, formatTownPickerQualified } from './townPickerDisplay';

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
});
