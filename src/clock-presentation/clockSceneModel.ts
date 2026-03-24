/**
 * Semantic description of the clock face for presentation (no temporal binding in this iteration).
 * Downstream: geometry maps outline + division structure to primitives; SVG mapping renders pecks.
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

export type ClockSceneModel = {
  readonly referenceOutline: ClockReferenceOutline;
  readonly dialDivisions: ClockDialDivisions;
};

/** Canonical static scene for the current narrow slice (reference ring + 24 divisions, top-aligned). */
export const defaultClockSceneModel = {
  referenceOutline: { kind: 'circle' as const },
  dialDivisions: {
    spaceCount: 24 as const,
    topAlignedBoundaryIndex: 0,
  },
} satisfies ClockSceneModel;
