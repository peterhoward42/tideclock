import type { ClockSceneModel } from './clockSceneModel';
import { pointOnReferenceRingFromAngle, type DialPoint } from './normalizedDialSpace';

export type DivisionBoundaryGeometry = {
  readonly boundaryIndex: number;
  /** 0 at top, increasing clockwise; see `normalizedDialSpace`. */
  readonly angleRad: number;
  readonly pointOnReferenceRing: DialPoint;
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
