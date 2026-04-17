/**
 * diagramDevPreviewTimeDeltaShort.ts — Dev preview `time-delta-short` (see docs/planning/diagram-dev-preview-catalog.md).
 * Pure clock patching from civil-day extremes; does not touch fetch or stores.
 *
 * Intent: freeze `timeNow` a few minutes before the *next* tide so that
 * occlusion rules on NowPointer / TimeDelta apply (e.g. Now label + radial line omitted).
 */

import type { TideExtreme } from "../../core-models/TideExtreme";
import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
import type { TimeOrderedTideExtrema } from "../../core-models/TimeOrderedTideExtrema";
import type { UtcIsoToLocalCanonicalTime } from "../buildDiagramGenerationSpec";
import { localTimeNowDatePrefixFromMs } from "../localWallClockReadoutFromMs";

const FIVE_MINUTES_SECONDS = 5 * 60;
const FOUR_MINUTES_SECONDS = 4 * 60;

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

function earliestExtremeByLocalMarker(params: {
  readonly extremes: TimeOrderedTideExtrema;
  readonly utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime;
}): { readonly extreme: TideExtreme; readonly markerDaySeconds: number } {
  const { extremes, utcIsoToLocalCanonicalTime } = params;
  let best: TideExtreme = extremes[0];
  let bestSeconds = canonicalTimeToDaySeconds(
    utcIsoToLocalCanonicalTime(best.timeUtc),
  );
  for (let i = 1; i < extremes.length; i += 1) {
    const e = extremes[i];
    const sec = canonicalTimeToDaySeconds(utcIsoToLocalCanonicalTime(e.timeUtc));
    if (sec < bestSeconds) {
      bestSeconds = sec;
      best = e;
    }
  }
  return { extreme: best, markerDaySeconds: bestSeconds };
}

export type DiagramDevPreviewTimeDeltaShortClock =
  | {
      readonly kind: "active";
      /** Wall-clock instant aligned with `timeNow` / `timeNowDatePrefix` on the civil day of the chosen next extreme. */
      readonly frozenEpochMs: number;
      readonly timeNow: string;
      readonly timeNowDatePrefix: string;
    }
  | {
      readonly kind: "inactive";
      readonly reason: "no-extremes";
    };

/**
 * Builds a frozen local instant a few minutes before the next tide marker so
 * occlusion thresholds (< 1h, < 5min) apply for the countdown / NowPointer.
 *
 * For now we anchor to the *first* extreme of the civil day and back off by
 * four minutes. This guarantees a < 5 minute interval to that marker, so both
 * Now label and Now radial line are omitted in the diagram semantics.
 */
export function buildDiagramDevPreviewTimeDeltaShortClock(params: {
  readonly extremesAtLocation: TideExtremesAtLocation;
  readonly utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime;
}): DiagramDevPreviewTimeDeltaShortClock {
  const { extremes } = params.extremesAtLocation;
  if (extremes.length === 0) {
    return { kind: "inactive", reason: "no-extremes" };
  }

  const {
    extreme: nextExtreme,
    markerDaySeconds,
  } = earliestExtremeByLocalMarker({
    extremes,
    utcIsoToLocalCanonicalTime: params.utcIsoToLocalCanonicalTime,
  });

  // Back off by four minutes so that the gap to the marker is < 5 minutes.
  const candidateSeconds = Math.max(0, markerDaySeconds - FOUR_MINUTES_SECONDS);
  const delta = markerDaySeconds - candidateSeconds;
  if (delta <= 0 || delta >= FIVE_MINUTES_SECONDS) {
    // Defensive guard: the construction above should always yield 0 < delta < 5min.
    // If it doesn't, mark the preview inactive rather than guessing.
    return { kind: "inactive", reason: "no-extremes" };
  }

  const hh = Math.floor(candidateSeconds / 3600);
  const mm = Math.floor((candidateSeconds % 3600) / 60);
  const ss = candidateSeconds % 60;

  const anchor = new Date(nextExtreme.timeUtc);
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

