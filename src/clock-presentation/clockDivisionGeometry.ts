import type { ClockSceneModel } from './clockSceneModel';
import {
  pointOnReferenceRingFromAngle,
  pointOnRingFromAngle,
  REFERENCE_RADIUS,
  type DialPoint,
} from './normalizedDialSpace';

/** Inward extent of hour ticks from the reference ring, in normalized dial units. */
export const DEFAULT_DIVISION_TICK_LENGTH = 5;

export type DivisionBoundaryGeometry = {
  readonly boundaryIndex: number;
  /** 0 at top, increasing clockwise; see `normalizedDialSpace`. */
  readonly angleRad: number;
  readonly pointOnReferenceRing: DialPoint;
};

export type DivisionTickSegmentGeometry = {
  readonly boundaryIndex: number;
  readonly angleRad: number;
  /** Tip on the reference outline. */
  readonly outer: DialPoint;
  readonly inner: DialPoint;
};

function positiveMod(n: number, m: number): number {
  return ((n % m) + m) % m;
}

function assertDialDivisionsInRange(scene: ClockSceneModel): void {
  const { spaceCount, topAlignedBoundaryIndex } = scene.dialDivisions;
  if (
    topAlignedBoundaryIndex < 0 ||
    topAlignedBoundaryIndex >= spaceCount ||
    !Number.isInteger(topAlignedBoundaryIndex)
  ) {
    throw new RangeError(
      `topAlignedBoundaryIndex must be an integer in [0, ${spaceCount}), got ${topAlignedBoundaryIndex}`,
    );
  }
}

/**
 * Hour-boundary marks only: one entry per dial division boundary, ordered by {@link boundaryIndex}.
 * Angles follow normalized dial space (0 at top, clockwise).
 */
export function divisionBoundariesGeometry(scene: ClockSceneModel): readonly DivisionBoundaryGeometry[] {
  assertDialDivisionsInRange(scene);
  const { spaceCount, topAlignedBoundaryIndex } = scene.dialDivisions;
  const step = (2 * Math.PI) / spaceCount;
  const out: DivisionBoundaryGeometry[] = [];
  for (let boundaryIndex = 0; boundaryIndex < spaceCount; boundaryIndex++) {
    const offsetFromTop = positiveMod(boundaryIndex - topAlignedBoundaryIndex, spaceCount);
    const angleRad = offsetFromTop * step;
    out.push({
      boundaryIndex,
      angleRad,
      pointOnReferenceRing: pointOnReferenceRingFromAngle(angleRad),
    });
  }
  return out;
}

/**
 * Hour tick segments: radial lines from {@link inner} to {@link outer} on each division boundary.
 * {@link tickLength} is the distance from the reference ring inward (dial units).
 */
export function divisionTickSegmentsGeometry(
  scene: ClockSceneModel,
  tickLength: number,
): readonly DivisionTickSegmentGeometry[] {
  if (!Number.isFinite(tickLength) || tickLength < 0) {
    throw new RangeError(`tickLength must be a non-negative finite number, got ${tickLength}`);
  }
  if (tickLength > REFERENCE_RADIUS) {
    throw new RangeError(
      `tickLength (${tickLength}) cannot exceed REFERENCE_RADIUS (${REFERENCE_RADIUS})`,
    );
  }
  const innerRadius = REFERENCE_RADIUS - tickLength;
  const boundaries = divisionBoundariesGeometry(scene);
  return boundaries.map((b) => ({
    boundaryIndex: b.boundaryIndex,
    angleRad: b.angleRad,
    outer: b.pointOnReferenceRing,
    inner: pointOnRingFromAngle(b.angleRad, innerRadius),
  }));
}
