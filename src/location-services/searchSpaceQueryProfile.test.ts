import { describe, expect, it } from 'vitest';
import {
  buildSearchSpaceQueryProfile,
  computeTermSelectivity,
  deriveSearchProfileState,
} from './searchSpaceQueryProfile';

describe('computeTermSelectivity', () => {
  it('counts cumulative AND matches for each term prefix', () => {
    const lower = ['a b', 'a c', 'b c'];
    expect(computeTermSelectivity(lower, ['a', 'c'])).toEqual([
      { termIndex: 0, term: 'a', cumulativeMatchCount: 2 },
      { termIndex: 1, term: 'c', cumulativeMatchCount: 1 },
    ]);
  });
});

describe('deriveSearchProfileState', () => {
  it('returns focused for zero matches', () => {
    expect(deriveSearchProfileState(0, 0, 0)).toBe('focused');
  });

  it('maps the four-way grid from overflow and full collision density', () => {
    expect(deriveSearchProfileState(0, 0, 3)).toBe('focused');
    expect(deriveSearchProfileState(1, 0, 3)).toBe('broad');
    expect(deriveSearchProfileState(0, 0.5, 2)).toBe('ambiguous');
    expect(deriveSearchProfileState(2, 0.25, 8)).toBe('broad_ambiguous');
  });
});

describe('buildSearchSpaceQueryProfile', () => {
  it('lists exact primary collision groups when a term equals a duplicated primary', () => {
    const profile = buildSearchSpaceQueryProfile({
      terms: ['lyme'],
      searchSpaceLower: [],
      fullMatchIndices: [0, 1],
      visibleMatchIndices: [0, 1],
      primarySpace: ['Lyme', 'Lyme'],
    });
    expect(profile.exactPrimaryCollisionGroups).toEqual([
      { normalizedPrimary: 'lyme', matchingTerm: 'lyme', rowCount: 2 },
    ]);
  });
});
