// Tide event utilities shared across diagram elements.
// Responsible for deriving next tide event and its interval from spec inputs.

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
 * If no marker is at or after `timeNow`, no next event is defined and `null` is returned.
 *
 * @param {Record<string, unknown>} spec full diagram spec including timeNow and tideMarks.markers
 * @param {{ canonical: string, seconds: number, hours: number, isRightEndpoint: boolean }} parsedNow
 * @returns {{ kind: string, intervalText: string } | null}
 */
export function computeNextTideEventFromSpec(spec, parsedNow) {
  const core = computeNextTideEventCore(spec, parsedNow);
  if (core == null) return null;

  const forwardSeconds = core.seconds - parsedNow.seconds;

  return {
    kind: core.kind,
    intervalText: formatIntervalHoursMinutes(forwardSeconds),
  };
}

/**
 * Compute the next tide event at or after `timeNow` and return its absolute
 * seconds-since-midnight and kind. Shared core for consumers that need the
 * raw timing rather than just the formatted interval.
 *
 * @param {Record<string, unknown>} spec
 * @param {{ canonical: string, seconds: number, hours: number, isRightEndpoint: boolean }} parsedNow
 * @returns {{ seconds: number, kind: string } | null}
 */
export function computeNextTideEventCore(spec, parsedNow) {
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
  /** @type{{ seconds: number, kind: string } | null} */
  let next = null;
  for (const ev of events) {
    if (ev.seconds >= nowSeconds) {
      next = ev;
      break;
    }
  }
  return next;
}
