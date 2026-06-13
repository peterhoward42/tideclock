/**
 * locationLayoutHour.ts — Dev preview via `?timeNowHour=<0–23>` (see README “Developer previews”).
 * Freezes `timeNow` at a whole hour so **Location** placement presets are easy to inspect.
 */

import type { TideExtremesAtLocation } from "../../core-models/TideExtremesAtLocation";
import { localBrhcDatePrefix } from "../localTimeStrings";

export type LocationLayoutHourClock =
  | {
      readonly kind: "active";
      readonly frozenEpochMs: number;
      readonly timeNow: string;
      readonly brhcDatePrefix: string;
    }
  | {
      readonly kind: "inactive";
      readonly reason: "no-extremes" | "invalid-hour";
    };

function canonicalHour(hour: number): string {
  return `${String(hour).padStart(2, "0")}:00:00`;
}

/**
 * Builds a frozen local instant at `hour:00:00` on the civil day of the first extreme.
 */
export function buildLocationLayoutHourClock(params: {
  readonly hour: number;
  readonly extremesAtLocation: TideExtremesAtLocation;
}): LocationLayoutHourClock {
  const { hour, extremesAtLocation } = params;
  if (!Number.isInteger(hour) || hour < 0 || hour > 23) {
    return { kind: "inactive", reason: "invalid-hour" };
  }
  const { extremes } = extremesAtLocation;
  if (extremes.length === 0) {
    return { kind: "inactive", reason: "no-extremes" };
  }

  const anchor = new Date(extremes[0].timeUtc);
  anchor.setHours(hour, 0, 0, 0);
  anchor.setMilliseconds(0);
  const frozenEpochMs = anchor.getTime();

  return {
    kind: "active",
    frozenEpochMs,
    timeNow: canonicalHour(hour),
    brhcDatePrefix: localBrhcDatePrefix(frozenEpochMs),
  };
}
