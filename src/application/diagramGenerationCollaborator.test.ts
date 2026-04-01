import { describe, expect, it } from 'vitest';
import { createDiagramGenerationCollaborator } from './diagramGenerationCollaborator';

function minimalDiagramSpec(): Record<string, unknown> {
  return {
    title: 'phase-4-host-surface',
    contentBounds: {
      left: 1.2,
      right: 1.2,
      above: 0.4,
      below: 1.4,
    },
    timeNow: '12:00:00',
  };
}

describe('createDiagramGenerationCollaborator', () => {
  it('generates diagram and scene from app runtime code', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const output = collaborator.generate(minimalDiagramSpec());
    const diagram = output.diagram as { version: number };
    const scene = output.scene as { version: number; root: { kind: string } };

    expect(diagram.version).toBe(1);
    expect(scene.version).toBe(2);
    expect(scene.root.kind).toBe('group');
    expect(output.styleRuntime.stylesByName.size).toBeGreaterThan(0);
  });
});
