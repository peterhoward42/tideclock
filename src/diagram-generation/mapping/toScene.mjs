// Maps a TideDiagramDocument from buildDiagram into the scene graph used for preview rendering.
import {
  arc,
  circle,
  group,
  line,
  point,
  triangle,
  text,
} from "../model/sceneModel.mjs";

/**
 * @param {import('../model/tideDiagramModel.mjs').DiagramPoint} p
 * @param {number} cx
 * @param {number} cy
 */
function mapPoint(p, cx, cy) {
  return point(p.x + cx, p.y + cy);
}

/**
 * @param {import('../model/tideDiagramModel.mjs').CentreClusterDiagram} cluster
 * @param {number} cx
 * @param {number} cy
 * @returns {import('../model/sceneModel.mjs').GroupNode}
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
  const timeDeltaNodes = cluster.timeDelta.map((seg, idx) => {
    const node = text({
      content: seg.content,
      size: seg.fontSize,
      hAlign: "center",
      angleRad: 0,
      anchor: mapPoint(seg.anchor, cx, cy),
    });
    if (idx === 0) return group("EventKind", [node]);
    if (idx === 1) return group("DeltaGlue", [node]);
    return group("DeltaInterval", [node]);
  });

  const frameGroup = group("CentreClusterFrame", [
    ...frameLineNodes,
    arc(frameArcCenter, frameArcStart, fa.sweepRad),
  ]);
  const nowTimeGroup = group("NowTime", [
    text({
      content: now.content,
      size: now.fontSize,
      hAlign: "center",
      angleRad: 0,
      anchor: mapPoint(now.anchor, cx, cy),
    }),
  ]);
  /** @type {import('../model/sceneModel.mjs').GroupNode[]} */
  const children = [frameGroup, nowTimeGroup];
  if (timeDeltaNodes.length > 0) {
    children.push(group("TimeDelta", timeDeltaNodes));
  }
  return group("CentreCluster", children);
}

/**
 * @param {import('../model/tideDiagramModel.mjs').TideMarkDiagram} mark
 * @param {number} cx
 * @param {number} cy
 * @returns {import('../model/sceneModel.mjs').GroupNode}
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
  const timePointerGroup = group("TimePointer", [triNode, circNode]);
  const hl = mark.heightLabel;
  const tl = mark.timeLabel;
  return group("TideMark", [
    timePointerGroup,
    group("HeightLabel", [
      text({
        content: hl.content,
        size: hl.fontSize,
        hAlign: "center",
        angleRad: hl.angleRad,
        anchor: mapPoint(hl.anchor, cx, cy),
      }),
    ]),
    group("TimeLabel", [
      text({
        content: tl.content,
        size: tl.fontSize,
        hAlign: "center",
        angleRad: tl.angleRad,
        anchor: mapPoint(tl.anchor, cx, cy),
      }),
    ]),
  ]);
}

/**
 * @param {import('../model/tideDiagramModel.mjs').TideDiagramDocument} diagram
 * @returns {import('../model/sceneModel.mjs').SceneDocument}
 */
export function tideDiagramToScene(diagram) {
  const { width, height, title } = diagram.meta;
  const cx = width / 2;
  const cy = height / 2;
  const {
    refArc,
    tickMarks,
    tickLabels,
    tideMarks,
    nowPointer,
    nextPointer,
    waitArc,
  } = diagram;
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

  const refArcGroup = group("RefArc", [
    arc(arcCenter, arcStart, refArc.sweepRad),
  ]);
  const waitArcGroup =
    waitArc != null
      ? group("WaitArc", [
          arc(
            mapPoint(waitArc.center, cx, cy),
            mapPoint(
              {
                x:
                  waitArc.center.x +
                  waitArc.radius * Math.cos(waitArc.thetaStart),
                y:
                  waitArc.center.y +
                  waitArc.radius * Math.sin(waitArc.thetaStart),
              },
              cx,
              cy,
            ),
            waitArc.sweepRad,
            { arrow: waitArc.arrow },
          ),
        ])
      : null;
  const ticksGroup = group("TickMark", tickChildren);

  const tickLabelChildren = (tickLabels ?? []).map((tl) =>
    text({
      content: tl.content,
      size: tl.fontSize,
      hAlign: "center",
      angleRad: 0,
      anchor: mapPoint(tl.anchor, cx, cy),
    }),
  );
  const tickLabelsGroup = group("TickLabel", tickLabelChildren);

  const tideMarkGroups = (tideMarks ?? []).map((m) =>
    tideMarkDiagramToGroup(m, cx, cy),
  );
  const tideMarksGroup = group("TideMarks", tideMarkGroups);

  const centreClusterGroup =
    diagram.centreCluster != null
      ? centreClusterDiagramToGroup(diagram.centreCluster, cx, cy)
      : null;

  const nowPointerGroup =
    nowPointer != null
      ? group("NowPointer", [
          ...(nowPointer.triangle
            ? [
                group("NowTriangle", [
                  triangle(
                    mapPoint(nowPointer.triangle.v1, cx, cy),
                    mapPoint(nowPointer.triangle.v2, cx, cy),
                    mapPoint(nowPointer.triangle.v3, cx, cy),
                    { outline: true },
                  ),
                ]),
              ]
            : []),
          group("NowRadialLine", [
            line(
              mapPoint(nowPointer.radialLine.start, cx, cy),
              mapPoint(nowPointer.radialLine.end, cx, cy),
            ),
          ]),
          group("NowLabel", [
            text({
              content: nowPointer.nowLabel.content,
              size: nowPointer.nowLabel.fontSize,
              hAlign: "center",
              angleRad: nowPointer.nowLabel.angleRad,
              anchor: mapPoint(nowPointer.nowLabel.anchor, cx, cy),
            }),
          ]),
        ])
      : null;

  const nextPointerGroup =
    nextPointer != null
      ? group("NextPointer", [
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
      ...(waitArcGroup != null ? [waitArcGroup] : []),
      ticksGroup,
      tideMarksGroup,
      tickLabelsGroup,
      ...(centreClusterGroup != null ? [centreClusterGroup] : []),
      ...(nowPointerGroup != null ? [nowPointerGroup] : []),
      ...(nextPointerGroup != null ? [nextPointerGroup] : []),
    ]),
  };
}
