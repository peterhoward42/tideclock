/**
 * buildDiagramSpec.ts — Maps domain extremes and local time into `DiagramSpec` fields.
 * Fed by Home and tests; consumed by diagram-generation. Kind: Pure logic (with injectable time mapping).
 * Does not invoke `buildDiagram` itself. Time-now date/clock placement is derived in diagram-generation
 * from AnnularBand and TickLabels; this module only supplies `brhcBundle.fontHeight`, `dateAboveTime`,
 * and `brhcLocation`/`brhcDatePrefix`.
 *
 * Tunable layout numbers live in `diagram-config/homeLayout.preset.ts`.
 */

import { homeLayoutBase } from '../diagram-config';
import type { HomeTideMarks, TideMarkMarker } from '../diagram-config';
import type { TideExtremeType } from '../core-models/TideExtreme';
import type { TideExtremesAtLocation } from '../core-models/TideExtremesAtLocation';
import type { TimeOrderedTideExtrema } from '../core-models/TimeOrderedTideExtrema';
import {
  classifyExtremaPattern,
  ExtremaPatternDetection,
} from '../time-services/extremaPattern';
import type { DiagramSpec } from './diagramCollaborator';
import type { DerivedNextTideSemantics } from './nextTideSemantics';

export type { HomeTideMarks, TideMarkMarker } from '../diagram-config';

/**
 * Maps each extreme's `timeUtc` (ISO string) to diagram-local canonical `HH:MM:SS`.
 * Tests inject a fixed interpretation (e.g. UTC components); the host uses local civil time.
 */
export type UtcIsoToLocalCanonicalTime = (timeUtcIso: string) => string;

/**
 * Clock face input for the diagram: canonical `HH:MM:SS` on the dial and how each extreme’s
 * UTC instant maps into that same canonical local civil timeline.
 */
export type BuildDiagramSpecTimeInput = {
  readonly timeNow: string;
  /** Local civil-day prefix for the **BRHCDate** row (e.g. "Wed 21 Jun"). */
  readonly brhcDatePrefix: string;
  readonly utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime;
};

export type BuildDiagramSpecParams = BuildDiagramSpecTimeInput & {
  /** Stored extremes for the civil day (coordinates identify the place; `extremes` is canonical time-ordered). */
  readonly extremesAtLocation: TideExtremesAtLocation;
  /**
   * When set, adds `spec.semantic.nextTide` (e.g. output of `deriveNextTideSemantics` for the
   * same conceptual spec). When omitted, layout derives next tide from `tideMarks` as usual.
   */
  readonly derivedSemantics?: Pick<DerivedNextTideSemantics, 'nextTide'>;
  /** Display town name for the **BRHCLocation** row. */
  readonly townName: string;
};

function highOrLowFromExtremeType(type: TideExtremeType): string {
  return type === 'high' ? 'High' : 'Low';
}

/** Tide height labels for the diagram (e.g. "4.70 m", "1.00 m"). Always two decimal places. */
export function formatTideHeightMetres(metres: number): string {
  const rounded = Math.round(metres * 100) / 100;
  return `${rounded.toFixed(2)} m`;
}

function tideMarksFromExtremes(
  extremes: TimeOrderedTideExtrema,
  utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime,
): { readonly markers: readonly TideMarkMarker[] } {
  return {
    markers: extremes.map((e) => ({
      time: utcIsoToLocalCanonicalTime(e.timeUtc),
      heightText: formatTideHeightMetres(e.heightMetres),
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
 * Assembles a {@link DiagramSpec} for {@link createDiagramCollaborator}
 * from stored civil-day extremes, canonical `timeNow`, and optional injected next-tide semantics.
 */
export function buildDiagramSpec(
  params: BuildDiagramSpecParams,
): DiagramSpec {
  const {
    extremesAtLocation,
    timeNow,
    brhcDatePrefix,
    utcIsoToLocalCanonicalTime,
    derivedSemantics,
    townName,
  } = params;
  if (extremesAtLocation.extremes.length === 0) {
    throw new Error('buildDiagramSpec requires at least one tide extreme');
  }

  const { tideMarksDefaults, ...layoutWithoutTideMarkRows } = homeLayoutBase;

  const tideMarks: HomeTideMarks = {
    ...tideMarksDefaults,
    ...tideMarksFromExtremes(extremesAtLocation.extremes, utcIsoToLocalCanonicalTime),
  };
  const atypicalTideSummary =
    classifyExtremaPattern(extremesAtLocation.extremes) !==
    ExtremaPatternDetection.IsTypical;

  const spec: DiagramSpec = {
    ...layoutWithoutTideMarkRows,
    timeNow,
    brhcDatePrefix,
    brhcLocation: townName,
    tideMarks,
  };

  spec.semantic =
    derivedSemantics === undefined
      ? { atypicalTideSummary }
      : { atypicalTideSummary, nextTide: derivedSemantics.nextTide };

  return spec;
}
