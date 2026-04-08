/**
 * tideEvents.mjs — Next-tide derivation from markers or injected semantics; shared by pointers and TimeDelta.
 * Kind: Pure logic. Does not place SVG primitives.
 *
 * Tide event utilities shared across diagram elements.
 */

import { parseTideMarksMarkerRowsOrThrow } from "../layout/tideMarks.mjs";
import { requirePlainObject } from "../layout/specRequire.mjs";
import { parseCanonicalTimeOrThrow } from "./timeCanonical.mjs";

/** Omit Now radial line, Now label, and WaitArc when the gap to the next tide is under this many seconds. */
const NEXT_POINTER_OCCLUSION_CLEARANCE_SECONDS = 60 * 60;

/**
 * Optional `spec.semantic.nextTide` from the application minute-scale service
 * (`deriveNextTideSemantics`): when the key is absent, marker-based logic applies; when
 * present, layout skips marker scans.
 *
 * Return policy:
 * - `undefined` — `semantic` missing / not an object, or `nextTide` key absent (fall through to markers).
 * - `null` — explicit `nextTide: null` (no next event; layout does not scan markers for this path).
 * - object — use injected fields; malformed shape throws (fail fast; do not guess).
 *
 * @param {Record<string, unknown>} spec
 * @returns {undefined | null | { secondsSinceMidnight: number, kind: string, timeDeltaIntervalText: string }}
 * @throws {Error} `nextTide` is non-null and not a plain object, or required fields wrong type
 */
export function readOptionalInjectedNextTide(spec) {
  const raw = spec.semantic;
  if (raw == null || typeof raw !== "object") return undefined;
  const o = /** @type {Record<string, unknown>} */ (raw);
  if (!Object.prototype.hasOwnProperty.call(o, "nextTide")) return undefined;
  const nt = o.nextTide;
  if (nt == null) return null;
  if (typeof nt !== "object") {
    throw new Error("spec.semantic.nextTide must be null or an object");
  }
  const t = /** @type {Record<string, unknown>} */ (nt);
  const secondsSinceMidnight = t.secondsSinceMidnight;
  const kind = t.kind;
  const timeDeltaIntervalText = t.timeDeltaIntervalText;
  if (
    typeof secondsSinceMidnight !== "number" ||
    !Number.isFinite(secondsSinceMidnight) ||
    typeof kind !== "string" ||
    typeof timeDeltaIntervalText !== "string"
  ) {
    throw new Error(
      "spec.semantic.nextTide requires secondsSinceMidnight (finite number), kind (string), timeDeltaIntervalText (string)",
    );
  }
  return { secondsSinceMidnight, kind, timeDeltaIntervalText };
}

/**
 * Format an interval in seconds as "<H>h <M>m" with whole minutes floored from a non-negative duration.
 *
 * Non-positive `seconds` are clamped to `0` (same display as “no forward gap”), not thrown.
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
 *
 * Returns `null` when there is no qualifying next event (injected `null`, or no marker at/after
 * `timeNow`). Missing or invalid `tideMarks` / `markers` throw (see {@link parseTideMarksMarkerRowsOrThrow}).
 *
 * @param {Record<string, unknown>} spec full diagram spec including timeNow and tideMarks.markers
 * @param {{ canonical: string, seconds: number, hours: number, isRightEndpoint: boolean }} parsedNow
 * @returns {{ seconds: number, kind: string, intervalText: string } | null}
 */
export function computeNextTideEventFromSpec(spec, parsedNow) {
  const core = computeNextTideEventCore(spec, parsedNow);
  if (core == null) return null;
  const injected = readOptionalInjectedNextTide(spec);
  if (injected !== undefined && injected !== null) {
    return {
      seconds: core.seconds,
      kind: core.kind,
      intervalText: injected.timeDeltaIntervalText,
    };
  }
  const forwardSeconds = core.seconds - parsedNow.seconds;
  return {
    seconds: core.seconds,
    kind: core.kind,
    intervalText: formatIntervalHoursMinutes(forwardSeconds),
  };
}

/**
 * Whether to drop the **Now radial line**, **Now label**, and **WaitArc** so they do not overlap
 * **NextPointer** (same next-marker definition as {@link computeNextTideEventCore}). The **Now
 * triangle** is kept: it sits nearer the dial centre and does not occlude the next-tide ray.
 *
 * True when there is no qualifying next tide today, or when the forward interval from `timeNow`
 * to that event is strictly less than one hour.
 *
 * @param {{ seconds: number }} parsedNow — same shape as `parseCanonicalTimeOrThrow` result
 * @param {{ seconds: number, kind: string } | null} nextCore — result of `computeNextTideEventCore` for the same spec/now
 */
export function shouldOmitNowWaitVisualsForNextPointerClearance(parsedNow, nextCore) {
  if (nextCore == null) return true;
  const forwardSeconds = nextCore.seconds - parsedNow.seconds;
  return forwardSeconds < NEXT_POINTER_OCCLUSION_CLEARANCE_SECONDS;
}

/**
 * Compute the next tide event at or after `timeNow` and return its absolute
 * seconds-since-midnight and kind. Shared core for consumers that need the
 * raw timing rather than just the formatted interval.
 *
 * Returns `null` when injection is `null`, or when no marker falls at or after `parsedNow`.
 * When injection is absent, `spec.tideMarks` and a valid non-empty `markers` array are required;
 * invalid rows throw (same rules as tide layout).
 *
 * @param {Record<string, unknown>} spec
 * @param {{ canonical: string, seconds: number, hours: number, isRightEndpoint: boolean }} parsedNow
 * @returns {{ seconds: number, kind: string } | null}
 */
export function computeNextTideEventCore(spec, parsedNow) {
  const injected = readOptionalInjectedNextTide(spec);
  if (injected !== undefined) {
    if (injected === null) return null;
    return {
      seconds: injected.secondsSinceMidnight,
      kind: injected.kind,
    };
  }
  const tideMarksObj = requirePlainObject(spec.tideMarks, "spec.tideMarks");
  const rows = parseTideMarksMarkerRowsOrThrow(tideMarksObj.markers);

  /** @type{{ seconds: number, kind: string }[]} */
  const events = rows.map((r) => ({ seconds: r.seconds, kind: r.kind }));
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
