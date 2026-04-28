/**
 * buildDiagramGenerationSpec.ts — Maps domain extremes and local time into `DiagramGenerationSpec` fields.
 * Fed by Home and tests; consumed by diagram-generation. Kind: Pure logic (with injectable time mapping).
 * Does not invoke `buildDiagram` itself. Time-now date/clock placement is derived in diagram-generation
 * from AnnularBand and TickLabels; this module only supplies `timeNowLabel.fontHeight`, `dateAboveTime`, and `timeNowDatePrefix`.
 *
 * Tunable layout numbers live in `diagram-config/homeTideDiagram.preset.ts`.
 */

import { homeTideDiagramLayoutBase } from '../diagram-config';
import type { DiagramTideMarkMarker, HomeDiagramTideMarks } from '../diagram-config';
import type { TideExtreme, TideExtremeType } from '../core-models/TideExtreme';
import type { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import type { TimeOrderedTideExtrema } from '../core-models/TimeOrderedTideExtrema';
import {
  isAtypicalTideExtremaPattern,
  TideExtremaPatternDetection,
} from '../time-services/isAtypicalTideExtremaPattern';
import type { DiagramGenerationSpec } from './diagramGenerationCollaborator';
import type { DerivedNextTideSemantics } from './nextTideSemantics';

export type { DiagramTideMarkMarker, HomeDiagramTideMarks } from '../diagram-config';

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
  /** Stored extremes for the civil day (coordinates identify the place; `extremes` is canonical time-ordered). */
  readonly extremesAtLocation: TideExtremesAtLocation;
  /**
   * When set, adds `spec.semantic.nextTide` (e.g. output of `deriveNextTideSemantics` for the
   * same conceptual spec). When omitted, layout derives next tide from `tideMarks` as usual.
   */
  readonly derivedSemantics?: Pick<DerivedNextTideSemantics, 'nextTide'>;
  /** Display town name for the TimeDelta location stripe. */
  readonly townName: string;
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
  extremes: TimeOrderedTideExtrema,
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
  readonly extremes: TimeOrderedTideExtrema;
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

  const { tideMarksDefaults, ...homeTideDiagramSpecLayout } = homeTideDiagramLayoutBase;

  const tideMarks: HomeDiagramTideMarks = {
    ...tideMarksDefaults,
    ...tideMarksFromExtremes(extremesAtLocation.extremes, utcIsoToLocalCanonicalTime),
  };

  const atypicalTideSummary =
    isAtypicalTideExtremaPattern(extremesAtLocation.extremes) !==
    TideExtremaPatternDetection.IsTypical;

  const timeDelta = {
    ...homeTideDiagramSpecLayout.timeDelta,
    town: townName,
    tidePhasePair: deriveTimeDeltaTidePhasePair({
      extremes: extremesAtLocation.extremes,
      timeNow,
      utcIsoToLocalCanonicalTime,
    }),
    atypicalTideSummary,
  };

  const spec: DiagramGenerationSpec = {
    ...homeTideDiagramSpecLayout,
    timeNow,
    timeNowDatePrefix,
    timeDelta,
    tideMarks,
  };

  if (derivedSemantics !== undefined) {
    spec.semantic = { nextTide: derivedSemantics.nextTide };
  }

  return spec;
}
