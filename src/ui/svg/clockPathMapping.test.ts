import { describe, expect, it } from 'vitest';
import { STANDARD_DIVISION_TICK_LENGTH } from '../../clock-presentation/clockDivisionGeometry';
import {
  canonicalClockSceneModel,
  type ClockSceneModel,
} from '../../clock-presentation/clockSceneModel';
import { clockDivisionDialSvgProps } from './clockPathMapping';

describe('clockDivisionDialSvgProps', () => {
  it('matches snapshot for default scene (midnight at top)', () => {
    expect(
      clockDivisionDialSvgProps(canonicalClockSceneModel, STANDARD_DIVISION_TICK_LENGTH),
    ).toMatchSnapshot();
  });

  it('matches snapshot when topAlignedBoundaryIndex rotates the dial', () => {
    const scene: ClockSceneModel = {
      ...canonicalClockSceneModel,
      dialDivisions: {
        spaceCount: 24,
        topAlignedBoundaryIndex: 6,
      },
    };
    expect(clockDivisionDialSvgProps(scene, STANDARD_DIVISION_TICK_LENGTH)).toMatchSnapshot();
  });

  it('honours explicit tick length', () => {
    const shorter = clockDivisionDialSvgProps(canonicalClockSceneModel, 2);
    const standardLen = clockDivisionDialSvgProps(
      canonicalClockSceneModel,
      STANDARD_DIVISION_TICK_LENGTH,
    );
    expect(shorter.ticks[0]).not.toEqual(standardLen.ticks[0]);
    expect(shorter.viewBox).toBe(standardLen.viewBox);
  });
});
