/**
 * clockSceneModel.ts — Presentation types for the clock face (static shell + tide instants on the dial).
 * Built from application inputs; consumed by division geometry, SVG mapping, and TideClock. Kind: Definition.
 * Does not fetch data or call diagram-generation.
 *
 * **Boundaries**
 * - {@link ClockDialShell} is the static ring: reference outline and equal-arc divisions. It is stable
 *   for the app’s current dial layout.
 * - {@link ClockTideEventInstant} values are high/low instants for the active civil-day window; the
 *   application layer supplies them when building a scene. Division geometry and SVG path mapping take a
 *   {@link ClockSceneModel} as one input bundle.
 */

export type ClockReferenceOutline = {
  readonly kind: 'circle';
};

/**
 * Equal arcs between consecutive radial division marks. Pecks sit on boundaries; there are
 * {@link ClockDialDivisions.spaceCount} spaces and the same number of boundary positions around the ring.
 */
export type ClockDialDivisions = {
  /** Full-day dial: 24 spaces between pecks. */
  readonly spaceCount: 24;
  /**
   * Which boundary is drawn at the top of the dial (12 o’clock in typical layout).
   * Valid range: 0 .. spaceCount - 1.
   */
  readonly topAlignedBoundaryIndex: number;
};

/** Static dial structure without tide annotations (outline + division layout). */
export type ClockDialShell = {
  readonly referenceOutline: ClockReferenceOutline;
  readonly dialDivisions: ClockDialDivisions;
};

/** High/low instants for the current civil-day window; geometry/SVG mapping comes later. */
export type ClockTideEventInstant = {
  readonly kind: 'high' | 'low';
  /** ISO 8601 instant in UTC, aligned with tide snapshot fields elsewhere in the app. */
  readonly timeUtc: string;
};

/** Full scene passed into clock presentation: dial shell plus tide markers for the window. */
export type ClockSceneModel = ClockDialShell & {
  readonly tideEvents: readonly ClockTideEventInstant[];
};

/** Canonical static shell for the current narrow slice (reference ring + 24 divisions, top-aligned). */
export const canonicalClockDialShell: ClockDialShell = {
  referenceOutline: { kind: 'circle' },
  dialDivisions: {
    spaceCount: 24,
    topAlignedBoundaryIndex: 0,
  },
};

/** Canonical scene: {@link canonicalClockDialShell} with no tide events (caller fills when data exists). */
export const canonicalClockSceneModel: ClockSceneModel = {
  ...canonicalClockDialShell,
  tideEvents: [],
};
