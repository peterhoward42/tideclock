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
const FIXTURE_DATE_PREFIX = 'Mon 23 Mar';

describe('createDiagramGenerationCollaborator', () => {
  it('generates diagram and scene from app runtime code', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const spec = buildDiagramGenerationSpec({
      extremesAtLocation: minimalExtremesForCollaboratorTest(),
      timeNow: '12:00:00',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
    });
    const output = collaborator.generate(spec);

    expect(output.diagram.version).toBe(1);
    expect(output.scene.version).toBe(2);
    expect(output.scene.root.kind).toBe('group');
    expect(output.styleRuntime.stylesByName.size).toBeGreaterThan(0);
  });

  it('includes AnnularBand from home layout (annularBand.annularBandWidth)', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const spec = buildDiagramGenerationSpec({
      extremesAtLocation: minimalExtremesForCollaboratorTest(),
      timeNow: '12:00:00',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
    });
    const { diagram, scene } = collaborator.generate(spec);
    expect(diagram.annularBand.rInner).toBe(diagram.refArc.refRadius);
    expect(diagram.annularBand.rOuter).toBeCloseTo(diagram.refArc.refRadius * 1.05);
    expect(scene.root.children[0].kind).toBe('group');
    if (scene.root.children[0].kind === 'group') {
      expect(scene.root.children[0].name).toBe('AnnularBand');
      const leaf = scene.root.children[0].children[0];
      expect(leaf).toMatchObject({ kind: 'annularSector' });
    }
  });

  it('throws when spec.annularBand is omitted', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = buildDiagramGenerationSpec({
      extremesAtLocation: minimalExtremesForCollaboratorTest(),
      timeNow: '12:00:00',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
    });
    const { annularBand: _omit, ...rest } = base;
    expect(() => collaborator.generate(rest)).toThrow(/annularBand/);
  });

  it('throws when annularBandWidth is zero', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = buildDiagramGenerationSpec({
      extremesAtLocation: minimalExtremesForCollaboratorTest(),
      timeNow: '12:00:00',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
    });
    const spec = { ...base, annularBand: { annularBandWidth: 0 } };
    expect(() => collaborator.generate(spec)).toThrow(/greater than 0/);
  });

  it('throws when annularBand is present without annularBandWidth', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = buildDiagramGenerationSpec({
      extremesAtLocation: minimalExtremesForCollaboratorTest(),
      timeNow: '12:00:00',
      timeNowDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
    });
    const spec = { ...base, annularBand: {} };
    expect(() => collaborator.generate(spec)).toThrow(/annularBandWidth/);
  });
});
