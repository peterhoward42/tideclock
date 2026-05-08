/**
 * homeScreenModel.ts — Route-facing shape for Home’s diagram collaborator injection point.
 * Application wires a real collaborator; this module only types the slot. Kind: UI shell type bundle.
 * Does not import diagram-generation internals.
 */

import type {
  DiagramCollaborator,
  DiagramSpec,
} from '../application/diagramCollaborator';

/**
 * Route-level presentation bundle for Home (diagram + surrounding chrome in later iterations).
 *
 * **Boundaries**
 * - This module lives in clock-presentation: it describes what the Home route needs from the app,
 *   not how diagrams are built.
 * - {@link DiagramCollaborator} is defined in the application layer; Home receives a
 *   ready collaborator (typically from {@link createDiagramCollaborator}) rather than
 *   importing diagram-generation internals.
 */
export type HomeScreenModel = {
  readonly diagramGeneration: DiagramCollaborator;
};

const uninitializedDiagramCollaborator: DiagramCollaborator = {
  generate(_spec: DiagramSpec): never {
    throw new Error('homeScreenModel.diagramGeneration is not initialized');
  },
};

/** Placeholder until wiring injects a real collaborator (e.g. from the app shell). */
export const uninitializedHomeScreenModel: HomeScreenModel = {
  diagramGeneration: uninitializedDiagramCollaborator,
};
