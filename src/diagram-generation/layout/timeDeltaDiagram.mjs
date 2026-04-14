/**
 * timeDeltaDiagram.mjs — Time-delta text layout in diagram space (countdown stripes or empty-day message).
 * Fed by spec + shared tide-event helpers. See docs/specs/tide-diagram.md §TimeDelta.
 *
 * Policies for {@link buildTimeDeltaDiagramFromSpec}:
 * - Throws when `spec.timeDelta` is missing or not a plain object.
 * - Throws from {@link parseCanonicalTimeOrThrow} when `spec.timeNow` is invalid; throws when `timeNow` is `24:00:00`.
 * - Throws when `timeDelta.countdownLines` is not an array of three finite `{ belowOrigin, fontHeight }` rows,
 *   or when `timeDelta.emptyMessage` is missing those finite numbers.
 *
 * {@link layoutTimeDeltaDiagram} is pure geometry + text placement from a resolved {@link TimeDeltaLayout}; it does not read the spec.
 */

import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import { computeNextTideEventFromSpec } from "../model/tideEvents.mjs";
import { requirePlainObject, requireString } from "./specRequire.mjs";

/** Fixed copy when no tide remains on the civil day (docs/specs/tide-diagram.md §TimeDelta). */
export const TIME_DELTA_EMPTY_MESSAGE = "No further tides today";

/** Expected length of `spec.timeDelta.countdownLines` (location, phase, next-event). */
export const TIME_DELTA_COUNTDOWN_LINE_COUNT = 3;

/**
 * @param {string} eventLabel
 * @param {string} interval
 * @param {string} nextEventTimeHhmm
 * @returns {string}
 */
export function formatTimeDeltaNextStripeContent(
  eventLabel,
  interval,
  nextEventTimeHhmm,
) {
  return `${eventLabel} in ${interval} (${nextEventTimeHhmm})`;
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
 * @property {readonly TimeDeltaStripeLayoutInput[]} countdownLines
 *
 * @typedef {object} TimeDeltaLayoutEmpty
 * @property {'empty'} kind
 * @property {number} belowOrigin
 * @property {number} fontHeight
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
  /** @type {import('../model/tideDiagramModel.mjs').DiagramTextInst | null} */
  let timeDeltaEmptyMessage = null;

  if (timeDeltaLayout.kind === "countdown") {
    const isOutLow = timeDeltaLayout.tidePhasePair === "out-low";
    const direction = isOutLow ? "going out" : "coming in";
    const eventLabel = isOutLow ? "Low tide" : "High tide";
    const lines = timeDeltaLayout.countdownLines;
    const contents = [
      timeDeltaLayout.town,
      `Tide ${direction}`,
      formatTimeDeltaNextStripeContent(
        eventLabel,
        timeDeltaLayout.interval,
        timeDeltaLayout.nextEventTimeHhmm,
      ),
    ];
    countdownStripes = lines.map((line, i) => ({
      content: /** @type {string} */ (contents[i]),
      fontSize: line.fontHeight * R,
      anchor: { x: 0, y: 0 - line.belowOrigin * R },
      hAlign: "center",
    }));
  } else {
    const tdFont = timeDeltaLayout.fontHeight * R;
    const tdY = 0 - timeDeltaLayout.belowOrigin * R;
    timeDeltaEmptyMessage = {
      content: TIME_DELTA_EMPTY_MESSAGE,
      fontSize: tdFont,
      anchor: { x: 0, y: tdY },
      hAlign: "center",
    };
  }

  return { countdownStripes, timeDeltaEmptyMessage };
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
      `spec.timeDelta.countdownLines must have length ${TIME_DELTA_COUNTDOWN_LINE_COUNT} (location, phase, next-event)`,
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

  const nextEvent = computeNextTideEventFromSpec(spec, parsedNow);
  const timeDeltaLayout =
    nextEvent == null
      ? {
          kind: "empty",
          belowOrigin: emptyBelow,
          fontHeight: emptyFh,
        }
      : {
          kind: "countdown",
          town: tdTown,
          tidePhasePair: tdTidePhasePair,
          nextEventTimeHhmm: `${String(Math.floor(nextEvent.seconds / 3600)).padStart(2, "0")}:${String(Math.floor((nextEvent.seconds % 3600) / 60)).padStart(2, "0")}`,
          interval: nextEvent.intervalText,
          countdownLines,
        };

  return layoutTimeDeltaDiagram(timeDeltaLayout, refRadius);
}
