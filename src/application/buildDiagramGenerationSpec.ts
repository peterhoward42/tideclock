/**
 * buildDiagramGenerationSpec.ts — Maps domain extremes and local time into `DiagramGenerationSpec` fields.
 * Fed by Home and tests; consumed by diagram-generation. Kind: Pure logic (with injectable time mapping).
 * Does not invoke `buildDiagram` itself.
 */

import type { TideExtreme, TideExtremeType } from '../core-models/TideExtreme';
import type { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import type { DiagramGenerationSpec } from './diagramGenerationCollaborator';
import type { DerivedNextTideSemantics } from './nextTideSemantics';

/**
 * Maps each extreme's `timeUtc` (ISO string) to diagram-local canonical `HH:MM:SS`.
 * Tests inject a fixed interpretation (e.g. UTC components); the host uses local civil time.
 */
export type UtcIsoToLocalCanonicalTime = (timeUtcIso: string) => string;

/**
 * Clock face input for the diagram: canonical `HH:MM:SS` on the dial and how each extreme’s
 * UTC instant maps into that same canonical local civil timeline.
 */
export type BuildDiagramGenerationSpecTimeInput = {
  readonly timeNow: string;
  readonly utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime;
};

export type BuildDiagramGenerationSpecParams = BuildDiagramGenerationSpecTimeInput & {
  /** Stored extremes for the civil day (coordinates identify the place; list order is snapshot order). */
  readonly extremesAtLocation: TideExtremesAtLocation;
  /**
   * When set, adds `spec.semantic.nextTide` (e.g. output of `deriveNextTideSemantics` for the
   * same conceptual spec). When omitted, layout derives next tide from `tideMarks` as usual.
   */
  readonly derivedSemantics?: Pick<DerivedNextTideSemantics, 'nextTide'>;
};

/** One row in `tideMarks.markers` consumed by diagram-generation. */
export type DiagramTideMarkMarker = {
  readonly time: string;
  readonly heightText: string;
  readonly highOrLow: string;
};

/** Layout constants plus marker rows for the Home tide diagram `spec.tideMarks` object. */
export type HomeDiagramTideMarks = {
  readonly tideHeightLabelRadius: number;
  readonly tideTimeLabelRadius: number;
  readonly tideHeightLabelSize: number;
  readonly tideTimeLabelSize: number;
  readonly tideMarkArrowDivergence: number;
  readonly tideMarkArrowLineLen: number;
  readonly markers: readonly DiagramTideMarkMarker[];
};

/** Static layout/geometry for the Home tide diagram (canonical values live in this object). */
type HomeTideDiagramLayoutBase = {
  readonly title: 'home-tide-diagram';
  readonly canvas: { readonly width: number; readonly height: number };
  readonly refRadius: number;
  readonly sweepRad: number;
  readonly tickLen: number;
  readonly tickLabelHours: readonly number[];
  readonly tickLabelSize: number;
  readonly tickLabelClearance: number;
  readonly contentBounds: {
    readonly left: number;
    readonly right: number;
    readonly above: number;
    readonly below: number;
  };
  readonly nowPointer: {
    readonly radialLine: { readonly outerRadius: number };
    readonly label: { readonly size: number; readonly normalOffset: number };
    readonly triangle: { readonly radius: number; readonly baseLen: number; readonly height: number };
  };
  readonly nextPointer: {
    readonly radialLine: { readonly outerRadius: number };
  };
  readonly waitArc: {
    readonly radius: number;
    readonly arrow: {
      readonly lengthK: number;
      readonly widthK: number;
      readonly insetK: number;
      readonly style: 'filled';
      readonly scaleWithStroke: boolean;
    };
  };
  readonly timeNowLabel: {
    readonly x: number;
    readonly fontHeight: number;
    readonly y: number;
  };
  readonly centreFrame: { readonly frameArcRadius: number };
  readonly timeDelta: { readonly x: number; readonly y: number; readonly fontHeight: number };
};

const HOME_TIDE_DIAGRAM_LAYOUT_BASE: HomeTideDiagramLayoutBase = {
  title: 'home-tide-diagram',
  canvas: { width: 420, height: 320 },
  refRadius: 118,
  sweepRad: 2.75,
  tickLen: 0.07,
  tickLabelHours: [0, 3, 6, 9, 12, 15, 18, 21],
  tickLabelSize: 0.04,
  tickLabelClearance: 0.07,
  contentBounds: { left: 1.45, right: 1.15, above: 0.1, below: 1.5 },
  nowPointer: {
    radialLine: { outerRadius: 0.7 },
    label: { size: 0.04, normalOffset: 0.02 },
    triangle: { radius: 1.1, baseLen: 0.08, height: 0.03 },
  },
  nextPointer: {
    radialLine: { outerRadius: 0.73 },
  },
  waitArc: {
    radius: 0.68,
    arrow: {
      lengthK: 20,
      widthK: 8,
      insetK: 0,
      style: 'filled',
      scaleWithStroke: true,
    },
  },
  timeNowLabel: { x: 1.05, fontHeight: 0.04, y: 1.2 },
  centreFrame: { frameArcRadius: 0.35 },
  timeDelta: { x: -1, y: -0.1, fontHeight: 0.05 },
};

function highOrLowFromExtremeType(type: TideExtremeType): string {
  return type === 'high' ? 'High' : 'Low';
}

/** Tide height labels for the diagram (e.g. "4.7 m", "0.94 m"). */
export function formatTideHeightMetresForDiagram(metres: number): string {
  const rounded = Math.round(metres * 100) / 100;
  const text = Number.isInteger(rounded)
    ? String(rounded)
    : rounded.toFixed(2).replace(/\.?0+$/, '');
  return `${text} m`;
}

function tideMarksFromExtremes(
  extremes: readonly TideExtreme[],
  utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime,
): { readonly markers: readonly DiagramTideMarkMarker[] } {
  return {
    markers: extremes.map((e) => ({
      time: utcIsoToLocalCanonicalTime(e.timeUtc),
      heightText: formatTideHeightMetresForDiagram(e.heightMetres),
      highOrLow: highOrLowFromExtremeType(e.type),
    })),
  };
}

/** Local civil clock from UTC instant using the runtime timezone (`Date` local fields). */
export function utcIsoToLocalCanonicalTimeLocal(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  const ss = String(d.getSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/** Deterministic mapping for tests: canonical time from UTC calendar fields. */
export function utcIsoToLocalCanonicalTimeUtc(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getUTCHours()).padStart(2, '0');
  const mm = String(d.getUTCMinutes()).padStart(2, '0');
  const ss = String(d.getUTCSeconds()).padStart(2, '0');
  return `${hh}:${mm}:${ss}`;
}

/**
 * Assembles a {@link DiagramGenerationSpec} for {@link createDiagramGenerationCollaborator}
 * from stored civil-day extremes, canonical `timeNow`, and optional injected next-tide semantics.
 */
export function buildDiagramGenerationSpec(
  params: BuildDiagramGenerationSpecParams,
): DiagramGenerationSpec {
  const { extremesAtLocation, timeNow, utcIsoToLocalCanonicalTime, derivedSemantics } = params;
  if (extremesAtLocation.extremes.length === 0) {
    throw new Error('buildDiagramGenerationSpec requires at least one tide extreme');
  }

  const tideMarks: HomeDiagramTideMarks = {
    tideHeightLabelRadius: 0.88,
    tideTimeLabelRadius: 0.8,
    tideHeightLabelSize: 0.046,
    tideTimeLabelSize: 0.04,
    tideMarkArrowDivergence: 1.0,
    tideMarkArrowLineLen: 0.05,
    ...tideMarksFromExtremes(extremesAtLocation.extremes, utcIsoToLocalCanonicalTime),
  };

  const spec: DiagramGenerationSpec = {
    ...HOME_TIDE_DIAGRAM_LAYOUT_BASE,
    timeNow,
    tideMarks,
  };

  if (derivedSemantics !== undefined) {
    spec.semantic = { nextTide: derivedSemantics.nextTide };
  }

  return spec;
}
