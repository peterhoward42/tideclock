import { describe, expect, it } from 'vitest';
import { TideExtreme } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import { homeTideDiagramLayoutBase } from '../diagram-config';
import { buildDiagramGenerationSpec, utcIsoToLocalCanonicalTimeUtc } from './buildDiagramGenerationSpec';
import { annularBandMaxX, createDiagramGenerationCollaborator } from './diagramGenerationCollaborator';

function minimalExtremesForCollaboratorTest(): TideExtremesAtLocation {
  return TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
    new TideExtreme('low', '2026-03-23T12:00:00.000Z', 1.0),
  ]);
}
const FIXTURE_DATE_PREFIX = 'Mon 23 Mar';

function baseSpecForCollaboratorTest() {
  return buildDiagramGenerationSpec({
    extremesAtLocation: minimalExtremesForCollaboratorTest(),
    timeNow: '12:00:00',
    timeNowDatePrefix: FIXTURE_DATE_PREFIX,
    utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
    townName: 'Lymington',
  });
}

describe('createDiagramGenerationCollaborator', () => {
  it('generates diagram and scene from app runtime code', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const spec = baseSpecForCollaboratorTest();
    const output = collaborator.generate(spec);

    expect(output.diagram.version).toBe(1);
    expect(output.scene.version).toBe(2);
    expect(output.scene.root.kind).toBe('group');
    expect(output.styleRuntime.roleColorsByName.size).toBeGreaterThan(0);
    const hand = output.diagram.hand;
    const rArmStart = Math.hypot(hand.arm.start.x, hand.arm.start.y);
    const rArmEnd = Math.hypot(hand.arm.end.x, hand.arm.end.y);
    expect(rArmStart).toBeCloseTo(hand.bossCircle.radius);
    const refR = output.diagram.refArc.refRadius;
    const gapK = homeTideDiagramLayoutBase.hand.armRefArcGap;
    expect(rArmEnd).toBeCloseTo(refR - gapK * refR);
  });

  it('includes AnnularBand from home layout (annularBand.annularBandWidth)', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const spec = baseSpecForCollaboratorTest();
    const { diagram, scene } = collaborator.generate(spec);
    expect(diagram.annularBand.rInner).toBe(diagram.refArc.refRadius);
    expect(diagram.annularBand.rOuter).toBeCloseTo(
      diagram.refArc.refRadius * (1 + homeTideDiagramLayoutBase.annularBand.annularBandWidth),
    );
    const annularGroup = scene.root.children.find(
      (child): child is { kind: 'group'; name: string; children: unknown[] } =>
        child.kind === 'group' && child.name === 'AnnularBand',
    );
    expect(annularGroup).toBeDefined();
    if (annularGroup != null) {
      const leaf = annularGroup.children[0];
      expect(leaf).toMatchObject({ kind: 'annularSector' });
    }
  });

  it('throws when spec.annularBand is omitted', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { annularBand: _omit, ...rest } = base;
    expect(() => collaborator.generate(rest)).toThrow(/annularBand/);
  });

  it('throws when annularBandWidth is zero', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    const spec = { ...base, annularBand: { annularBandWidth: 0 } };
    expect(() => collaborator.generate(spec)).toThrow(/greater than 0/);
  });

  it('throws when spec.hand.armRefArcGap is missing', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { hand, ...rest } = base;
    const { armRefArcGap: _omit, ...handWithoutGap } = hand as {
      bossCircleRadius: number;
      armRefArcGap: number;
    };
    expect(() => collaborator.generate({ ...rest, hand: handWithoutGap })).toThrow(
      /spec\.hand\.armRefArcGap/,
    );
  });

  it('throws when hand armRefArcGap makes arm outer radius not past boss circle', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    const spec = {
      ...base,
      hand: { ...(base.hand as Record<string, unknown>), armRefArcGap: 0.96 },
    };
    expect(() => collaborator.generate(spec)).toThrow(/radial ordering invalid/);
  });

  it('aligns time-now readout and menu trigger to global layout bounds', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const spec = baseSpecForCollaboratorTest();
    const { diagram } = collaborator.generate(spec);
    const tickMinY = Math.min(...diagram.tickLabels.map((t) => t.anchor.y));
    const maxX = annularBandMaxX(diagram.annularBand);
    expect(diagram.timeNowClock.hhmm.anchor.y).not.toBe(tickMinY);
    expect(diagram.timeNowClock.seconds.anchor.y).not.toBe(tickMinY);
    expect(diagram.timeNowLocation.anchor.x).toBe(maxX);
    expect(diagram.timeNowClock.seconds.anchor.x).toBe(maxX);
    const dateAbove =
      (spec.timeNowLabel as { readonly fontHeight: number; readonly dateAboveTime: number }).dateAboveTime *
      diagram.refArc.refRadius;
    const fontHeight =
      (spec.timeNowLabel as { readonly fontHeight: number; readonly dateAboveTime: number }).fontHeight *
      diagram.refArc.refRadius;
    // TimeNowDate shares the same baseline as the clock row; it is only shifted left to create
    // the merged date+clock appearance.
    expect(diagram.timeNowDate.anchor.y).toBeCloseTo(diagram.timeNowClock.hhmm.anchor.y, 6);
    expect(diagram.timeNowLocation.anchor.y).toBeCloseTo(
      diagram.timeNowClock.hhmm.anchor.y + dateAbove + fontHeight,
      6,
    );

    // MainLabel shares global B_bottom.
    const clockBottomY = diagram.timeNowClock.hhmm.anchor.y - 0.2 * diagram.timeNowClock.hhmm.fontSize;
    const menuBottomY = diagram.homeMenuTrigger.center.y - 0.5 * diagram.homeMenuTrigger.height;
    const mainLabelBottomY = diagram.mainLabel.anchor.y - 0.2 * diagram.mainLabel.fontSize;
    expect(mainLabelBottomY).toBeCloseTo(clockBottomY, 6);

    // HomeMenuTrigger sits above MainLabel top by configured gap.
    const mainLabelTopY = diagram.mainLabel.anchor.y + 0.8 * diagram.mainLabel.fontSize;
    const expectedGap =
      (spec.homeMenuTrigger as { readonly gapAboveMainLabel: number }).gapAboveMainLabel *
      diagram.refArc.refRadius;
    expect(menuBottomY).toBeCloseTo(mainLabelTopY + expectedGap, 6);

    // X shift: date ends before the clock and a 3-char separator gap.
    const fontSize = diagram.timeNowDate.fontSize;
    const charW = 0.6 * fontSize; // must match buildDiagram.mjs heuristic
    const clockWidth = 8 * charW;
    const separatorWidth = 3 * charW;
    const expectedDateX = maxX - clockWidth - separatorWidth;
    expect(diagram.timeNowDate.anchor.x).toBeCloseTo(expectedDateX, 6);
  });

  it('applies layoutBoundsBottomMargin by extending B_bottom (clock row and MainLabel shift down)', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    const without = collaborator.generate(base).diagram;
    const k = 0.03;
    const withMargin = collaborator.generate({ ...base, layoutBoundsBottomMargin: k }).diagram;
    const delta = k * withMargin.refArc.refRadius;
    expect(withMargin.timeNowClock.hhmm.anchor.y - without.timeNowClock.hhmm.anchor.y).toBeCloseTo(
      -delta,
      6,
    );
    expect(withMargin.mainLabel.anchor.y - without.mainLabel.anchor.y).toBeCloseTo(-delta, 6);
  });

  it('throws when layoutBoundsBottomMargin is negative', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    expect(() => collaborator.generate({ ...base, layoutBoundsBottomMargin: -0.01 })).toThrow(
      /layoutBoundsBottomMargin must be >= 0/,
    );
  });

  it('throws when annularBand is present without annularBandWidth', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    const spec = { ...base, annularBand: {} };
    expect(() => collaborator.generate(spec)).toThrow(/annularBandWidth/);
  });

  it('leaves root paint order unchanged when no override is provided', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { paintOrder: _omitPaintOrder, ...withoutPaintOrder } = base;
    const { scene } = collaborator.generate(withoutPaintOrder);
    const childNames = scene.root.children
      .filter((child) => child.kind === 'group')
      .map((child) => child.name);
    expect(childNames).toEqual([
      'Hand',
      'AnnularBand',
      'RefArc',
      'TickMark',
      'TideMarks',
      'TickLabel',
      'MainLabel',
      'TimeNowLocation',
      'TimeNowDate',
      'TimeNowClock',
      'HomeMenuTrigger',
    ]);
  });

  it('applies a valid paint-order before override at root level', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    const spec = {
      ...base,
      paintOrder: {
        overrides: [{ name: 'TimeNowLocation', place: 'before' as const, relativeTo: 'RefArc' }],
      },
    };
    const { scene } = collaborator.generate(spec);
    const childNames = scene.root.children
      .filter((child) => child.kind === 'group')
      .map((child) => child.name);
    expect(childNames.indexOf('TimeNowLocation')).toBeLessThan(childNames.indexOf('RefArc'));
  });

  it('applies home preset paint-order so Hand sits below all root siblings', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const { scene } = collaborator.generate(baseSpecForCollaboratorTest());
    const childNames = scene.root.children
      .filter((child) => child.kind === 'group')
      .map((child) => child.name);
    expect(childNames[0]).toBe('Hand');
    expect(childNames.indexOf('Hand')).toBeLessThan(childNames.indexOf('AnnularBand'));
  });

  it('throws for unknown paint-order names', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    const spec = {
      ...base,
      paintOrder: {
        overrides: [{ name: 'Hand.MissingLeaf', place: 'before' as const, relativeTo: 'RefArc' }],
      },
    };
    expect(() => collaborator.generate(spec)).toThrow(/unknown group name "Hand\.MissingLeaf"/);
  });

  it('throws for duplicate paint-order mover names', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    const spec = {
      ...base,
      paintOrder: {
        overrides: [
          { name: 'TimeNowLocation', place: 'before' as const, relativeTo: 'RefArc' },
          { name: 'TimeNowLocation', place: 'after' as const, relativeTo: 'TickLabel' },
        ],
      },
    };
    expect(() => collaborator.generate(spec)).toThrow(/duplicate paintOrder override/);
  });

  it('moves TimePointer tip inward when tideMarkOuterBandGap is more negative', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    const refR = base.refRadius as number;
    const tideMarks = base.tideMarks as Record<string, unknown>;
    const specFlush = { ...base, tideMarks: { ...tideMarks, tideMarkOuterBandGap: 0 } };
    const specInset = { ...base, tideMarks: { ...tideMarks, tideMarkOuterBandGap: -0.05 } };
    const tipR = (spec: typeof base) => {
      const v = collaborator.generate(spec).diagram.tideMarks[0].timePointer.triangle.v1;
      return Math.hypot(v.x, v.y);
    };
    expect(tipR(specFlush) - tipR(specInset)).toBeCloseTo(0.05 * refR, 6);
  });

  it('throws when tideMarkOuterBandGap is below -annularBandWidth', () => {
    const collaborator = createDiagramGenerationCollaborator();
    const base = baseSpecForCollaboratorTest();
    const tideMarks = base.tideMarks as Record<string, unknown>;
    const spec = {
      ...base,
      tideMarks: { ...tideMarks, tideMarkOuterBandGap: -0.2 },
    };
    expect(() => collaborator.generate(spec)).toThrow(/tideMarkOuterBandGap must not be less than/);
  });

});
