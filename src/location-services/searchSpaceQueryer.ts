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
    const fragments = splitQueryIntoSearchFragments(queryString).map((f) =>
      f.toLowerCase(),
    );
    return this.queryByFragments(fragments, maxResults);
  }

  /**
   * Returns rows from the search space that contain all fragments, stopping as soon
   * as `maxResults` matches have been collected.
   */
  private queryByFragments(
    lowerFragments: readonly string[],
    maxResults: number,
  ): SearchSpaceQueryResult {
    const results: string[] = [];
    const displayNames: string[] = [];
    const resultKeys: string[] = [];

    for (let i = 0; i < this.searchSpace.length && results.length < maxResults; i += 1) {
      const haystack = this.searchSpaceLower[i];
      if (lowerFragments.every((frag) => haystack.includes(frag))) {
        results.push(this.searchSpace[i]);
        displayNames.push(this.displaySpace[i]);
        if (this.keySpace !== undefined) {
          resultKeys.push(this.keySpace[i]);
        }
      }
    }

    return {
      results,
      count: results.length,
      displayNames,
      resultKeys,
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
    const fragments = splitQueryIntoSearchFragments(queryString).map((f) =>
      f.toLowerCase(),
    );
    const results: string[] = [];
    const displayNames: string[] = [];
    const resultKeys: string[] = [];
    let totalMatchingRows = 0;
    let totalHitCountCeiling = false;

    for (let i = 0; i < this.searchSpace.length; i += 1) {
      const haystack = this.searchSpaceLower[i];
      if (!fragments.every((frag) => haystack.includes(frag))) {
        continue;
      }
      totalMatchingRows += 1;
      if (results.length < maxResults) {
        results.push(this.searchSpace[i]);
        displayNames.push(this.displaySpace[i]);
        if (this.keySpace !== undefined) {
          resultKeys.push(this.keySpace[i]);
        }
      }
      if (totalMatchingRows >= matchCountCeiling) {
        totalHitCountCeiling = true;
        break;
      }
    }

    return {
      results,
      count: results.length,
      displayNames,
      resultKeys,
      totalMatchingRows,
      totalHitCountCeiling,
    };
  }
}
