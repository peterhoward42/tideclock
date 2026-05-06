import { describe, expect, it } from 'vitest';
import { SearchSpaceQueryer } from './searchSpaceQueryer';

describe('SearchSpaceQueryer', () => {
  it('rejects search and display lists of different lengths', () => {
    expect(
      () => new SearchSpaceQueryer(['a'], ['x', 'y']),
    ).toThrowError(RangeError);
  });

  it('rejects keySpace when its length does not match searchSpace', () => {
    expect(
      () => new SearchSpaceQueryer(['a', 'b'], ['A', 'B'], ['k1']),
    ).toThrowError(RangeError);
  });

  it('rejects primarySpace when its length does not match searchSpace', () => {
    expect(
      () => new SearchSpaceQueryer(['a', 'b'], ['A', 'B'], ['k0', 'k1'], ['p0']),
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
        resultKeys: [],
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
      resultKeys: [],
    });
  });

  it('matches fragments case-insensitively', () => {
    const q = new SearchSpaceQueryer(['MixedCase Place'], ['disp']);
    expect(q.query('mixed place', 5)).toEqual({
      results: ['MixedCase Place'],
      count: 1,
      displayNames: ['disp'],
      resultKeys: [],
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
      resultKeys: [],
    });
  });

  it('returns maxResults zero as an empty result', () => {
    const q = new SearchSpaceQueryer(['any'], ['d']);
    expect(q.query('any', 0)).toEqual({
      results: [],
      count: 0,
      displayNames: [],
      resultKeys: [],
    });
  });

  it('requires every space-delimited token to appear in the search line', () => {
    const q = new SearchSpaceQueryer(['x y z', 'x y'], ['A', 'B']);
    expect(q.query('y z', 5)).toEqual({
      results: ['x y z'],
      count: 1,
      displayNames: ['A'],
      resultKeys: [],
    });
  });

  it('returns resultKeys aligned with results when keySpace was provided', () => {
    const q = new SearchSpaceQueryer(['alpha', 'beta'], ['A', 'B'], ['k0', 'k1']);
    expect(q.query('beta', 5)).toEqual({
      results: ['beta'],
      count: 1,
      displayNames: ['B'],
      resultKeys: ['k1'],
    });
  });

  it('rejects matchCountCeiling below maxResults', () => {
    const q = new SearchSpaceQueryer(['a', 'b'], ['A', 'B']);
    expect(() => q.queryWithResultCapAndMatchCeiling('a', 2, 1)).toThrowError(RangeError);
  });

  it('reports exact total when matches stay under the match ceiling', () => {
    const q = new SearchSpaceQueryer(
      ['alpha one', 'alpha two', 'beta one'],
      ['a1', 'a2', 'b1'],
    );
    expect(q.queryWithResultCapAndMatchCeiling('alpha', 2, 10)).toEqual({
      results: ['alpha one', 'alpha two'],
      count: 2,
      displayNames: ['a1', 'a2'],
      resultKeys: [],
      totalMatchingRows: 2,
      totalHitCountCeiling: false,
    });
  });

  it('stops counting at matchCountCeiling and sets totalHitCountCeiling', () => {
    const search = ['a', 'a', 'a', 'a', 'a'];
    const display = ['1', '2', '3', '4', '5'];
    const q = new SearchSpaceQueryer(search, display);
    const r = q.queryWithResultCapAndMatchCeiling('a', 2, 4);
    expect(r.results).toEqual(['a', 'a']);
    expect(r.count).toBe(2);
    expect(r.displayNames).toEqual(['1', '2']);
    expect(r.totalMatchingRows).toBe(4);
    expect(r.totalHitCountCeiling).toBe(true);
    expect(r.resultKeys).toEqual([]);
  });

  it('queryProfiled returns visible rows plus full-match totals', () => {
    const q = new SearchSpaceQueryer(
      ['alpha one', 'alpha two', 'alpha three', 'beta'],
      ['a1', 'a2', 'a3', 'b1'],
      ['k1', 'k2', 'k3', 'k4'],
    );
    expect(q.queryProfiled('alpha', 2)).toEqual({
      rows: {
        results: ['alpha one', 'alpha two'],
        count: 2,
        displayNames: ['a1', 'a2'],
        resultKeys: ['k1', 'k2'],
        visibleCount: 2,
        matchesTotal: 3,
        overflowCount: 1,
      },
      profile: {
        terms: ['alpha'],
        termCount: 1,
        visiblePrimaryCollisions: {
          duplicateNormalizedPrimaryCount: 0,
          collidingRowCount: 0,
          rowCount: 2,
        },
        fullPrimaryCollisions: {
          duplicateNormalizedPrimaryCount: 0,
          collidingRowCount: 0,
          rowCount: 3,
        },
        exactPrimaryCollisionGroups: [],
        collisionDensityVisible: 0,
        collisionDensityFull: 0,
        termSelectivity: [{ termIndex: 0, term: 'alpha', cumulativeMatchCount: 3 }],
      },
      state: 'broad',
    });
  });

  it('queryProfiled derives focused state when there is no overflow', () => {
    const q = new SearchSpaceQueryer(['alpha one', 'beta'], ['a1', 'b1']);
    expect(q.queryProfiled('alpha', 5).state).toBe('focused');
  });

  it('queryProfiled marks ambiguous when duplicate primaries appear in full match set', () => {
    const q = new SearchSpaceQueryer(
      ['x a', 'y a', 'z'],
      ['d0', 'd1', 'd2'],
      ['k0', 'k1', 'k2'],
      ['Dup', 'Dup', 'Solo'],
    );
    const r = q.queryProfiled('a', 5);
    expect(r.rows.matchesTotal).toBe(2);
    expect(r.profile.fullPrimaryCollisions).toEqual({
      duplicateNormalizedPrimaryCount: 1,
      collidingRowCount: 2,
      rowCount: 2,
    });
    expect(r.profile.collisionDensityFull).toBe(1);
    expect(r.state).toBe('ambiguous');
  });

  it('queryProfiled is broad_ambiguous when overflow hides duplicate primaries', () => {
    const q = new SearchSpaceQueryer(
      ['hit a', 'hit a', 'hit a', 'hit b'],
      ['d0', 'd1', 'd2', 'd3'],
      undefined,
      ['Same', 'Same', 'Same', 'Other'],
    );
    const r = q.queryProfiled('hit', 2);
    expect(r.rows.overflowCount).toBe(2);
    expect(r.profile.fullPrimaryCollisions.collidingRowCount).toBe(3);
    expect(r.state).toBe('broad_ambiguous');
  });
});
