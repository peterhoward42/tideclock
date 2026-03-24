import { describe, expect, it } from 'vitest';
import { defaultClockSceneModel, type ClockSceneModel } from './clockSceneModel';
import { divisionBoundariesGeometry } from './clockDivisionGeometry';
import { REFERENCE_RADIUS } from './normalizedDialSpace';

const twoPi = 2 * Math.PI;

describe('divisionBoundariesGeometry', () => {
  it('places boundary 0 at the top for default scene (midnight-at-top slice)', () => {
    const g = divisionBoundariesGeometry(defaultClockSceneModel);
    const b0 = g[0];
    expect(b0.boundaryIndex).toBe(0);
    expect(b0.angleRad).toBe(0);
    expect(b0.pointOnReferenceRing.x).toBeCloseTo(0, 10);
    expect(b0.pointOnReferenceRing.y).toBeCloseTo(-REFERENCE_RADIUS, 10);
  });

  it('spaces 24 boundaries evenly by π/12 rad', () => {
    const g = divisionBoundariesGeometry(defaultClockSceneModel);
    expect(g).toHaveLength(24);
    for (let i = 1; i < 24; i++) {
      const delta = g[i].angleRad - g[i - 1].angleRad;
      expect(delta).toBeCloseTo(Math.PI / 12, 10);
    }
    expect(g[0].angleRad + twoPi - g[23].angleRad).toBeCloseTo(Math.PI / 12, 10);
  });

  it('rotates so topAlignedBoundaryIndex sits at θ = 0', () => {
    const scene: ClockSceneModel = {
      ...defaultClockSceneModel,
      dialDivisions: {
        spaceCount: 24,
        topAlignedBoundaryIndex: 6,
      },
    };
    const g = divisionBoundariesGeometry(scene);
    expect(g[6].angleRad).toBe(0);
    expect(g[6].pointOnReferenceRing.y).toBeCloseTo(-REFERENCE_RADIUS, 10);
    expect(g[7].angleRad).toBeCloseTo(Math.PI / 12, 10);
  });

  it('rejects invalid topAlignedBoundaryIndex', () => {
    const bad: ClockSceneModel = {
      ...defaultClockSceneModel,
      dialDivisions: { spaceCount: 24, topAlignedBoundaryIndex: 24 },
    };
    expect(() => divisionBoundariesGeometry(bad)).toThrow(RangeError);
  });
});
