// Tide event utilities shared across diagram elements.
// Responsible for deriving “next tide event” and its interval from spec inputs.

import { parseCanonicalTimeOrThrow } from "./timeCanonical.mjs";

/**
 * Format a positive interval in seconds as "<H>h <M>m" with minutes floored.
 *
 * @param {number} seconds
 * @returns {string}
 */
export function formatIntervalHoursMinutes(seconds) {
  const clamped = seconds > 0 ? seconds : 0;
  const totalMinutes = Math.floor(clamped / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${hours}h ${minutes}m`;
}

/**
 * Compute the next tide event at or after `timeNow` within the current civil day.
 * If no marker is at or after `timeNow`, no “next event” is defined and `null` is returned.
 *
 * @param {Record<string, unknown>} spec full diagram spec including timeNow and tideMarks.markers
 * @param {{ canonical: string, seconds: number, hours: number, isRightEndpoint: boolean }} parsedNow
 *   Result of parseCanonicalTimeOrThrow(spec.timeNow, ...)
 * @returns {{ kind: string, intervalText: string } | null}
 */
export function computeNextTideEventFromSpec(spec, parsedNow) {
  const rawTideMarks = /** @type {any} */ (spec.tideMarks);
  const markersRaw = rawTideMarks?.markers;
  if (!Array.isArray(markersRaw) || markersRaw.length === 0) {
    return null;
  }

  /** @type<{ seconds: number, kind: string }[]> */
  const events = [];
  for (const row of markersRaw) {
    if (row == null || typeof row !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (row);
    const time = r.time;
    const kind = r.highOrLow;
    if (typeof time !== "string" || typeof kind !== "string") continue;
    const parsed = parseCanonicalTimeOrThrow(time, "tideMarks.markers[].time");
    if (parsed.isRightEndpoint) continue;
    events.push({ seconds: parsed.seconds, kind });
  }

  if (events.length === 0) {
    return null;
  }

  events.sort((a, b) => a.seconds - b.seconds);

  const nowSeconds = parsedNow.seconds;
  /** @type<{ seconds: number, kind: string } | null> */
  let next = null;
  for (const ev of events) {
    if (ev.seconds >= nowSeconds) {
      next = ev;
      break;
    }
  }
  if (next == null) {
    return null;
  }

  const forwardSeconds = next.seconds - nowSeconds;

  return {
    kind: next.kind,
    intervalText: formatIntervalHoursMinutes(forwardSeconds),
  };
}

