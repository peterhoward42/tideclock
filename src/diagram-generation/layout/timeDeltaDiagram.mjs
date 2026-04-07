/**
 * timeDeltaDiagram.mjs — Time-delta text layout in diagram space (countdown or empty-day message).
 * Fed by spec + shared tide-event helpers. See docs/specs/tide-diagram.md §TimeDelta.
 *
 * Policies for {@link buildTimeDeltaDiagramFromSpec}:
 * - Throws when `spec.timeDelta` is missing or not a plain object.
 * - Throws from {@link parseCanonicalTimeOrThrow} when `spec.timeNow` is invalid; throws when `timeNow` is `24:00:00`.
 * - Throws when `timeDelta.leftOfOrigin`, `timeDelta.belowOrigin`, and `timeDelta.fontHeight` are not finite numbers.
 *
 * {@link layoutTimeDeltaDiagram} is pure geometry + text placement from a resolved {@link TimeDeltaLayout}; it does not read the spec.
 */

import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import { computeNextTideEventFromSpec } from "../model/tideEvents.mjs";
import { requirePlainObject, requireString } from "./specRequire.mjs";

/** Fixed copy when no tide remains on the civil day (docs/specs/tide-diagram.md §TimeDelta). */
export const TIME_DELTA_EMPTY_MESSAGE = "No further tides today";

/**
 * Layout input for the TimeDelta strip (RefRadius-normalised `x`, `y`, and `fontHeight`).
 *
 * @typedef {object} TimeDeltaLayoutCountdown
 * @property {'countdown'} kind
 * @property {string} town
 * @property {'out-low' | 'in-high'} tidePhasePair
 * @property {string} nextEventTimeHhmm
 * @property {string} interval
 * @property {number} leftOfOrigin
 * @property {number} belowOrigin
 * @property {number} fontHeight
 *
 * @typedef {object} TimeDeltaLayoutEmpty
 * @property {'empty'} kind
 * @property {number} leftOfOrigin
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
  /** @type {import('../model/tideDiagramModel.mjs').DiagramTextInst | null} */
  let timeDeltaLine = null;
  /** @type {import('../model/tideDiagramModel.mjs').DiagramTextInst | null} */
  let timeDeltaEmptyMessage = null;

  if (timeDeltaLayout.kind === "countdown") {
    const tdFont = timeDeltaLayout.fontHeight * R;
    const tdY = 0 - timeDeltaLayout.belowOrigin * R;
    const leftEdge = 0 - timeDeltaLayout.leftOfOrigin * R;
    const isOutLow = timeDeltaLayout.tidePhasePair === "out-low";
    const direction = isOutLow ? "going out" : "coming in";
    const eventLabel = isOutLow ? "Low tide" : "High tide";
    timeDeltaLine = {
      content: `${timeDeltaLayout.town} · Tide ${direction} · ${eventLabel} in ${timeDeltaLayout.interval} (${timeDeltaLayout.nextEventTimeHhmm})`,
      fontSize: tdFont,
      anchor: { x: leftEdge, y: tdY },
      hAlign: "left",
    };
  } else {
    const tdFont = timeDeltaLayout.fontHeight * R;
    const tdY = 0 - timeDeltaLayout.belowOrigin * R;
    const leftEdge = 0 - timeDeltaLayout.leftOfOrigin * R;
    timeDeltaEmptyMessage = {
      content: TIME_DELTA_EMPTY_MESSAGE,
      fontSize: tdFont,
      anchor: { x: leftEdge, y: tdY },
      hAlign: "left",
    };
  }

  return { timeDeltaLine, timeDeltaEmptyMessage };
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

  const tdLeft = o.leftOfOrigin;
  const tdBelow = o.belowOrigin;
  const tdFh = o.fontHeight;
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
  if (
    typeof tdLeft !== "number" ||
    typeof tdBelow !== "number" ||
    typeof tdFh !== "number" ||
    !Number.isFinite(tdLeft) ||
    !Number.isFinite(tdBelow) ||
    !Number.isFinite(tdFh)
  ) {
    throw new Error(
      "spec.timeDelta requires finite numbers leftOfOrigin, belowOrigin, and fontHeight (RefRadius multiples)",
    );
  }

  const nextEvent = computeNextTideEventFromSpec(spec, parsedNow);
  const timeDeltaLayout =
    nextEvent == null
      ? {
          kind: "empty",
          leftOfOrigin: tdLeft,
          belowOrigin: tdBelow,
          fontHeight: tdFh,
        }
      : {
          kind: "countdown",
          town: tdTown,
          tidePhasePair: tdTidePhasePair,
          nextEventTimeHhmm: `${String(Math.floor(nextEvent.seconds / 3600)).padStart(2, "0")}:${String(Math.floor((nextEvent.seconds % 3600) / 60)).padStart(2, "0")}`,
          interval: nextEvent.intervalText,
          leftOfOrigin: tdLeft,
          belowOrigin: tdBelow,
          fontHeight: tdFh,
        };

  return layoutTimeDeltaDiagram(timeDeltaLayout, refRadius);
}
