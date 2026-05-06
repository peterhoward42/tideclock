/**
 * Pure query/result profiling for {@link SearchSpaceQueryer} profiled responses.
 * Kind: deterministic metrics from terms + matched row indices + aligned primary labels.
 */

import { normalizeTownPickerPrimary } from './townPickerDisambiguation';

export type SearchSpaceQueryProfileState =
  | 'focused'
  | 'broad'
  | 'ambiguous'
  | 'broad_ambiguous';

/** Collision counts for a set of matched rows (by search-space index). */
export type PrimaryCollisionStats = {
  /** Normalized primaries that appear two or more times in the set. */
  readonly duplicateNormalizedPrimaryCount: number;
  /** Rows that belong to a duplicate-primary group (size ≥ 2). */
  readonly collidingRowCount: number;
  readonly rowCount: number;
};

export type ExactPrimaryCollisionGroup = {
  readonly normalizedPrimary: string;
  /** Query term equal to `normalizedPrimary` (same normalization as search fragments). */
  readonly matchingTerm: string;
  readonly rowCount: number;
};

export type TermSelectivity = {
  readonly termIndex: number;
  readonly term: string;
  /** Rows whose search line contains terms[0] ∧ … ∧ terms[termIndex]. */
  readonly cumulativeMatchCount: number;
};

export type SearchSpaceQueryProfile = {
  readonly terms: string[];
  readonly termCount: number;
  readonly visiblePrimaryCollisions: PrimaryCollisionStats;
  readonly fullPrimaryCollisions: PrimaryCollisionStats;
  readonly exactPrimaryCollisionGroups: ExactPrimaryCollisionGroup[];
  readonly collisionDensityVisible: number;
  readonly collisionDensityFull: number;
  readonly termSelectivity: TermSelectivity[];
};

function collisionStatsWithoutPrimary(rowCount: number): PrimaryCollisionStats {
  return {
    duplicateNormalizedPrimaryCount: 0,
    collidingRowCount: 0,
    rowCount,
  };
}

function collisionDensity(collidingRowCount: number, rowCount: number): number {
  if (rowCount === 0) {
    return 0;
  }
  return collidingRowCount / rowCount;
}

function primaryCollisionStatsForIndices(
  indices: readonly number[],
  primarySpace: readonly string[],
): PrimaryCollisionStats {
  if (indices.length === 0) {
    return collisionStatsWithoutPrimary(0);
  }
  const counts = new Map<string, number>();
  for (const i of indices) {
    const p = normalizeTownPickerPrimary(primarySpace[i] ?? '');
    counts.set(p, (counts.get(p) ?? 0) + 1);
  }
  let duplicateNormalizedPrimaryCount = 0;
  let collidingRowCount = 0;
  for (const n of counts.values()) {
    if (n > 1) {
      duplicateNormalizedPrimaryCount += 1;
      collidingRowCount += n;
    }
  }
  return {
    duplicateNormalizedPrimaryCount,
    collidingRowCount,
    rowCount: indices.length,
  };
}

function exactPrimaryCollisionGroupsForIndices(
  indices: readonly number[],
  primarySpace: readonly string[],
  terms: readonly string[],
): ExactPrimaryCollisionGroup[] {
  if (indices.length === 0 || terms.length === 0) {
    return [];
  }
  const termSet = new Set(terms);
  const byPrimary = new Map<string, number>();
  for (const i of indices) {
    const p = normalizeTownPickerPrimary(primarySpace[i] ?? '');
    byPrimary.set(p, (byPrimary.get(p) ?? 0) + 1);
  }
  const out: ExactPrimaryCollisionGroup[] = [];
  for (const [normalizedPrimary, rowCount] of byPrimary) {
    if (rowCount <= 1) {
      continue;
    }
    if (!termSet.has(normalizedPrimary)) {
      continue;
    }
    out.push({ normalizedPrimary, matchingTerm: normalizedPrimary, rowCount });
  }
  return out.sort((a, b) => a.normalizedPrimary.localeCompare(b.normalizedPrimary));
}

/** AND-prefix match counts over the full search space (for selectivity). */
export function computeTermSelectivity(
  searchSpaceLower: readonly string[],
  terms: readonly string[],
): TermSelectivity[] {
  const out: TermSelectivity[] = [];
  for (let k = 0; k < terms.length; k += 1) {
    let cumulativeMatchCount = 0;
    for (let i = 0; i < searchSpaceLower.length; i += 1) {
      const haystack = searchSpaceLower[i];
      let ok = true;
      for (let j = 0; j <= k; j += 1) {
        if (!haystack.includes(terms[j])) {
          ok = false;
          break;
        }
      }
      if (ok) {
        cumulativeMatchCount += 1;
      }
    }
    out.push({ termIndex: k, term: terms[k], cumulativeMatchCount });
  }
  return out;
}

export function deriveSearchProfileState(
  overflowCount: number,
  collisionDensityFull: number,
  matchesTotal: number,
): SearchSpaceQueryProfileState {
  if (matchesTotal === 0) {
    return 'focused';
  }
  const highOverflow = overflowCount > 0;
  const highAmbiguity = collisionDensityFull > 0;
  if (highOverflow && highAmbiguity) {
    return 'broad_ambiguous';
  }
  if (highOverflow) {
    return 'broad';
  }
  if (highAmbiguity) {
    return 'ambiguous';
  }
  return 'focused';
}

export function buildSearchSpaceQueryProfile(args: {
  readonly terms: readonly string[];
  readonly searchSpaceLower: readonly string[];
  readonly fullMatchIndices: readonly number[];
  readonly visibleMatchIndices: readonly number[];
  readonly primarySpace: readonly string[] | undefined;
}): SearchSpaceQueryProfile {
  const terms = [...args.terms];
  const termCount = terms.length;
  const primarySpace = args.primarySpace;

  const visiblePrimaryCollisions =
    primarySpace === undefined
      ? collisionStatsWithoutPrimary(args.visibleMatchIndices.length)
      : primaryCollisionStatsForIndices(args.visibleMatchIndices, primarySpace);
  const fullPrimaryCollisions =
    primarySpace === undefined
      ? collisionStatsWithoutPrimary(args.fullMatchIndices.length)
      : primaryCollisionStatsForIndices(args.fullMatchIndices, primarySpace);
  const exactPrimaryCollisionGroups =
    primarySpace === undefined
      ? []
      : exactPrimaryCollisionGroupsForIndices(args.fullMatchIndices, primarySpace, terms);

  const collisionDensityVisible = collisionDensity(
    visiblePrimaryCollisions.collidingRowCount,
    visiblePrimaryCollisions.rowCount,
  );
  const collisionDensityFull = collisionDensity(
    fullPrimaryCollisions.collidingRowCount,
    fullPrimaryCollisions.rowCount,
  );

  return {
    terms,
    termCount,
    visiblePrimaryCollisions,
    fullPrimaryCollisions,
    exactPrimaryCollisionGroups,
    collisionDensityVisible,
    collisionDensityFull,
    termSelectivity: computeTermSelectivity(args.searchSpaceLower, terms),
  };
}
