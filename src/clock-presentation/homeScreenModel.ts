import { defaultClockSceneModel, type ClockSceneModel } from './clockSceneModel';
import type { DiagramGenerationCollaborator } from '../application/diagramGenerationCollaborator';

/**
 * Route-level presentation bundle. Outside-clock fields are added in later iterations.
 */
export type HomeScreenModel = {
  readonly clockScene: ClockSceneModel;
  readonly diagramGeneration: DiagramGenerationCollaborator;
};

export const defaultHomeScreenModel = {
  clockScene: defaultClockSceneModel,
  diagramGeneration: {
    generate: () => {
      throw new Error('homeScreenModel.diagramGeneration is not initialized');
    },
  },
} satisfies HomeScreenModel;
