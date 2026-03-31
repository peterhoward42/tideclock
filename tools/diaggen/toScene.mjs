// Maps a `TideDiagramDocument` from `buildDiagram` into scenegen’s scene graph so both
// `diaggen/gen.mjs` and `scenegen/gen.mjs` can share `scenegen/preview.mjs`.
//
// Scene space is diagram model space translated by (canvasWidth/2, canvasHeight/2) so the diagram
// origin sits at the canvas centre. Axes remain x right, y up; arc `sweepRad` is still CCW in
// radians, unchanged from the diagram document.
import {
  arc,
  circle,
  group,
  line,
  point,
  triangle,
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
 * Scene group for a CentreClusterDiagram (diagram space → scene space).
 * @param {import('./tideDiagramModel.mjs').CentreClusterDiagram} cluster
 * @param {number} cx
 * @param {number} cy
 * @returns {import('../scenegen/sceneModel.mjs').GroupNode}
 */
export function centreClusterDiagramToGroup(cluster, cx, cy) {
  const fa = cluster.frameArc;
  const fc = fa.center;
  const fr = fa.radius;
  const frameArcStart = mapPoint(
    {
      x: fc.x + fr * Math.cos(fa.thetaLeft),
      y: fc.y + fr * Math.sin(fa.thetaLeft),
    },
    cx,
    cy,
  );
  const frameArcCenter = mapPoint(fc, cx, cy);

  const frameLineNodes = cluster.frameLines.map((seg) =>
    line(mapPoint(seg.start, cx, cy), mapPoint(seg.end, cx, cy)),
  );

  const now = cluster.nowTime;
  const children = [
    ...frameLineNodes,
    arc(frameArcCenter, frameArcStart, fa.sweepRad),
    text({
      content: now.content,
      size: now.fontSize,
      hAlign: "center",
      angleRad: 0,
      anchor: mapPoint(now.anchor, cx, cy),
    }),
    ...cluster.timeDelta.map((seg) =>
      text({
        content: seg.content,
        size: seg.fontSize,
        hAlign: "center",
        angleRad: 0,
        anchor: mapPoint(seg.anchor, cx, cy),
      }),
    ),
  ];
  return group("centreCluster", children);
}

/**
 * @param {import('./tideDiagramModel.mjs').TideMarkDiagram} mark
 * @param {number} cx
 * @param {number} cy
 * @returns {import('../scenegen/sceneModel.mjs').GroupNode}
 */
export function tideMarkDiagramToGroup(mark, cx, cy) {
  const tp = mark.timePointer;
  const tri = tp.triangle;
  const circ = tp.circle;
  const triNode = triangle(
    mapPoint(tri.v1, cx, cy),
    mapPoint(tri.v2, cx, cy),
    mapPoint(tri.v3, cx, cy),
  );
  const circNode = circle(mapPoint(circ.center, cx, cy), circ.radius);
  const timePointerGroup = group("timePointer", [triNode, circNode]);
  const hl = mark.heightLabel;
  const tl = mark.timeLabel;
  return group("tideMark", [
    timePointerGroup,
    text({
      content: hl.content,
      size: hl.fontSize,
      hAlign: "center",
      angleRad: hl.angleRad,
      anchor: mapPoint(hl.anchor, cx, cy),
    }),
    text({
      content: tl.content,
      size: tl.fontSize,
      hAlign: "center",
      angleRad: tl.angleRad,
      anchor: mapPoint(tl.anchor, cx, cy),
    }),
  ]);
}

/**
 * @param {import('./tideDiagramModel.mjs').TideDiagramDocument} diagram
 * @returns {import('../scenegen/sceneModel.mjs').SceneDocument}
 */
export function tideDiagramToScene(diagram) {
  const { width, height, title } = diagram.meta;
  const cx = width / 2;
  const cy = height / 2;
  const { refArc, tickMarks, tickLabels, tideMarks, nowPointer, nextPointer } =
    diagram;
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

  const tickLabelChildren = (tickLabels ?? []).map((tl) =>
    text({
      content: tl.content,
      size: tl.fontSize,
      hAlign: "center",
      angleRad: 0,
      anchor: mapPoint(tl.anchor, cx, cy),
    }),
  );
  const tickLabelsGroup = group("tickLabels", tickLabelChildren);

  const tideMarkGroups = (tideMarks ?? []).map((m) =>
    tideMarkDiagramToGroup(m, cx, cy),
  );
  const tideMarksGroup = group("tideMarks", tideMarkGroups);

  const centreClusterGroup =
    diagram.centreCluster != null
      ? centreClusterDiagramToGroup(diagram.centreCluster, cx, cy)
      : null;

  const nowPointerGroup =
    nowPointer != null
      ? group("nowPointer", [
          ...(nowPointer.triangle
            ? [
                triangle(
                  mapPoint(nowPointer.triangle.v1, cx, cy),
                  mapPoint(nowPointer.triangle.v2, cx, cy),
                  mapPoint(nowPointer.triangle.v3, cx, cy),
                  { outline: true },
                ),
              ]
            : []),
          line(
            mapPoint(nowPointer.radialLine.start, cx, cy),
            mapPoint(nowPointer.radialLine.end, cx, cy),
          ),
          text({
            content: nowPointer.nowLabel.content,
            size: nowPointer.nowLabel.fontSize,
            hAlign: "center",
            angleRad: nowPointer.nowLabel.angleRad,
            anchor: mapPoint(nowPointer.nowLabel.anchor, cx, cy),
          }),
        ])
      : null;

  const nextPointerGroup =
    nextPointer != null
      ? group("nextPointer", [
          line(
            mapPoint(nextPointer.radialLine.start, cx, cy),
            mapPoint(nextPointer.radialLine.end, cx, cy),
          ),
          circle(
            mapPoint(nextPointer.circle.center, cx, cy),
            nextPointer.circle.radius,
          ),
        ])
      : null;

  const { rect } = diagram.contentBounds;
  const meta = {
    title,
    width,
    height,
    previewFrame: {
      minX: rect.minX + cx,
      maxX: rect.maxX + cx,
      minY: rect.minY + cy,
      maxY: rect.maxY + cy,
    },
  };

  return {
    version: 2,
    meta,
    root: group("tideDiagram", [
      refArcGroup,
      ticksGroup,
      tideMarksGroup,
      tickLabelsGroup,
      ...(centreClusterGroup != null ? [centreClusterGroup] : []),
      ...(nowPointerGroup != null ? [nowPointerGroup] : []),
      ...(nextPointerGroup != null ? [nextPointerGroup] : []),
    ]),
  };
}
