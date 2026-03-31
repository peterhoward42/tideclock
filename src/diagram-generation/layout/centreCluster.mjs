// CentreCluster layout in diagram space (origin at RefArc centre). See docs/specs/tide-diagram.md.
// Fixed glue between event-kind and interval text is normative here and in the spec.

import { polar, refArcAngles } from "../model/tideDiagramModel.mjs";
import { parseCanonicalTimeOrThrow } from "../model/timeCanonical.mjs";
import { computeNextTideEventFromSpec } from "../model/tideEvents.mjs";

/** Fixed substring between event-kind text and interval text on the TimeDelta line. */
export const TIME_DELTA_GLUE = " water in ";

const CHAR_WIDTH_FACTOR = 0.6;

/**
 * Approximate horizontal advance per character for monospace placement (scene preview uses monospace).
 * @param {number} fontSize
 * @param {number} charCount
 */
function textWidth(fontSize, charCount) {
  return CHAR_WIDTH_FACTOR * fontSize * charCount;
}

/**
 * @param {{
 *   text: string,
 *   y: number,
 *   fontHeight: number,
 * }} nowTimeSpec multiples of RefRadius for y and fontHeight
 * @param {{
 *   eventKind: string,
 *   interval: string,
 *   y: number,
 *   fontHeight: number,
 * }} timeDeltaSpec
 * @param {number} refRadius
 * @param {number} sweepRad same subtended angle as RefArc (radians)
 * @param {number} frameArcRadius proportion of RefRadius (CentreClusterFrame arc radius)
 */
export function layoutCentreCluster(
  nowTimeSpec,
  timeDeltaSpec,
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
  const nowFont = nowTimeSpec.fontHeight * R;
  const nowY = nowTimeSpec.y * R;
  const nowTime = {
    content: nowTimeSpec.text,
    fontSize: nowFont,
    anchor: { x: 0, y: nowY },
  };

  const tdFont = timeDeltaSpec.fontHeight * R;
  const tdY = timeDeltaSpec.y * R;
  const parts = [
    { content: timeDeltaSpec.eventKind },
    { content: TIME_DELTA_GLUE },
    { content: timeDeltaSpec.interval },
  ];
  const widths = parts.map((p) => textWidth(tdFont, p.content.length));
  const totalW = widths.reduce((a, b) => a + b, 0);
  let left = -totalW / 2;
  /** @type {import('../model/tideDiagramModel.mjs').DiagramTextInst[]} */
  const timeDelta = [];
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

  return { nowTime, timeDelta, frameArc, frameLines };
}

/**
 * @param {Record<string, unknown>} spec
 * @returns {import('../model/tideDiagramModel.mjs').CentreClusterDiagram | null}
 */
export function buildCentreClusterFromSpec(spec) {
  const raw = spec.centreCluster;
  if (raw == null || typeof raw !== "object") return null;
  const o = /** @type {Record<string, unknown>} */ (raw);
  const refRadius =
    typeof spec.refRadius === "number" && Number.isFinite(spec.refRadius)
      ? spec.refRadius
      : 100;

  const now = o.nowTime;
  if (now == null || typeof now !== "object") {
    throw new Error(
      "centreCluster.nowTime is required: { y, fontHeight } (y and fontHeight are RefRadius multiples)",
    );
  }
  const n = /** @type {Record<string, unknown>} */ (now);
  const nowY = n.y;
  const nowFh = n.fontHeight;
  if (
    typeof nowY !== "number" ||
    typeof nowFh !== "number" ||
    !Number.isFinite(nowY) ||
    !Number.isFinite(nowFh)
  ) {
    throw new Error(
      "centreCluster.nowTime.y and .fontHeight must be finite numbers (RefRadius multiples)",
    );
  }
  const parsedNow = parseCanonicalTimeOrThrow(spec.timeNow, "spec.timeNow");
  if (parsedNow.isRightEndpoint) {
    throw new Error('spec.timeNow cannot be "24:00:00"');
  }
  const nowText = `Time now ${parsedNow.canonical}`;

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
  if (nextEvent == null) {
    throw new Error(
      "centreCluster requires at least one valid tideMarks marker to derive next tide event",
    );
  }

  const eventKind = nextEvent.kind;
  const interval = nextEvent.intervalText;

  const sweepRad =
    typeof spec.sweepRad === "number" && Number.isFinite(spec.sweepRad)
      ? spec.sweepRad
      : Math.PI * 0.92;

  const frameArcRadius =
    typeof o.frameArcRadius === "number" && Number.isFinite(o.frameArcRadius)
      ? o.frameArcRadius
      : 0.25;

  return layoutCentreCluster(
    { text: nowText, y: nowY, fontHeight: nowFh },
    { eventKind, interval, y: tdY, fontHeight: tdFh },
    refRadius,
    sweepRad,
    frameArcRadius,
  );
}
