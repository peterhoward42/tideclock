/**
 * diagramDevPreviewNoMoreTidesToday.ts — Dev preview `no-more-tides-today` (see docs/planning/diagram-dev-preview-catalog.md).
 * Pure clock patching from civil-day extremes; does not touch fetch or stores.
 */

import type { TideExtreme } from "../../core-models/TideExtreme";
import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
import type { UtcIsoToLocalCanonicalTime } from "../buildDiagramGenerationSpec";
import { localTimeNowDatePrefixFromMs } from "../localWallClockReadoutFromMs";

const CIVIL_DAY_LAST_SECOND = 23 * 3600 + 59 * 60 + 59;

function canonicalTimeToDaySeconds(canonical: string): number {
  const parts = canonical.split(":").map((p) => Number(p));
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    throw new Error(`Invalid canonical time: ${canonical}`);
  }
  const [hh, mm, ss] = parts;
  return hh * 3600 + mm * 60 + ss;
}

function daySecondsToCanonical(total: number): string {
  const hh = Math.floor(total / 3600);
  const mm = Math.floor((total % 3600) / 60);
  const ss = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(hh)}:${pad(mm)}:${pad(ss)}`;
}

function lastExtremeByLatestLocalMarker(params: {
  readonly extremes: readonly TideExtreme[];
  readonly utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime;
}): { readonly extreme: TideExtreme; readonly lastMarkerDaySeconds: number } {
  const { extremes, utcIsoToLocalCanonicalTime } = params;
  let best: TideExtreme = extremes[0];
  let bestSeconds = canonicalTimeToDaySeconds(utcIsoToLocalCanonicalTime(best.timeUtc));
  for (let i = 1; i < extremes.length; i += 1) {
    const e = extremes[i];
    const sec = canonicalTimeToDaySeconds(utcIsoToLocalCanonicalTime(e.timeUtc));
    if (sec > bestSeconds) {
      bestSeconds = sec;
      best = e;
    }
  }
  return { extreme: best, lastMarkerDaySeconds: bestSeconds };
}

export type DiagramDevPreviewNoMoreTidesTodayClock =
  | {
      readonly kind: "active";
      /** Wall-clock instant aligned with `timeNow` / `timeNowDatePrefix` on the last extreme's local civil day. */
      readonly frozenEpochMs: number;
      readonly timeNow: string;
      readonly timeNowDatePrefix: string;
    }
  | {
      readonly kind: "inactive";
      readonly reason: "last-marker-at-end-of-civil-day";
    };

/**
 * Builds a frozen local instant and matching canonical `timeNow` / date prefix so
 * `deriveNextTideSemantics` sees no marker at or after `timeNow` (NoMoreTidesToday branch).
 */
export function buildDiagramDevPreviewNoMoreTidesTodayClock(params: {
  readonly extremesAtLocation: TideExtremesAtLocation;
  readonly utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime;
}): DiagramDevPreviewNoMoreTidesTodayClock {
  const { extremes } = params.extremesAtLocation;
  if (extremes.length === 0) {
    throw new Error(
      "buildDiagramDevPreviewNoMoreTidesTodayClock requires at least one tide extreme",
    );
  }

  const { extreme: lastExtreme, lastMarkerDaySeconds } = lastExtremeByLatestLocalMarker({
    extremes,
    utcIsoToLocalCanonicalTime: params.utcIsoToLocalCanonicalTime,
  });

  const candidateSeconds = Math.min(lastMarkerDaySeconds + 3600, CIVIL_DAY_LAST_SECOND);
  if (candidateSeconds <= lastMarkerDaySeconds) {
    return { kind: "inactive", reason: "last-marker-at-end-of-civil-day" };
  }

  const hh = Math.floor(candidateSeconds / 3600);
  const mm = Math.floor((candidateSeconds % 3600) / 60);
  const ss = candidateSeconds % 60;

  const anchor = new Date(lastExtreme.timeUtc);
  anchor.setHours(hh, mm, ss, 0);
  anchor.setMilliseconds(0);
  const frozenEpochMs = anchor.getTime();

  return {
    kind: "active",
    frozenEpochMs,
    timeNow: daySecondsToCanonical(candidateSeconds),
    timeNowDatePrefix: localTimeNowDatePrefixFromMs(frozenEpochMs),
  };
}
