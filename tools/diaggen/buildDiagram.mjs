import {
  polar,
  refArcAngles,
  timeToTheta,
} from "./tideDiagramModel.mjs";

/**
 * @param {Record<string, unknown>} spec
 * @returns {import('./tideDiagramModel.mjs').TideDiagramDocument}
 */
export function buildDiagram(spec) {
  const width =
    typeof spec.canvas?.width === "number" ? spec.canvas.width : 400;
  const height =
    typeof spec.canvas?.height === "number" ? spec.canvas.height : 300;
  const title =
    typeof spec.title === "string" ? spec.title : "tide diagram";

  const refRadius =
    typeof spec.refRadius === "number" ? spec.refRadius : 100;
  const sweepRad =
    typeof spec.sweepRad === "number"
      ? spec.sweepRad
      : Math.PI * 0.92;
  const tickLen =
    typeof spec.tickLen === "number" ? spec.tickLen : 0.08;

  const { thetaLeft, thetaRight } = refArcAngles(sweepRad);
  const rInner = 1.0 * refRadius;
  const rOuter = (1.0 + tickLen) * refRadius;

  /** @type {import('./tideDiagramModel.mjs').TickMarkSpec[]} */
  const tickMarks = [];
  for (let h = 0; h <= 24; h += 1) {
    const theta = timeToTheta(h, thetaLeft, thetaRight);
    tickMarks.push({
      hour: h,
      theta,
      start: polar(rInner, theta),
      end: polar(rOuter, theta),
    });
  }

  return {
    version: 1,
    meta: { title, width, height },
    refArc: {
      center: { x: 0, y: 0 },
      refRadius,
      sweepRad,
      thetaLeft,
      thetaRight,
    },
    tickMarks,
    placeholders: {
      tickLabels: [],
      tideMarks: [],
      centreCluster: [],
      nowTime: [],
      timeDelta: [],
      location: [],
    },
  };
}
