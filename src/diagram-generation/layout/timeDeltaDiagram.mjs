/**
 * timeDeltaDiagram.mjs — Time-delta text layout in diagram space (countdown stripes or empty-day three stripes).
 * Fed by spec + shared tide-event helpers. See docs/specs/tide-diagram.md §TimeDelta.
 *
 * Policies for {@link buildTimeDeltaDiagramFromSpec}:
 * - Throws when `spec.timeDelta` is missing or not a plain object.
 * - Throws from {@link parseCanonicalTimeOrThrow} when `spec.timeNow` is invalid; throws when `timeNow` is `24:00:00`.
 * - Throws when `timeDelta.countdownLines` is not an array of four finite `{ belowOrigin, fontHeight }` rows,
 *   or when `timeDelta.emptyMessage` is missing those finite numbers.
 * - Required boolean `timeDelta.atypicalTideSummary`: when `true` and a next tide exists, countdown copy
 *   uses the atypical centre lines (see docs/specs/tide-diagram.md §TimeDelta); **NoMoreTidesToday** is unchanged.
 *
 * {@link layoutTimeDeltaDiagram} is pure geometry + text placement from a resolved {@link TimeDeltaLayout}; it does not read the spec.
 */

import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import { computeNextTideEventFromSpec } from "../model/tideEvents.mjs";
import { requirePlainObject, requireString } from "./specRequire.mjs";

/** Expected length of `spec.timeDelta.countdownLines` (location, phase, next-event interval, next-event clock). */
export const TIME_DELTA_COUNTDOWN_LINE_COUNT = 4;

/** Centre copy when `timeDelta.atypicalTideSummary` is true (countdown mode only). */
export const ATYPICAL_TIDE_SUMMARY_PHASE_LINE = "Tricky tides today";

/**
 * @param {string} eventLabel
 * @param {string} interval
 * @returns {string}
 */
export function formatTimeDeltaNextIntervalLine(eventLabel, interval) {
  return `${eventLabel} in ${interval}`;
}

/**
 * @param {string} nextEventTimeHhmm
 * @returns {string}
 */
export function formatTimeDeltaNextAtLine(nextEventTimeHhmm) {
  return `at ${nextEventTimeHhmm}`;
}

/**
 * @param {'out-low' | 'in-high'} tidePhasePair
 * @returns {string}
 */
export function formatTimeDeltaTomorrowEventLine(tidePhasePair) {
  return tidePhasePair === "out-low" ? "Low tide tomorrow" : "";
}

/**
 * @param {unknown} row
 * @param {string} label
 * @returns {{ belowOrigin: number, fontHeight: number }}
 */
function requireCountdownLineRow(row, label) {
  const o = requirePlainObject(row, label);
  const below = o.belowOrigin;
  const fh = o.fontHeight;
  if (
    typeof below !== "number" ||
    typeof fh !== "number" ||
    !Number.isFinite(below) ||
    !Number.isFinite(fh)
  ) {
    throw new Error(
      `${label} requires finite numbers belowOrigin and fontHeight (RefRadius multiples)`,
    );
  }
  return { belowOrigin: below, fontHeight: fh };
}

/**
 * @typedef {{ belowOrigin: number, fontHeight: number }} TimeDeltaStripeLayoutInput
 *
 * @typedef {object} TimeDeltaLayoutCountdown
 * @property {'countdown'} kind
 * @property {string} town
 * @property {'out-low' | 'in-high'} tidePhasePair
 * @property {string} nextEventTimeHhmm
 * @property {string} interval
 * @property {boolean} atypicalTideSummary
 * @property {readonly TimeDeltaStripeLayoutInput[]} countdownLines
 *
 * @typedef {object} TimeDeltaLayoutEmpty
 * @property {'empty'} kind
 * @property {string} town
 * @property {'out-low' | 'in-high'} tidePhasePair
 * @property {readonly TimeDeltaStripeLayoutInput[]} linesTopThree first three `countdownLines` rows (location, phase, interval-slot baseline for tomorrow copy).
 * @property {number} tomorrowFontHeight `emptyMessage.fontHeight` for the third line only.
 *
 * @typedef {TimeDeltaLayoutCountdown | TimeDeltaLayoutEmpty} TimeDeltaLayout
 */

/**
 * @param {TimeDeltaLayout} timeDeltaLayout
 * @param {number} refRadius
 * @returns {import('../model/tideDiagramModel.mjs').TimeDeltaDiagram}
 */
