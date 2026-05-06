/**
 * Search-space queryer: match rows whose text contains every space-delimited fragment.
 * Kind: Pure location/search helper; holds search and display columns in lockstep.
 */

export type SearchSpaceQueryResult = {
  /** Matched lines from the search space (same order as returned). */
  results: string[];
  /** Same as `results.length`. */
  count: number;
  /** Display strings for each matched row (same indices as `results`). */
  displayNames: string[];
  /**
   * Optional row keys when the queryer was constructed with {@link SearchSpaceQueryer}'s
   * `keySpace`; empty when keys were not configured.
   */
  resultKeys: string[];
};

export type SearchSpaceQueryProfileState =
  | 'focused'
  | 'broad'
  | 'ambiguous'
  | 'broad_ambiguous';

export type SearchSpaceQueryProfile = {
  /** Lowercased query terms after trim/split normalization. */
  terms: string[];
  /** Same as `terms.length`. */
  termCount: number;
};

/** Profile-first response shape used by new callers. */
export type SearchSpaceProfiledQueryResult = {
  /** Visible rows and aligned metadata (same semantics as legacy result). */
  rows: SearchSpaceQueryResult & {
    /** Full number of matched rows across the whole search space. */
    matchesTotal: number;
    /** `matchesTotal - visibleCount` (never negative). */
    overflowCount: number;
    /** Same as `count`, included to keep row metrics self-describing. */
    visibleCount: number;
  };
  profile: SearchSpaceQueryProfile;
  /**
   * Coarse state for policy branching. Collisions are not yet modeled in this
   * first migration step, so state is overflow-driven only.
   */
  state: SearchSpaceQueryProfileState;
};

/** Same row pairing as {@link SearchSpaceQueryResult}, plus total-match metadata for UX copy. */
export type SearchSpaceQueryWithTotalCap = SearchSpaceQueryResult & {
  /**
   * Number of matching rows observed while scanning, stopped at `matchCountCeiling`.
   * If `totalHitCountCeiling` is true, the true total is **at least** this value.
   */
  totalMatchingRows: number;
  /** True when scanning stopped because `matchCountCeiling` matches were seen. */
  totalHitCountCeiling: boolean;
};

function splitQueryIntoSearchFragments(query: string): string[] {
  const trimmed = query.trim();
  if (trimmed === '') {
    return [];
  }
  return trimmed.split(/\s+/);
}

export class SearchSpaceQueryer {
  private readonly searchSpace: readonly string[];

  /** Lowercased search lines, aligned with `searchSpace` for case-insensitive matching. */
  private readonly searchSpaceLower: readonly string[];

  private readonly displaySpace: readonly string[];

  private readonly keySpace: readonly string[] | undefined;

  constructor(
    searchSpace: readonly string[],
    displaySpace: readonly string[],
    keySpace?: readonly string[],
  ) {
    if (searchSpace.length !== displaySpace.length) {
      throw new RangeError(
        `searchSpace and displaySpace must have the same length (got ${searchSpace.length} and ${displaySpace.length})`,
      );
    }
    if (keySpace !== undefined && keySpace.length !== searchSpace.length) {
      throw new RangeError(
        `keySpace must match searchSpace length (got ${keySpace.length} and ${searchSpace.length})`,
      );
    }
    this.searchSpace = searchSpace;
    this.searchSpaceLower = searchSpace.map((line) => line.toLowerCase());
    this.displaySpace = displaySpace;
    this.keySpace = keySpace;
  }

  /**
   * Cleans the query string into space-delimited fragments, then returns up to
   * `maxResults` rows that contain every fragment (case-insensitive substring).
   */
  query(queryString: string, maxResults: number): SearchSpaceQueryResult {
    if (maxResults < 0) {
      throw new RangeError('maxResults must be non-negative');
    }
    const profiled = this.queryProfiled(queryString, maxResults);
    return {
      results: profiled.rows.results,
      count: profiled.rows.count,
      displayNames: profiled.rows.displayNames,
      resultKeys: profiled.rows.resultKeys,
    };
  }

  /**
   * Canonical profiled query path: always scans the full search space to
   * produce both visible rows and full-match totals from one pass.
   */
  queryProfiled(
    queryString: string,
    maxResults: number,
  ): SearchSpaceProfiledQueryResult {
    if (maxResults < 0) {
      throw new RangeError('maxResults must be non-negative');
    }
    const terms = splitQueryIntoSearchFragments(queryString).map((f) =>
      f.toLowerCase(),
    );
    const results: string[] = [];
    const displayNames: string[] = [];
    const resultKeys: string[] = [];
    let matchesTotal = 0;

    for (let i = 0; i < this.searchSpace.length; i += 1) {
      const haystack = this.searchSpaceLower[i];
      if (!terms.every((frag) => haystack.includes(frag))) {
        continue;
      }
      matchesTotal += 1;
      if (results.length < maxResults) {
        results.push(this.searchSpace[i]);
        displayNames.push(this.displaySpace[i]);
        if (this.keySpace !== undefined) {
          resultKeys.push(this.keySpace[i]);
        }
      }
    }

    const visibleCount = results.length;
    const overflowCount = Math.max(0, matchesTotal - visibleCount);

    return {
      rows: {
        results,
        count: visibleCount,
        displayNames,
        resultKeys,
        visibleCount,
        matchesTotal,
        overflowCount,
      },
      profile: {
        terms,
        termCount: terms.length,
      },
      state: overflowCount > 0 ? 'broad' : 'focused',
    };
  }

  /**
   * Like {@link query}, but also counts how many rows match, stopping the scan once
   * `matchCountCeiling` matches have been seen. Use a ceiling greater than `maxResults`
   * so the UI can say “more than N” when the cap is hit.
   */
  queryWithResultCapAndMatchCeiling(
    queryString: string,
    maxResults: number,
    matchCountCeiling: number,
  ): SearchSpaceQueryWithTotalCap {
    if (matchCountCeiling < 0) {
      throw new RangeError('matchCountCeiling must be non-negative');
    }
    if (matchCountCeiling < maxResults) {
      throw new RangeError('matchCountCeiling must be >= maxResults');
    }
    const profiled = this.queryProfiled(queryString, maxResults);
    const totalMatchingRows = Math.min(profiled.rows.matchesTotal, matchCountCeiling);
    const totalHitCountCeiling = profiled.rows.matchesTotal >= matchCountCeiling;

    return {
      results: profiled.rows.results,
      count: profiled.rows.count,
      displayNames: profiled.rows.displayNames,
      resultKeys: profiled.rows.resultKeys,
      totalMatchingRows,
      totalHitCountCeiling,
    };
  }
}
