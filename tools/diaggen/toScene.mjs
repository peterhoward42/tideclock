import {
  arc,
  group,
  line,
  point,
  text,
} from "../scenegen/sceneModel.mjs";

/**
 * Map diagram-space coordinates to scene space (canvas-centred).
 * @param {import('./tideDiagramModel.mjs').DiagramPoint} p
 * @param {number} cx
 * @param {number} cy
 */
function mapPoint(p, cx, cy) {
  return point(p.x + cx, p.y + cy);
}

/**
 * @param {import('./tideDiagramModel.mjs').TideDiagramDocument} diagram
 * @returns {import('../scenegen/sceneModel.mjs').SceneDocument}
 */
export function tideDiagramToScene(diagram) {
  const { width, height, title } = diagram.meta;
  const cx = width / 2;
  const cy = height / 2;
  const { refArc, tickMarks } = diagram;
  const R = refArc.refRadius;
  const C = refArc.center;

  const arcStart = mapPoint(
    {
      x: C.x + R * Math.cos(refArc.thetaLeft),
      y: C.y + R * Math.sin(refArc.thetaLeft),
    },
    cx,
    cy,
  );
  const arcCenter = mapPoint(C, cx, cy);

  const tickChildren = tickMarks.map((tm) =>
    line(
      mapPoint(tm.start, cx, cy),
      mapPoint(tm.end, cx, cy),
    ),
  );

  const refArcGroup = group("refArc", [
    arc(arcCenter, arcStart, refArc.sweepRad),
  ]);
  const ticksGroup = group("tickMarks", tickChildren);

  return {
    version: 2,
    meta: { title, width, height },
    root: group("tideDiagram", [
      refArcGroup,
      ticksGroup,
      group("labels", [
        text({
          content: `${title} (diaggen)`,
          size: 12,
          hAlign: "center",
          angleRad: 0,
          anchor: point(cx, height - 18),
        }),
      ]),
    ]),
  };
}