export function layoutTimeDeltaDiagram(timeDeltaLayout, refRadius) {
  const R = refRadius;
  /** @type {import('../model/tideDiagramModel.mjs').DiagramTextInst[] | null} */
  let countdownStripes = null;
  /** @type {import('../model/tideDiagramModel.mjs').DiagramTextInst[] | null} */
  let timeDeltaEmptyStripes = null;

  if (timeDeltaLayout.kind === "countdown") {
    const lines = timeDeltaLayout.countdownLines;
    /** @type {readonly string[]} */
    let contents;
    if (timeDeltaLayout.atypicalTideSummary === true) {
      contents = [
        "",
        ATYPICAL_TIDE_SUMMARY_PHASE_LINE,
        "",
        "",
      ];
    } else {
      const isOutLow = timeDeltaLayout.tidePhasePair === "out-low";
      const direction = isOutLow ? "going out" : "coming in";
      const eventLabel = isOutLow ? "Low tide" : "High tide";
      contents = [
        "",
        `Tide ${direction}`,
        formatTimeDeltaNextIntervalLine(eventLabel, timeDeltaLayout.interval),
        formatTimeDeltaNextAtLine(timeDeltaLayout.nextEventTimeHhmm),
      ];
    }
    countdownStripes = lines.map((line, i) => ({
      content: /** @type {string} */ (contents[i]),
      fontSize: line.fontHeight * R,
      anchor: { x: 0, y: 0 - line.belowOrigin * R },
      hAlign: "center",
    }));
  } else {
    const lines = timeDeltaLayout.linesTopThree;
    const isOutLow = timeDeltaLayout.tidePhasePair === "out-low";
    const direction = isOutLow ? "going out" : "coming in";
    const tomorrow = formatTimeDeltaTomorrowEventLine(
      timeDeltaLayout.tidePhasePair,
    );
    const contents = ["", `Tide ${direction}`, tomorrow];
    timeDeltaEmptyStripes = [0, 1, 2].map((i) => ({
      content: /** @type {string} */ (contents[i]),
      fontSize:
        (i === 2 ? timeDeltaLayout.tomorrowFontHeight : lines[i].fontHeight) * R,
      anchor: { x: 0, y: 0 - lines[i].belowOrigin * R },
      hAlign: "center",
    }));
  }

  return { countdownStripes, timeDeltaEmptyStripes };
}

/**
 * @param {Record<string, unknown>} spec
 * @param {number} refRadius — resolved from `spec.refRadius` by {@link buildDiagram}
 * @returns {import('../model/tideDiagramModel.mjs').TimeDeltaDiagram}
 * @throws {Error} missing `spec.timeDelta`, invalid `spec.timeNow`, `24:00:00`, or bad `timeDelta` fields
 */
export function buildTimeDeltaDiagramFromSpec(spec, refRadius) {
  const o = requirePlainObject(spec.timeDelta, "spec.timeDelta");

  const parsedNow = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }

  const emptyRaw = o.emptyMessage;
  const emptyO = requirePlainObject(emptyRaw, "spec.timeDelta.emptyMessage");
  const emptyBelow = emptyO.belowOrigin;
  const emptyFh = emptyO.fontHeight;
  if (
    typeof emptyBelow !== "number" ||
    typeof emptyFh !== "number" ||
    !Number.isFinite(emptyBelow) ||
    !Number.isFinite(emptyFh)
  ) {
    throw new Error(
      "spec.timeDelta.emptyMessage requires finite numbers belowOrigin and fontHeight (RefRadius multiples)",
    );
  }

  const rawLines = o.countdownLines;
  if (!Array.isArray(rawLines)) {
    throw new Error("spec.timeDelta.countdownLines must be an array");
  }
  if (rawLines.length !== TIME_DELTA_COUNTDOWN_LINE_COUNT) {
    throw new Error(
      `spec.timeDelta.countdownLines must have length ${TIME_DELTA_COUNTDOWN_LINE_COUNT} (location, phase, next-interval, next-at-time)`,
    );
  }
  /** @type {TimeDeltaStripeLayoutInput[]} */
  const countdownLines = rawLines.map((row, idx) =>
    requireCountdownLineRow(row, `spec.timeDelta.countdownLines[${idx}]`),
  );

  const tdTown = requireString(o.town, "spec.timeDelta.town");
  const tdTidePhasePair = requireString(
    o.tidePhasePair,
    "spec.timeDelta.tidePhasePair",
  );
  if (tdTidePhasePair !== "out-low" && tdTidePhasePair !== "in-high") {
    throw new Error(
      'spec.timeDelta.tidePhasePair must be "out-low" or "in-high"',
    );
  }

  const rawAtypical = o.atypicalTideSummary;
  if (typeof rawAtypical !== "boolean") {
    throw new Error(
      "spec.timeDelta.atypicalTideSummary is required and must be boolean",
    );
  }

  const nextEvent = computeNextTideEventFromSpec(spec, parsedNow);
  const timeDeltaLayout =
    nextEvent == null
      ? {
          kind: "empty",
          town: tdTown,
          tidePhasePair: tdTidePhasePair,
          linesTopThree: countdownLines.slice(0, 3),
          tomorrowFontHeight: emptyFh,
        }
      : {
          kind: "countdown",
          town: tdTown,
          tidePhasePair: tdTidePhasePair,
          nextEventTimeHhmm: `${String(Math.floor(nextEvent.seconds / 3600)).padStart(2, "0")}:${String(Math.floor((nextEvent.seconds % 3600) / 60)).padStart(2, "0")}`,
          interval: nextEvent.intervalText,
          countdownLines,
          atypicalTideSummary: rawAtypical,
        };

  return layoutTimeDeltaDiagram(timeDeltaLayout, refRadius);
}
