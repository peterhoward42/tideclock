/**
 * homeScreenModel.ts — Route-facing shape for Home’s diagram collaborator injection point.
 * Application wires a real collaborator; this module only types the slot. Kind: UI shell type bundle.
 * Does not import diagram-generation internals.
 */

import type {
  DiagramGenerationCollaborator,
  DiagramGenerationSpec,
} from '../application/diagramGenerationCollaborator';

/**
 * Route-level presentation bundle for Home (diagram + surrounding chrome in later iterations).
 *
 * **Boundaries**
 * - This module lives in clock-presentation: it describes what the Home route needs from the app,
 *   not how diagrams are built.
 * - {@link DiagramGenerationCollaborator} is defined in the application layer; Home receives a
 *   ready collaborator (typically from {@link createDiagramGenerationCollaborator}) rather than
 *   importing diagram-generation internals.
 */
export type HomeScreenModel = {
  readonly diagramGeneration: DiagramGenerationCollaborator;
};

const uninitializedDiagramCollaborator: DiagramGenerationCollaborator = {
  generate(_spec: DiagramGenerationSpec): never {
    throw new Error('homeScreenModel.diagramGeneration is not initialized');
  },
};

/** Placeholder until wiring injects a real collaborator (e.g. from the app shell). */
export const defaultHomeScreenModel: HomeScreenModel = {
  diagramGeneration: uninitializedDiagramCollaborator,
};
