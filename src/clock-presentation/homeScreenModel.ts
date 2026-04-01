import type { DiagramGenerationCollaborator } from '../application/diagramGenerationCollaborator';

/**
 * Route-level presentation bundle. Outside-clock fields are added in later iterations.
 */
export type HomeScreenModel = {
  readonly diagramGeneration: DiagramGenerationCollaborator;
};

export const defaultHomeScreenModel = {
  diagramGeneration: {
    generate: () => {
      throw new Error('homeScreenModel.diagramGeneration is not initialized');
    },
  },
} satisfies HomeScreenModel;
