/**
 * timeDeltaDiagram.mjs — Time-delta text layout in diagram space (countdown or empty-day message).
 * Fed by spec + shared tide-event helpers. See docs/specs/tide-diagram.md §TimeDelta.
 *
 * Policies for {@link buildTimeDeltaDiagramFromSpec}:
 * - Throws when `spec.timeDelta` is missing or not a plain object.
 * - Throws from {@link parseCanonicalTimeOrThrow} when `spec.timeNow` is invalid; throws when `timeNow` is `24:00:00`.
 * - Throws when `timeDelta.x`, `timeDelta.y`, and `timeDelta.fontHeight` are not finite numbers.
 *
 * {@link layoutTimeDeltaDiagram} is pure geometry + text placement from a resolved {@link TimeDeltaLayout}; it does not read the spec.
 */

import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import { computeNextTideEventFromSpec } from "../model/tideEvents.mjs";
import { requirePlainObject } from "./specRequire.mjs";

/** Fixed substring between event-kind text and interval text on the TimeDelta line (spec literal; no padding spaces). */
export const TIME_DELTA_GLUE = "water in";

/** Fixed copy when no tide remains on the civil day (docs/specs/tide-diagram.md §TimeDelta). */
export const TIME_DELTA_EMPTY_MESSAGE = "No further tides today";

const CHAR_WIDTH_FACTOR = 0.6;

/**
 * Layout input for the TimeDelta strip (RefRadius-normalised `x`, `y`, and `fontHeight`).
 *
 * @typedef {object} TimeDeltaLayoutCountdown
 * @property {'countdown'} kind
 * @property {string} eventKind
 * @property {string} interval
 * @property {number} x
 * @property {number} y
 * @property {number} fontHeight
 *
 * @typedef {object} TimeDeltaLayoutEmpty
 * @property {'empty'} kind
 * @property {number} x
 * @property {number} y
 * @property {number} fontHeight
 *
 * @typedef {TimeDeltaLayoutCountdown | TimeDeltaLayoutEmpty} TimeDeltaLayout
 */

/**
 * Approximate horizontal advance per character for monospace placement (scene preview uses monospace).
 * @param {number} fontSize
 * @param {number} charCount
 */
function textWidth(fontSize, charCount) {
  return CHAR_WIDTH_FACTOR * fontSize * charCount;
}

/**
 * @param {TimeDeltaLayout} timeDeltaLayout
 * @param {number} refRadius
 * @returns {import('../model/tideDiagramModel.mjs').TimeDeltaDiagram}
 */
export function layoutTimeDeltaDiagram(timeDeltaLayout, refRadius) {
  const R = refRadius;
  /** @type {import('../model/tideDiagramModel.mjs').DiagramTextInst[]} */
  const timeDelta = [];
  /** @type {import('../model/tideDiagramModel.mjs').DiagramTextInst | null} */
  let timeDeltaEmptyMessage = null;

  if (timeDeltaLayout.kind === "countdown") {
    const tdFont = timeDeltaLayout.fontHeight * R;
    const tdY = timeDeltaLayout.y * R;
    const leftEdge = timeDeltaLayout.x * R;
    const parts = [
      { content: timeDeltaLayout.eventKind },
      { content: TIME_DELTA_GLUE },
      { content: timeDeltaLayout.interval },
    ];
    const widths = parts.map((p) => textWidth(tdFont, p.content.length));
    const spaceW = textWidth(tdFont, 1);
    let x = leftEdge;
    for (let i = 0; i < parts.length; i += 1) {
      const w = widths[i];
      timeDelta.push({
        content: parts[i].content,
        fontSize: tdFont,
        anchor: { x, y: tdY },
        hAlign: "left",
      });
      x += w;
      if (i < parts.length - 1) {
        x += spaceW;
      }
    }
  } else {
    const tdFont = timeDeltaLayout.fontHeight * R;
    const tdY = timeDeltaLayout.y * R;
    const leftEdge = timeDeltaLayout.x * R;
    timeDeltaEmptyMessage = {
      content: TIME_DELTA_EMPTY_MESSAGE,
      fontSize: tdFont,
      anchor: { x: leftEdge, y: tdY },
      hAlign: "left",
    };
  }

  return { timeDelta, timeDeltaEmptyMessage };
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

  const tdX = o.x;
  const tdY = o.y;
  const tdFh = o.fontHeight;
  if (
    typeof tdX !== "number" ||
    typeof tdY !== "number" ||
    typeof tdFh !== "number" ||
    !Number.isFinite(tdX) ||
    !Number.isFinite(tdY) ||
    !Number.isFinite(tdFh)
  ) {
    throw new Error(
      "spec.timeDelta requires finite numbers x, y, and fontHeight (RefRadius multiples)",
    );
  }

  const nextEvent = computeNextTideEventFromSpec(spec, parsedNow);
  const timeDeltaLayout =
    nextEvent == null
      ? { kind: "empty", x: tdX, y: tdY, fontHeight: tdFh }
      : {
          kind: "countdown",
          eventKind: nextEvent.kind,
          interval: nextEvent.intervalText,
          x: tdX,
          y: tdY,
          fontHeight: tdFh,
        };

  return layoutTimeDeltaDiagram(timeDeltaLayout, refRadius);
}
