import { defaultClockSceneModel, type ClockSceneModel } from './clockSceneModel';

/**
 * Route-level presentation bundle. Outside-clock fields are added in later iterations.
 */
export type HomeScreenModel = {
  readonly clockScene: ClockSceneModel;
};

export const defaultHomeScreenModel = {
  clockScene: defaultClockSceneModel,
} satisfies HomeScreenModel;
