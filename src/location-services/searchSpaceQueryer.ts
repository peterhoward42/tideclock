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

  constructor(searchSpace: readonly string[], displaySpace: readonly string[]) {
    if (searchSpace.length !== displaySpace.length) {
      throw new RangeError(
        `searchSpace and displaySpace must have the same length (got ${searchSpace.length} and ${displaySpace.length})`,
      );
    }
    this.searchSpace = searchSpace;
    this.searchSpaceLower = searchSpace.map((line) => line.toLowerCase());
    this.displaySpace = displaySpace;
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

    for (let i = 0; i < this.searchSpace.length && results.length < maxResults; i += 1) {
      const haystack = this.searchSpaceLower[i];
      if (lowerFragments.every((frag) => haystack.includes(frag))) {
        results.push(this.searchSpace[i]);
        displayNames.push(this.displaySpace[i]);
      }
    }

    return {
      results,
      count: results.length,
      displayNames,
    };
  }
}
