/**
 * atypicalTideDay.ts — Dev preview `atypical-tide-day` (see README “Developer previews”).
 * Replaces the civil-day extremes with a deterministic five-extrema snapshot on the same local calendar day as the
 * loaded first extreme, then freezes “now” in the mid-afternoon gap so countdown copy uses the atypical branch.
 */

import { TideExtreme } from "../../core-models/TideExtreme";
import { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
import { type TimeOrderedTideExtrema, toTimeOrderedTideExtrema } from "../../core-models/TimeOrderedTideExtrema";
import {
  classifyExtremaPattern,
  ExtremaPatternDetection,
} from "../../time-services/extremaPattern";

/** Local marker schedule (Bournemouth-style busy day shape); matches buildDiagramSpec tests. */
const ATYPICAL_DAY_LOCAL_SCHEDULE: readonly {
  readonly type: "high" | "low";
  readonly hh: number;
  readonly mm: number;
  readonly ss: number;
  readonly heightMetres: number;
}[] = [
  { type: "low", hh: 4, mm: 15, ss: 0, heightMetres: 0.94 },
  { type: "high", hh: 10, mm: 45, ss: 0, heightMetres: 4.7 },
  { type: "low", hh: 16, mm: 59, ss: 24, heightMetres: 0.89 },
  { type: "high", hh: 23, mm: 6, ss: 0, heightMetres: 4.8 },
  { type: "low", hh: 23, mm: 50, ss: 0, heightMetres: 0.95 },
];

/** Local civil time between the third and fourth markers so a next tide exists and countdown layout applies. */
const PREVIEW_CLOCK_LOCAL = { hh: 19, mm: 20, ss: 3 } as const;

function syntheticExtremesOnLocalCivilDayOfFirstExtreme(
  extremesAtLocation: TideExtremesAtLocation,
): TimeOrderedTideExtrema {
  const anchor = new Date(extremesAtLocation.extremes[0].timeUtc);
  return toTimeOrderedTideExtrema(ATYPICAL_DAY_LOCAL_SCHEDULE.map(
    ({ type, hh, mm, ss, heightMetres }) => {
      const instant = new Date(anchor);
      instant.setHours(hh, mm, ss, 0);
      instant.setMilliseconds(0);
      return new TideExtreme(type, instant.toISOString(), heightMetres);
    },
  ));
}

export type AtypicalTideDayPreview =
  | {
      readonly kind: "active";
      readonly extremesAtLocation: TideExtremesAtLocation;
      readonly frozenEpochMs: number;
    }
  | {
      readonly kind: "inactive";
      readonly reason: "no-extremes";
    };

/**
 * Materialises a five-extrema atypical civil day (coordinates preserved) and a frozen instant with countdown semantics.
 */
export function buildAtypicalTideDayPreview(params: {
  readonly extremesAtLocation: TideExtremesAtLocation;
}): AtypicalTideDayPreview {
  const { extremesAtLocation } = params;
  if (extremesAtLocation.extremes.length === 0) {
    return { kind: "inactive", reason: "no-extremes" };
  }

  const synthetic = syntheticExtremesOnLocalCivilDayOfFirstExtreme(extremesAtLocation);
  const detection = classifyExtremaPattern(synthetic);
  if (detection === ExtremaPatternDetection.IsTypical) {
    throw new Error(
      "buildAtypicalTideDayPreview: synthetic fixture must be atypical (check schedule vs detector)",
    );
  }

  const patched = new TideExtremesAtLocation(
    extremesAtLocation.latitude,
    extremesAtLocation.longitude,
    synthetic,
  );

  const clockAnchor = new Date(synthetic[0].timeUtc);
  clockAnchor.setHours(
    PREVIEW_CLOCK_LOCAL.hh,
    PREVIEW_CLOCK_LOCAL.mm,
    PREVIEW_CLOCK_LOCAL.ss,
    0,
  );
  clockAnchor.setMilliseconds(0);
  const frozenEpochMs = clockAnchor.getTime();

  return {
    kind: "active",
    extremesAtLocation: patched,
    frozenEpochMs,
  };
}
