import { describe, expect, it } from 'vitest';
import { defaultClockSceneModel, type ClockSceneModel } from '../../clock-presentation/clockSceneModel';
import { clockDivisionDialSvgProps } from './clockPathMapping';

describe('clockDivisionDialSvgProps', () => {
  it('matches snapshot for default scene (midnight at top)', () => {
    expect(clockDivisionDialSvgProps(defaultClockSceneModel)).toMatchSnapshot();
  });

  it('matches snapshot when topAlignedBoundaryIndex rotates the dial', () => {
    const scene: ClockSceneModel = {
      ...defaultClockSceneModel,
      dialDivisions: {
        spaceCount: 24,
        topAlignedBoundaryIndex: 6,
      },
    };
    expect(clockDivisionDialSvgProps(scene)).toMatchSnapshot();
  });

  it('honours explicit tick length', () => {
    const shorter = clockDivisionDialSvgProps(defaultClockSceneModel, 2);
    const defaultLen = clockDivisionDialSvgProps(defaultClockSceneModel);
    expect(shorter.ticks[0]).not.toEqual(defaultLen.ticks[0]);
    expect(shorter.viewBox).toBe(defaultLen.viewBox);
  });
});
