import { describe, expect, it } from 'vitest';
import { defaultClockSceneModel, type ClockSceneModel } from './clockSceneModel';
import {
  DEFAULT_DIVISION_TICK_LENGTH,
  divisionBoundariesGeometry,
  divisionTickSegmentsGeometry,
} from './clockDivisionGeometry';
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

describe('divisionTickSegmentsGeometry', () => {
  it('places outer tips on the reference ring and inboard by tickLength', () => {
    const tickLength = DEFAULT_DIVISION_TICK_LENGTH;
    const g = divisionTickSegmentsGeometry(defaultClockSceneModel, tickLength);
    const b = divisionBoundariesGeometry(defaultClockSceneModel);
    expect(g).toHaveLength(24);
    for (let i = 0; i < 24; i++) {
      expect(g[i].outer.x).toBeCloseTo(b[i].pointOnReferenceRing.x, 10);
      expect(g[i].outer.y).toBeCloseTo(b[i].pointOnReferenceRing.y, 10);
      const dx = g[i].outer.x - g[i].inner.x;
      const dy = g[i].outer.y - g[i].inner.y;
      expect(Math.hypot(dx, dy)).toBeCloseTo(tickLength, 10);
    }
  });

  it('aligns top tick with default scene (midnight-at-top slice)', () => {
    const g = divisionTickSegmentsGeometry(defaultClockSceneModel, 5);
    const top = g[0];
    expect(top.outer.x).toBeCloseTo(0, 10);
    expect(top.outer.y).toBeCloseTo(-REFERENCE_RADIUS, 10);
    expect(top.inner.x).toBeCloseTo(0, 10);
    expect(top.inner.y).toBeCloseTo(-REFERENCE_RADIUS + 5, 10);
  });

  it('rejects tickLength beyond reference radius', () => {
    expect(() => divisionTickSegmentsGeometry(defaultClockSceneModel, REFERENCE_RADIUS + 1)).toThrow(
      RangeError,
    );
  });
});
