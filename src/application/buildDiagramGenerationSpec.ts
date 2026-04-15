/**
 * buildDiagramGenerationSpec.ts — Maps domain extremes and local time into `DiagramGenerationSpec` fields.
 * Fed by Home and tests; consumed by diagram-generation. Kind: Pure logic (with injectable time mapping).
 * Does not invoke `buildDiagram` itself. Time-now date/clock placement is derived in diagram-generation
 * from AnnularBand and TickLabels; this module only supplies `timeNowLabel.fontHeight`, `dateAboveTime`, and `timeNowDatePrefix`.
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
  /** Local civil-day prefix for the TimeNowDate element (e.g. "Wed 21 Jun"). */
  readonly timeNowDatePrefix: string;
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
  /** Display town name for the TimeDelta location stripe. */
  readonly townName: string;
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
  readonly nowPointer: {
    readonly radialLine: { readonly outerRadius: number };
    readonly label: { readonly size: number; readonly normalOffset: number };
    readonly triangle: { readonly subtendedAngleRad: number };
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
    readonly fontHeight: number;
    /** k·RefRadius: date baseline is this far above (+Y) the clock baseline (tick-label-min Y). */
    readonly dateAboveTime: number;
  };
  readonly centreFrame: { readonly frameArcRadius: number };
  /** k·RefRadius; concentric arc inside RefArc, same angular span as RefArc. */
  readonly insideTrackRadius: number;
  readonly timeDelta: {
    /** Three stripes: location name, tide phase line, next-event line (see tide-diagram §TimeDelta). */
    readonly countdownLines: readonly {
      readonly belowOrigin: number;
      readonly fontHeight: number;
    }[];
    /** Baseline and font for **NoMoreTidesToday** when there is no next tide on the civil day. */
    readonly emptyMessage: { readonly belowOrigin: number; readonly fontHeight: number };
    readonly town: string;
    readonly tidePhasePair: 'out-low' | 'in-high';
  };
  readonly annularBand: { readonly annularBandWidth: number };
};

const HOME_TIDE_DIAGRAM_LAYOUT_BASE: HomeTideDiagramLayoutBase = {
  title: 'home-tide-diagram',
  canvas: { width: 420, height: 320 },
  refRadius: 118,
  sweepRad: Math.PI,
  tickLen: 0.02,
  tickLabelHours: [0, 3, 6, 9, 12, 15, 18, 21],
  tickLabelSize: 0.04,
  tickLabelClearance: 0.07,
  nowPointer: {
    radialLine: { outerRadius: 0.7 },
    label: { size: 0.03, normalOffset: 0.02 },
    triangle: { subtendedAngleRad: Math.PI / 5 },
  },
  nextPointer: {
    radialLine: { outerRadius: 0.73 },
  },
  waitArc: {
    radius: 0.68,
    arrow: {
      lengthK: 24,
      widthK: 10,
      insetK: 0,
      style: 'filled',
      scaleWithStroke: true,
    },
  },
  timeNowLabel: { fontHeight: 0.05, dateAboveTime: 0.05 },
  centreFrame: { frameArcRadius: 0.45 },
  insideTrackRadius: 0.77,
  timeDelta: {
    countdownLines: [
      { belowOrigin: 0.150, fontHeight: 0.032 },
      { belowOrigin: 0.235, fontHeight: 0.030 },
      { belowOrigin: 0.320, fontHeight: 0.030 },
    ],
    emptyMessage: { belowOrigin: 0.08, fontHeight: 0.038 },
    town: 'Unset',
    tidePhasePair: 'out-low',
  },
  annularBand: { annularBandWidth: 0.05 },
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

type TidePhasePair = 'out-low' | 'in-high';

function canonicalTimeToSeconds(time: string): number {
  const [hh, mm, ss] = time.split(':').map((part) => Number(part));
  return hh * 3600 + mm * 60 + ss;
}

function oppositeTidePhasePair(pair: TidePhasePair): TidePhasePair {
  return pair === 'in-high' ? 'out-low' : 'in-high';
}

function phasePairFromSegmentHeightDelta(
  earlier: TideExtreme,
  later: TideExtreme,
): TidePhasePair {
  return later.heightMetres > earlier.heightMetres ? 'in-high' : 'out-low';
}

export function deriveTimeDeltaTidePhasePair(params: {
  readonly extremes: readonly TideExtreme[];
  readonly timeNow: string;
  readonly utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime;
}): TidePhasePair {
  const { extremes, timeNow, utcIsoToLocalCanonicalTime } = params;
  if (extremes.length === 0) {
    throw new Error('deriveTimeDeltaTidePhasePair requires at least one tide extreme');
  }

  const anchorSegmentPair: TidePhasePair =
    extremes.length >= 2 ? phasePairFromSegmentHeightDelta(extremes[0], extremes[1]) : 'out-low';
  if (extremes.length === 1) {
    return anchorSegmentPair;
  }

  const markerTimes = extremes.map((e) => canonicalTimeToSeconds(utcIsoToLocalCanonicalTime(e.timeUtc)));
  const nowSeconds = canonicalTimeToSeconds(timeNow);

  if (nowSeconds < markerTimes[0]) {
    return oppositeTidePhasePair(anchorSegmentPair);
  }

  for (let i = 0; i < markerTimes.length - 1; i += 1) {
    if (nowSeconds < markerTimes[i + 1]) {
      return phasePairFromSegmentHeightDelta(extremes[i], extremes[i + 1]);
    }
  }

  const finalDefinedSegmentPair = phasePairFromSegmentHeightDelta(
    extremes[extremes.length - 2],
    extremes[extremes.length - 1],
  );
  return oppositeTidePhasePair(finalDefinedSegmentPair);
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
  const {
    extremesAtLocation,
    timeNow,
    timeNowDatePrefix,
    utcIsoToLocalCanonicalTime,
    derivedSemantics,
    townName,
  } = params;
  if (extremesAtLocation.extremes.length === 0) {
    throw new Error('buildDiagramGenerationSpec requires at least one tide extreme');
  }

  const tideMarks: HomeDiagramTideMarks = {
    tideHeightLabelRadius: 0.9,
    tideTimeLabelRadius: 0.821,
    tideHeightLabelSize: 0.045,
    tideTimeLabelSize: 0.045,
    tideMarkArrowDivergence: 0.8,
    tideMarkArrowLineLen: 0.045,
    ...tideMarksFromExtremes(extremesAtLocation.extremes, utcIsoToLocalCanonicalTime),
  };

  const spec: DiagramGenerationSpec = {
    ...HOME_TIDE_DIAGRAM_LAYOUT_BASE,
    timeNow,
    timeNowDatePrefix,
    timeDelta: {
      ...HOME_TIDE_DIAGRAM_LAYOUT_BASE.timeDelta,
      town: townName,
      tidePhasePair: deriveTimeDeltaTidePhasePair({
        extremes: extremesAtLocation.extremes,
        timeNow,
        utcIsoToLocalCanonicalTime,
      }),
    },
    tideMarks,
  };

  if (derivedSemantics !== undefined) {
    spec.semantic = { nextTide: derivedSemantics.nextTide };
  }

  return spec;
}
