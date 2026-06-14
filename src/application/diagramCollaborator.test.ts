import { describe, expect, it } from 'vitest';
import { TideExtreme } from '../core-models/TideExtreme';
import { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import { homeLayoutBase } from '../diagram-config';
import { buildDiagramSpec, FIXTURE_SHARE_URL, utcIsoToLocalCanonicalTimeUtc } from './buildDiagramSpec';
import { loadStyleModel } from '../diagram-generation/index.mjs';
import {
  annularBandMaxX,
  createDiagramCollaborator,
  renderSceneSvg,
} from './diagramCollaborator';

function minimalExtremesForCollaboratorTest(): TideExtremesAtLocation {
  return TideExtremesAtLocation.fromPossiblyUnordered(50.8, -1.1, [
    new TideExtreme('low', '2026-03-23T12:00:00.000Z', 1.0),
  ]);
}
const FIXTURE_DATE_PREFIX = 'Mon 23 Mar';
/** Matches `BRHC_LABEL_CHAR_WIDTH_EM` in `buildDiagram.mjs`. */
const MONO_LABEL_CHAR_WIDTH_EM = 0.6;

function baseSpecForCollaboratorTest() {
  return buildDiagramSpec({
    extremesAtLocation: minimalExtremesForCollaboratorTest(),
    timeNow: '12:00:00',
    brhcDatePrefix: FIXTURE_DATE_PREFIX,
    utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
    townName: 'Lymington',
    shareUrl: FIXTURE_SHARE_URL,
  });
}

describe('createDiagramCollaborator', () => {
  it('generates diagram and scene from app runtime code', () => {
    const collaborator = createDiagramCollaborator();
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
    const gapK = homeLayoutBase.hand.armRefArcGap;
    expect(rArmEnd).toBeCloseTo(refR - gapK * refR);
  });

  it('includes AnnularBand from home layout (annularBand.annularBandWidth)', () => {
    const collaborator = createDiagramCollaborator();
    const spec = baseSpecForCollaboratorTest();
    const { diagram, scene } = collaborator.generate(spec);
    expect(diagram.annularBand.rInner).toBe(diagram.refArc.refRadius);
    expect(diagram.annularBand.rOuter).toBeCloseTo(
      diagram.refArc.refRadius * (1 + homeLayoutBase.annularBand.annularBandWidth),
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
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { annularBand: _omit, ...rest } = base;
    expect(() => collaborator.generate(rest)).toThrow(/annularBand/);
  });

  it('throws when annularBandWidth is zero', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const spec = { ...base, annularBand: { annularBandWidth: 0 } };
    expect(() => collaborator.generate(spec)).toThrow(/greater than 0/);
  });

  it('throws when spec.brandQrLeftPadding is omitted', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { brandQrLeftPadding: _omit, ...rest } = base as { brandQrLeftPadding: number } & Record<
      string,
      unknown
    >;
    expect(() => collaborator.generate(rest)).toThrow(/spec\.brandQrLeftPadding/);
  });

  it('throws when spec.brandQrAboveBottom is omitted', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { brandQrAboveBottom: _omit, ...rest } = base as { brandQrAboveBottom: number } & Record<
      string,
      unknown
    >;
    expect(() => collaborator.generate(rest)).toThrow(/spec\.brandQrAboveBottom/);
  });

  it('throws when spec.brandQrSize is omitted', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { brandQrSize: _omit, ...rest } = base as { brandQrSize: number } & Record<string, unknown>;
    expect(() => collaborator.generate(rest)).toThrow(/spec\.brandQrSize/);
  });

  it('throws when spec.brandQrPlateCornerRx is omitted', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { brandQrPlateCornerRx: _omit, ...rest } = base as { brandQrPlateCornerRx: number } & Record<
      string,
      unknown
    >;
    expect(() => collaborator.generate(rest)).toThrow(/spec\.brandQrPlateCornerRx/);
  });

  it('throws when spec.dividorArc is omitted', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { dividorArc: _omit, ...rest } = base;
    expect(() => collaborator.generate(rest)).toThrow(/spec\.dividorArc/);
  });

  it('throws when spec.hand.armRefArcGap is missing', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { hand, ...rest } = base;
    const { armRefArcGap: _omit, ...handWithoutGap } = hand as {
      bossCircleRadius: number;
      armRefArcGap: number;
      armTimeLabelFontHeight: number;
      bossLabelFontHeight: number;
    };
    expect(() => collaborator.generate({ ...rest, hand: handWithoutGap })).toThrow(
      /spec\.hand\.armRefArcGap/,
    );
  });

  it('throws when spec.hand.armTimeLabelFontHeight is missing', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { hand, ...rest } = base;
    const { armTimeLabelFontHeight: _omit, ...handWithoutArmLabelFont } = hand as {
      bossCircleRadius: number;
      armRefArcGap: number;
      armTimeLabelFontHeight: number;
      bossLabelFontHeight: number;
    };
    expect(() => collaborator.generate({ ...rest, hand: handWithoutArmLabelFont })).toThrow(
      /spec\.hand\.armTimeLabelFontHeight/,
    );
  });

  it('throws when hand armRefArcGap makes arm outer radius not past boss circle', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const spec = {
      ...base,
      hand: { ...(base.hand as Record<string, unknown>), armRefArcGap: 0.96 },
    };
    expect(() => collaborator.generate(spec)).toThrow(/radial ordering invalid/);
  });

  it('throws when spec.hand.bossLabelFontHeight is missing', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { hand, ...rest } = base;
    const { bossLabelFontHeight: _omit, ...handWithoutBossLabelFont } = hand as {
      bossCircleRadius: number;
      armRefArcGap: number;
      armTimeLabelFontHeight: number;
      bossLabelFontHeight: number;
    };
    expect(() => collaborator.generate({ ...rest, hand: handWithoutBossLabelFont })).toThrow(
      /spec\.hand\.bossLabelFontHeight/,
    );
  });

  it('places BrandQR and HomeLocationPanel from independent B_left / B_bottom offsets', () => {
    const collaborator = createDiagramCollaborator();
    const spec = baseSpecForCollaboratorTest();
    const { diagram } = collaborator.generate(spec);
    const R = diagram.refArc.refRadius;
    const qrLeftK = (spec as { brandQrLeftPadding: number }).brandQrLeftPadding;
    const qrAboveK = (spec as { brandQrAboveBottom: number }).brandQrAboveBottom;
    const qrSizeK = (spec as { brandQrSize: number }).brandQrSize;
    const panelCfg = spec as {
      homeLocationPanel: {
        readonly leftPadding: number;
        readonly aboveBottom: number;
        readonly width: number;
      };
    };
    const bBottom = diagram.mainLabel.anchor.y - 0.2 * diagram.mainLabel.fontSize;
    const bLeft = diagram.brand.brandQr.origin.x - qrLeftK * R;
    expect(diagram.brand.brandQr.origin.x).toBeCloseTo(bLeft + qrLeftK * R, 6);
    expect(diagram.brand.brandQr.origin.y).toBeCloseTo(bBottom + qrAboveK * R, 6);
    expect(diagram.homeLocationPanel.plate.center.x).toBeCloseTo(
      bLeft + panelCfg.homeLocationPanel.leftPadding * R + 0.5 * panelCfg.homeLocationPanel.width * R,
      6,
    );
    expect(diagram.homeLocationPanel.plate.center.y).toBeCloseTo(
      bBottom +
        panelCfg.homeLocationPanel.aboveBottom * R +
        0.5 * panelCfg.homeLocationPanel.height * R,
      6,
    );
    expect(diagram.brand.brandQr.payload).toBe(FIXTURE_SHARE_URL);
    expect(diagram.brand.brandQr.moduleCount).toBeGreaterThan(0);
    expect(diagram.brand.brandQr.moduleCount * diagram.brand.brandQr.moduleSize).toBeCloseTo(
      qrSizeK * R,
      6,
    );
  });

  it('renders BrandQRPlate, BrandQR, and HomeLocationPanel from the home style model', () => {
    const collaborator = createDiagramCollaborator();
    const { scene, styleRuntime } = collaborator.generate(baseSpecForCollaboratorTest());
    const svg = renderSceneSvg(scene, { styleRuntime });
    expect(svg).toContain('data-name="BrandQRPlate"');
    expect(svg).toContain('data-name="BrandQR"');
    expect(svg).toContain('data-name="HomeLocationPanel"');
    expect(svg).toContain('>Location<');
    expect(svg).toContain('>Share<');
    expect(svg).toContain('>Change<');
    expect(svg).toMatch(/<rect[^>]+fill="#111"[^>]+stroke="#555"/);
    expect(svg).toMatch(/<path d="M [^"]+ h [^"]+ v [^"]+ h [^"]+ Z/);
  });

  it('rejects style role fontWeight other than 400 or 700', () => {
    expect(() =>
      loadStyleModel({
        roles: [{ name: 'r', colors: { color: '#333', fontWeight: 600 } }],
        bindings: [{ name: 'X', roleName: 'r' }],
      }),
    ).toThrow(/fontWeight must be 400 or 700/);
  });

  it('right-aligns BRHCBundle to B_right and places HomeMenuTrigger at menuRightPadding from B_right and menuAboveBottom from B_bottom (excluded from B_*)', () => {
    const collaborator = createDiagramCollaborator();
    const spec = baseSpecForCollaboratorTest();
    const { diagram } = collaborator.generate(spec);
    const tickMinY = Math.min(...diagram.tickLabels.map((t) => t.anchor.y));
    const annularMaxX = annularBandMaxX(diagram.annularBand);
    const bundleRightX = diagram.brhcDate.anchor.x;
    expect(diagram.mainLabel.anchor.y).not.toBe(tickMinY);
    expect(bundleRightX).toBeGreaterThanOrEqual(annularMaxX);
    const dateAbove =
      (spec.brhcBundle as { readonly fontHeight: number; readonly dateAboveTime: number }).dateAboveTime *
      diagram.refArc.refRadius;
    const fontHeight =
      (spec.brhcBundle as { readonly fontHeight: number; readonly dateAboveTime: number }).fontHeight *
      diagram.refArc.refRadius;
    expect(diagram.mainLabel.anchor.x).toBe(bundleRightX);
    expect(diagram.mainLabel.fontSize).toBeCloseTo(fontHeight, 6);
    expect(diagram.brhcDate.anchor.y).toBeCloseTo(
      diagram.mainLabel.anchor.y + dateAbove + fontHeight,
      6,
    );

    const d = diagram.homeMenuTrigger.diameter;
    const R = diagram.refArc.refRadius;
    const bRight = bundleRightX;
    const padK = (spec.homeMenuTrigger as { readonly menuRightPadding: number }).menuRightPadding;
    expect(diagram.homeMenuTrigger.center.x).toBeCloseTo(bRight - padK * R - 0.5 * d, 6);
    const bBottom =
      diagram.mainLabel.anchor.y - 0.2 * diagram.mainLabel.fontSize;
    const menuAboveK = (spec.homeMenuTrigger as { readonly menuAboveBottom: number }).menuAboveBottom;
    expect(diagram.homeMenuTrigger.center.y).toBeCloseTo(bBottom + menuAboveK * R + 0.5 * d, 6);
  });

  it('places LocationLabel inside the dial from locationPlacement × t_now', () => {
    const collaborator = createDiagramCollaborator();
    const spec = baseSpecForCollaboratorTest();
    const { diagram } = collaborator.generate(spec);
    const R = diagram.refArc.refRadius;
    const placement = (spec as {
      locationPlacement: {
        readonly fontHeight: number;
        readonly lineGap: number;
        readonly ranges: readonly {
          readonly from: string;
          readonly to: string;
          readonly belowOrigin: number;
          readonly offsetRight: number;
          readonly justification: string;
        }[];
      };
    }).locationPlacement;
    expect(diagram.locationLabel).toHaveLength(1);
    expect(diagram.locationLabel[0].content).toBe('Lymington');
    expect(diagram.locationLabel[0].fontSize).toBeCloseTo(placement.fontHeight * R, 6);
    const active = placement.ranges.find(
      (r) => r.from === '12:00:00' && r.to === '18:00:00',
    );
    expect(active).toBeDefined();
    if (active == null) return;
    expect(diagram.locationLabel[0].hAlign).toBe('center');
    expect(diagram.locationLabel[0].anchor.x).toBeCloseTo(active.offsetRight * R, 6);
    expect(diagram.locationLabel[0].anchor.y).toBeCloseTo(-active.belowOrigin * R, 6);
  });

  it('wraps long LocationLabel place names onto multiple lines with lineGap', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const spec = {
      ...base,
      timeNow: '12:00:00',
      locationName: 'North Somercotes - Lincolnshire',
      locationPlacement: {
        ...base.locationPlacement,
        maxSegmentLength: 21,
        lineGap: 0.05,
      },
    };
    const { diagram } = collaborator.generate(spec);
    const R = diagram.refArc.refRadius;
    expect(diagram.locationLabel.map((line) => line.content)).toEqual([
      'North Somercotes -',
      'Lincolnshire',
    ]);
    const active = spec.locationPlacement.ranges.find(
      (r) => r.from === '12:00:00' && r.to === '18:00:00',
    );
    expect(active).toBeDefined();
    if (active == null) return;
    expect(diagram.locationLabel[0].anchor.y).toBeCloseTo(-active.belowOrigin * R, 6);
    expect(diagram.locationLabel[1].anchor.y).toBeCloseTo(
      -active.belowOrigin * R - 0.05 * R,
      6,
    );
    const { scene, styleRuntime } = collaborator.generate(spec);
    const svg = renderSceneSvg(scene, { styleRuntime });
    expect(svg).toContain('data-name="LocationLabel.Line0"');
    expect(svg).toContain('data-name="LocationLabel.Line1"');
  });

  it('places HomeLocationPanel change and share actions on one row inside the plate', () => {
    const collaborator = createDiagramCollaborator();
    const spec = baseSpecForCollaboratorTest();
    const { diagram } = collaborator.generate(spec);
    const R = diagram.refArc.refRadius;
    const panelCfg = (spec as {
      homeLocationPanel: {
        readonly actionFontHeight: number;
        readonly shareLabel: string;
        readonly changeLabel: string;
        readonly gapBeforeSeparator: number;
        readonly gapAfterSeparator: number;
      };
    }).homeLocationPanel;
    const bBottom = diagram.mainLabel.anchor.y - 0.2 * diagram.mainLabel.fontSize;
    const changeWidthK =
      panelCfg.changeLabel.length * panelCfg.actionFontHeight * MONO_LABEL_CHAR_WIDTH_EM;
    const separatorCharWidthK = panelCfg.actionFontHeight * MONO_LABEL_CHAR_WIDTH_EM;
    expect(diagram.homeLocationPanel.label.content).toBe('Location');
    expect(diagram.homeLocationPanel.share.content).toBe(panelCfg.shareLabel);
    expect(diagram.homeLocationPanel.change.content).toBe(panelCfg.changeLabel);
    expect(diagram.homeLocationPanel.separator.content).toBe('·');
    expect(diagram.homeLocationPanel.separator.anchor.x).toBeCloseTo(
      diagram.homeLocationPanel.change.anchor.x +
        (changeWidthK + panelCfg.gapBeforeSeparator) * R,
      6,
    );
    expect(diagram.homeLocationPanel.share.anchor.x).toBeCloseTo(
      diagram.homeLocationPanel.change.anchor.x +
        (changeWidthK +
          panelCfg.gapBeforeSeparator +
          separatorCharWidthK +
          panelCfg.gapAfterSeparator) *
          R,
      6,
    );
    expect(diagram.homeLocationPanel.share.fontSize).toBeCloseTo(
      panelCfg.actionFontHeight * R,
      6,
    );
    expect(diagram.homeLocationPanel.share.anchor.y).toBe(
      diagram.homeLocationPanel.change.anchor.y,
    );
    expect(diagram.homeLocationPanel.change.anchor.x).toBeLessThan(
      diagram.homeLocationPanel.share.anchor.x,
    );
    expect(diagram.homeLocationPanel.plate.center.y).toBeCloseTo(
      bBottom +
        (spec as { homeLocationPanel: { readonly aboveBottom: number; readonly height: number } })
          .homeLocationPanel.aboveBottom *
          R +
        0.5 *
          (spec as { homeLocationPanel: { readonly height: number } }).homeLocationPanel.height *
          R,
      6,
    );
  });

  it('applies layoutBoundsBottomMargin by extending B_bottom (date row and MainLabel shift down)', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const { layoutBoundsBottomMargin: _presetMargin, ...baseNoBottomMargin } = base;
    const without = collaborator.generate(baseNoBottomMargin).diagram;
    const k = 0.03;
    const withMargin = collaborator.generate({ ...baseNoBottomMargin, layoutBoundsBottomMargin: k }).diagram;
    const delta = k * withMargin.refArc.refRadius;
    expect(withMargin.brhcDate.anchor.y - without.brhcDate.anchor.y).toBeCloseTo(-delta, 6);
    expect(withMargin.mainLabel.anchor.y - without.mainLabel.anchor.y).toBeCloseTo(-delta, 6);
  });

  it('throws when layoutBoundsBottomMargin is negative', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    expect(() => collaborator.generate({ ...base, layoutBoundsBottomMargin: -0.01 })).toThrow(
      /layoutBoundsBottomMargin must be >= 0/,
    );
  });

  it('forces Hand time readout half-day layout via civilHalfDayLayout without moving the hand angle', () => {
    const collaborator = createDiagramCollaborator();
    const base = buildDiagramSpec({
      extremesAtLocation: minimalExtremesForCollaboratorTest(),
      timeNow: '15:00:00',
      brhcDatePrefix: FIXTURE_DATE_PREFIX,
      utcIsoToLocalCanonicalTime: utcIsoToLocalCanonicalTimeUtc,
      townName: 'Lymington',
      shareUrl: FIXTURE_SHARE_URL,
    });
    const auto = collaborator.generate(base).diagram;
    const forcedAm = collaborator.generate({ ...base, civilHalfDayLayout: 'beforeNoon' }).diagram;
    expect(auto.hand.armTimeReadout.angleRad).toBeCloseTo(auto.hand.theta, 6);
    expect(forcedAm.hand.armTimeReadout.angleRad).toBeCloseTo(
      auto.hand.theta + Math.PI,
      6,
    );
    expect(auto.hand.theta).toBeCloseTo(forcedAm.hand.theta, 6);
    expect(auto.hand.arm.end.x).toBeCloseTo(forcedAm.hand.arm.end.x, 6);
    expect(auto.hand.arm.end.y).toBeCloseTo(forcedAm.hand.arm.end.y, 6);
  });

  it('throws when civilHalfDayLayout is invalid', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    expect(() => collaborator.generate({ ...base, civilHalfDayLayout: 'morning' })).toThrow(
      /civilHalfDayLayout/,
    );
  });

  it('throws when annularBand is present without annularBandWidth', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const spec = { ...base, annularBand: {} };
    expect(() => collaborator.generate(spec)).toThrow(/annularBandWidth/);
  });

  it('leaves root paint order unchanged when no override is provided', () => {
    const collaborator = createDiagramCollaborator();
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
      'Dividor',
      'TickMark',
      'TideMarks',
      'TickLabel',
      'BRHCBundle',
      'LocationLabel',
      'Brand',
      'HomeMenuTrigger',
      'HomeLocationPanel',
    ]);
  });

  it('applies a valid paint-order before override at root level', () => {
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const spec = {
      ...base,
      paintOrder: {
        overrides: [{ name: 'BRHCBundle', place: 'before' as const, relativeTo: 'RefArc' }],
      },
    };
    const { scene } = collaborator.generate(spec);
    const childNames = scene.root.children
      .filter((child) => child.kind === 'group')
      .map((child) => child.name);
    expect(childNames.indexOf('BRHCBundle')).toBeLessThan(childNames.indexOf('RefArc'));
  });

  it('applies home preset paint-order so Hand sits below all root siblings', () => {
    const collaborator = createDiagramCollaborator();
    const { scene } = collaborator.generate(baseSpecForCollaboratorTest());
    const childNames = scene.root.children
      .filter((child) => child.kind === 'group')
      .map((child) => child.name);
    expect(childNames[0]).toBe('Hand');
    expect(childNames.indexOf('Hand')).toBeLessThan(childNames.indexOf('AnnularBand'));
  });

  it('throws for unknown paint-order names', () => {
    const collaborator = createDiagramCollaborator();
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
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const spec = {
      ...base,
      paintOrder: {
        overrides: [
          { name: 'BRHCBundle', place: 'before' as const, relativeTo: 'RefArc' },
          { name: 'BRHCBundle', place: 'after' as const, relativeTo: 'TickLabel' },
        ],
      },
    };
    expect(() => collaborator.generate(spec)).toThrow(/duplicate paintOrder override/);
  });

  it('moves TimePointer tip inward when tideMarkOuterBandGap is more negative', () => {
    const collaborator = createDiagramCollaborator();
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
    const collaborator = createDiagramCollaborator();
    const base = baseSpecForCollaboratorTest();
    const tideMarks = base.tideMarks as Record<string, unknown>;
    const spec = {
      ...base,
      tideMarks: { ...tideMarks, tideMarkOuterBandGap: -0.2 },
    };
    expect(() => collaborator.generate(spec)).toThrow(/tideMarkOuterBandGap must not be less than/);
  });

});
