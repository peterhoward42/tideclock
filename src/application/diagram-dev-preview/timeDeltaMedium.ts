/**
 * timeDeltaMedium.ts — Dev preview `time-delta-medium` (see docs/planning/diagram-dev-preview-catalog.md).
 * Pure clock patching from civil-day extremes; does not touch fetch or stores.
 *
 * Intent: freeze `timeNow` within the short window before the next tide where
 * the Now label is omitted but the Now radial line remains (5 minutes ≤ Δt < 1 hour).
 */

import type { TideExtreme } from "../../core-models/TideExtreme";
import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
import type { TimeOrderedTideExtrema } from "../../core-models/TimeOrderedTideExtrema";
import type { UtcIsoToLocalCanonicalTime } from "../buildDiagramSpec";
import { localBrhcDatePrefix } from "../localTimeStrings";

const ONE_HOUR_SECONDS = 60 * 60;
const FIVE_MINUTES_SECONDS = 5 * 60;
const TEN_MINUTES_SECONDS = 10 * 60;

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

export type TimeDeltaMediumClock =
  | {
      readonly kind: "active";
      /** Wall-clock instant aligned with `timeNow` / `brhcDatePrefix` on the civil day of the chosen next extreme. */
      readonly frozenEpochMs: number;
      readonly timeNow: string;
      readonly brhcDatePrefix: string;
    }
  | {
      readonly kind: "inactive";
      readonly reason: "no-extremes";
    };

/**
 * Builds a frozen local instant such that the interval to the next tide marker
 * satisfies 5 minutes ≤ Δt < 1 hour. We anchor to the first extreme of the
 * civil day and place `timeNow` ten minutes before that marker so that:
 *
 * - Δt = 10 minutes ⇒ Now label omitted (Δt < 1 hour),
 * - Now radial line still present (Δt ≥ 5 minutes).
 */
export function buildTimeDeltaMediumClock(params: {
  readonly extremesAtLocation: TideExtremesAtLocation;
  readonly utcIsoToLocalCanonicalTime: UtcIsoToLocalCanonicalTime;
}): TimeDeltaMediumClock {
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

  // Place timeNow ten minutes before the marker. We expect 5min ≤ Δt < 1h.
  const candidateSeconds = Math.max(0, markerDaySeconds - TEN_MINUTES_SECONDS);
  const delta = markerDaySeconds - candidateSeconds;
  if (
    delta < FIVE_MINUTES_SECONDS ||
    delta >= ONE_HOUR_SECONDS
  ) {
    // Defensive guard: if the simple construction fails the intended window,
    // mark the preview inactive rather than guessing.
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
    brhcDatePrefix: localBrhcDatePrefix(frozenEpochMs),
  };
}
