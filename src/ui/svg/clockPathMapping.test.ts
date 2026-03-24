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
});
