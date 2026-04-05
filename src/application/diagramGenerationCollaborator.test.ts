import { describe, expect, it } from 'vitest';
import { TideExtreme } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import { buildDiagramGenerationSpec, utcIsoToLocalCanonicalTimeUtc } from './buildDiagramGenerationSpec';
import { createDiagramGenerationCollaborator } from './diagramGenerationCollaborator';

function minimalExtremesForCollaboratorTest(): TideExtremesAtLocation {
  return new TideExtremesAtLocation(50.8, -1.1, [
    new TideExtreme('low', '2026-03-23T12:00:00.000Z', 1.0),
  ]);
}

describe('createDiagramGenerationCollaborator', () => {
  it('generates diagram and scene from app runtime code', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const spec = buildDiagramGenerationSpec({
      extremesAtLocation: minimalExtremesForCollaboratorTest(),
      timeNow: '12:00:00',
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
    });
    const output = collaborator.generate(spec);

    expect(output.diagram.version).toBe(1);
    expect(output.scene.version).toBe(2);
    expect(output.scene.root.kind).toBe('group');
    expect(output.styleRuntime.stylesByName.size).toBeGreaterThan(0);
  });
});
