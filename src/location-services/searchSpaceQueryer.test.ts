import { describe, expect, it } from 'vitest';
import { SearchSpaceQueryer } from './searchSpaceQueryer';

describe('SearchSpaceQueryer', () => {
  it('rejects search and display lists of different lengths', () => {
    expect(
      () => new SearchSpaceQueryer(['a'], ['x', 'y']),
    ).toThrowError(RangeError);
  });

  it('rejects negative maxResults', () => {
    const q = new SearchSpaceQueryer(['a'], ['A']);
    expect(() => q.query('a', -1)).toThrowError(RangeError);
  });

  it('treats an empty or whitespace-only query as zero fragments (vacuous match), capped by maxResults', () => {
    const q = new SearchSpaceQueryer(['row0', 'row1', 'row2'], ['d0', 'd1', 'd2']);
    for (const empty of ['', '   ', '\t\n']) {
      expect(q.query(empty, 2)).toEqual({
        results: ['row0', 'row1'],
        count: 2,
        displayNames: ['d0', 'd1'],
      });
    }
  });

  it('splits the query on whitespace after trim and requires every fragment as a substring', () => {
    const q = new SearchSpaceQueryer(
      ['Aberdeen Harbour', 'Harbour View', 'Inner Harbour'],
      ['ab', 'hv', 'ih'],
    );
    expect(q.query('  harbour  inner  ', 10)).toEqual({
      results: ['Inner Harbour'],
      count: 1,
      displayNames: ['ih'],
    });
  });

  it('matches fragments case-insensitively', () => {
    const q = new SearchSpaceQueryer(['MixedCase Place'], ['disp']);
    expect(q.query('mixed place', 5)).toEqual({
      results: ['MixedCase Place'],
      count: 1,
      displayNames: ['disp'],
    });
  });

  it('returns no more than maxResults matches and pairs display names by row index', () => {
    const q = new SearchSpaceQueryer(
      ['alpha one', 'alpha two', 'beta one'],
      ['a1', 'a2', 'b1'],
    );
    expect(q.query('alpha', 2)).toEqual({
      results: ['alpha one', 'alpha two'],
      count: 2,
      displayNames: ['a1', 'a2'],
    });
  });

  it('returns maxResults zero as an empty result', () => {
    const q = new SearchSpaceQueryer(['any'], ['d']);
    expect(q.query('any', 0)).toEqual({
      results: [],
      count: 0,
      displayNames: [],
    });
  });

  it('requires every space-delimited token to appear in the search line', () => {
    const q = new SearchSpaceQueryer(['x y z', 'x y'], ['A', 'B']);
    expect(q.query('y z', 5)).toEqual({
      results: ['x y z'],
      count: 1,
      displayNames: ['A'],
    });
  });
});
