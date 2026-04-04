// CentreCluster layout in diagram space (origin at RefArc centre). See docs/specs/tide-diagram.md.
// Fixed glue between event-kind and interval text is normative here and in the spec.
//
// Policies for {@link buildCentreClusterFromSpec}:
// - Returns `null` when `spec.centreCluster` is missing or not a plain object.
// - Throws from {@link parseCanonicalTimeOrThrow} when `spec.timeNow` is invalid; throws when `timeNow` is `24:00:00`.
// - Throws when `centreCluster.timeDelta` is missing or `{ y, fontHeight }` are not finite numbers.
// - `spec.refRadius`, `spec.sweepRad`, and `centreCluster.frameArcRadius` are optional; defaults match historical diagram presets (see constants below).
//
// {@link layoutCentreCluster} is pure geometry + text placement from a resolved {@link TimeDeltaLayout}; it does not read the spec.

import { polar, refArcAngles } from "../model/tideDiagramModel.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import { computeNextTideEventFromSpec } from "../model/tideEvents.mjs";

/** Fixed substring between event-kind text and interval text on the TimeDelta line. */
export const TIME_DELTA_GLUE = " water in ";

/** Fixed copy when no tide remains on the civil day (docs/specs/tide-diagram.md §TimeDelta). */
export const TIME_DELTA_EMPTY_MESSAGE = "No further tides today";

const CHAR_WIDTH_FACTOR = 0.6;

/** @type {number} px when `spec.refRadius` is absent or not a finite number */
const DEFAULT_REF_RADIUS = 100;

/** @type {number} radians when `spec.sweepRad` is absent or not a finite number */
const DEFAULT_SWEEP_RAD = Math.PI * 0.92;

/** @type {number} proportion of RefRadius for the CentreCluster frame arc when absent or not finite */
const DEFAULT_FRAME_ARC_RADIUS = 0.25;

/**
 * Layout input for the TimeDelta strip (RefRadius-normalised `y` and `fontHeight`).
 *
 * @typedef {object} TimeDeltaLayoutCountdown
 * @property {'countdown'} kind
 * @property {string} eventKind
 * @property {string} interval
 * @property {number} y
 * @property {number} fontHeight
 *
 * @typedef {object} TimeDeltaLayoutEmpty
 * @property {'empty'} kind
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
 * @param {number} sweepRad same subtended angle as RefArc (radians)
 * @param {number} frameArcRadius proportion of RefRadius (CentreClusterFrame arc radius)
 * @returns {import('../model/tideDiagramModel.mjs').CentreClusterDiagram}
 */
export function layoutCentreCluster(
  timeDeltaLayout,
  refRadius,
  sweepRad,
  frameArcRadius,
) {
  const R = refRadius;
  const { thetaLeft, thetaRight } = refArcAngles(sweepRad);
  const rFrame = frameArcRadius * R;
  const frameArc = {
    center: { x: 0, y: 0 },
    radius: rFrame,
    sweepRad,
    thetaLeft,
    thetaRight,
  };
  const origin = { x: 0, y: 0 };
  /** @type {[import('../model/tideDiagramModel.mjs').DiagramLineSeg, import('../model/tideDiagramModel.mjs').DiagramLineSeg]} */
  const frameLines = [
    { start: origin, end: polar(rFrame, thetaLeft) },
    { start: origin, end: polar(rFrame, thetaRight) },
  ];
  /** @type {import('../model/tideDiagramModel.mjs').DiagramTextInst[]} */
  const timeDelta = [];
  /** @type {import('../model/tideDiagramModel.mjs').DiagramTextInst | null} */
  let timeDeltaEmptyMessage = null;

  if (timeDeltaLayout.kind === "countdown") {
    const tdFont = timeDeltaLayout.fontHeight * R;
    const tdY = timeDeltaLayout.y * R;
    const parts = [
      { content: timeDeltaLayout.eventKind },
      { content: TIME_DELTA_GLUE },
      { content: timeDeltaLayout.interval },
    ];
    const widths = parts.map((p) => textWidth(tdFont, p.content.length));
    const totalW = widths.reduce((a, b) => a + b, 0);
    let left = -totalW / 2;
    for (let i = 0; i < parts.length; i += 1) {
      const w = widths[i];
      const cx = left + w / 2;
      timeDelta.push({
        content: parts[i].content,
        fontSize: tdFont,
        anchor: { x: cx, y: tdY },
      });
      left += w;
    }
  } else {
    const tdFont = timeDeltaLayout.fontHeight * R;
    const tdY = timeDeltaLayout.y * R;
    timeDeltaEmptyMessage = {
      content: TIME_DELTA_EMPTY_MESSAGE,
      fontSize: tdFont,
      anchor: { x: 0, y: tdY },
    };
  }

  return { timeDelta, timeDeltaEmptyMessage, frameArc, frameLines };
}

/**
 * @param {Record<string, unknown>} spec
 * @returns {import('../model/tideDiagramModel.mjs').CentreClusterDiagram | null} null when `spec.centreCluster` is absent; otherwise frame and either three **timeDelta** fragments or **timeDeltaEmptyMessage** (see spec).
 * @throws {Error} invalid `spec.timeNow`, `24:00:00`, or bad `centreCluster.timeDelta`
 */
export function buildCentreClusterFromSpec(spec) {
  const raw = spec.centreCluster;
  if (raw == null || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const refRadius =
    typeof spec.refRadius === "number" && Number.isFinite(spec.refRadius)
      ? spec.refRadius
      : DEFAULT_REF_RADIUS;

  const parsedNow = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }

  const td = o.timeDelta;
  if (td == null || typeof td !== "object") {
    throw new Error(
      "centreCluster.timeDelta is required: { y, fontHeight } (RefRadius multiples)",
    );
  }
  const t = /** @type {Record<string, unknown>} */ (td);
  const tdY = t.y;
  const tdFh = t.fontHeight;
  if (
    typeof tdY !== "number" ||
    typeof tdFh !== "number" ||
    !Number.isFinite(tdY) ||
    !Number.isFinite(tdFh)
  ) {
    throw new Error(
      "centreCluster.timeDelta.y and .fontHeight must be finite numbers (RefRadius multiples)",
    );
  }

  const nextEvent = computeNextTideEventFromSpec(spec, parsedNow);
  const timeDeltaLayout =
    nextEvent == null
      ? { kind: "empty", y: tdY, fontHeight: tdFh }
      : {
          kind: "countdown",
          eventKind: nextEvent.kind,
          interval: nextEvent.intervalText,
          y: tdY,
          fontHeight: tdFh,
        };

  const sweepRad =
    typeof spec.sweepRad === "number" && Number.isFinite(spec.sweepRad)
      ? spec.sweepRad
      : DEFAULT_SWEEP_RAD;

  const frameArcRadius =
    typeof o.frameArcRadius === "number" && Number.isFinite(o.frameArcRadius)
      ? o.frameArcRadius
      : DEFAULT_FRAME_ARC_RADIUS;

  return layoutCentreCluster(
    timeDeltaLayout,
    refRadius,
    sweepRad,
    frameArcRadius,
  );
}
