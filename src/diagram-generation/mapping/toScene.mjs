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
 * Deterministic scene-space bounds (x right, y up).
 * Used to derive `scene.meta.previewFrame` from actual primitives, not from legacy spec constants.
 */
function emptyBounds() {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

function expandBoundsByPoint(b, p) {
  if (p.x < b.minX) b.minX = p.x;
  if (p.y < b.minY) b.minY = p.y;
  if (p.x > b.maxX) b.maxX = p.x;
  if (p.y > b.maxY) b.maxY = p.y;
}

function expandBoundsByRect(b, x0, y0, x1, y1) {
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  if (minX < b.minX) b.minX = minX;
  if (minY < b.minY) b.minY = minY;
  if (maxX > b.maxX) b.maxX = maxX;
  if (maxY > b.maxY) b.maxY = maxY;
}

function normalizeAngleRad(a) {
  const tau = 2 * Math.PI;
  let x = a % tau;
  if (x < 0) x += tau;
  return x;
}

function angleInSweep(a, a0, sweep) {
  const tau = 2 * Math.PI;
  const an = normalizeAngleRad(a);
  const start = normalizeAngleRad(a0);
  const s = sweep;
  if (Math.abs(s) < 1e-12) return false;
  if (s > 0) {
    const end = normalizeAngleRad(a0 + s);
    if (end >= start) return an >= start && an <= end;
    return an >= start || an <= end;
  } else {
    // CW sweep: check against CCW interval by swapping start/end
    const end = normalizeAngleRad(a0 + s);
    if (start >= end) return an <= start && an >= end;
    return an <= start || an >= end;
  }
}

function expandBoundsByArc(b, node) {
  const cx = node.center.x;
  const cy = node.center.y;
  const sx = node.start.x;
  const sy = node.start.y;
  const r = Math.hypot(sx - cx, sy - cy);
  if (!Number.isFinite(r) || r <= 1e-9) {
    expandBoundsByPoint(b, node.center);
    return;
  }
  const a0 = Math.atan2(sy - cy, sx - cx);
  const sweep = node.sweepRad;

  // Always include endpoints.
  const ex = cx + r * Math.cos(a0 + sweep);
  const ey = cy + r * Math.sin(a0 + sweep);
  expandBoundsByPoint(b, { x: sx, y: sy });
  expandBoundsByPoint(b, { x: ex, y: ey });

  // Include extrema at cardinal angles if they lie within the sweep.
  const cardinals = [0, 0.5 * Math.PI, Math.PI, 1.5 * Math.PI];
  for (const a of cardinals) {
    if (!angleInSweep(a, a0, sweep)) continue;
    expandBoundsByPoint(b, { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) });
  }
}

function expandBoundsByText(b, node) {
  const size = Number(node.size) || 0;
  const len = (node.content ?? "").length;
  // Monospace-ish heuristic; good enough for framing and deterministic.
  const w = Math.max(0, len) * size * 0.6;
  const asc = size * 0.8;
  const desc = size * 0.2;
  let x0 = node.anchor.x;
  let x1 = node.anchor.x;
  if (node.hAlign === "left") {
    x1 = x0 + w;
  } else if (node.hAlign === "right") {
    x0 = x0 - w;
  } else {
    x0 = x0 - 0.5 * w;
    x1 = x1 + 0.5 * w;
  }
  // `dominant-baseline="alphabetic"`: anchor is baseline.
  const y0 = node.anchor.y - desc;
  const y1 = node.anchor.y + asc;

  const ang = Number(node.angleRad) || 0;
  if (Math.abs(ang) < 1e-12) {
    expandBoundsByRect(b, x0, y0, x1, y1);
    return;
  }
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const ax = node.anchor.x;
  const ay = node.anchor.y;
  const corners = [
    { x: x0, y: y0 },
    { x: x1, y: y0 },
    { x: x1, y: y1 },
    { x: x0, y: y1 },
  ];
  for (const p of corners) {
    const dx = p.x - ax;
    const dy = p.y - ay;
    expandBoundsByPoint(b, { x: ax + dx * c - dy * s, y: ay + dx * s + dy * c });
  }
}

function expandBoundsByNode(b, node) {
  switch (node.kind) {
    case "group":
      for (const c of node.children) expandBoundsByNode(b, c);
      return;
    case "line":
      expandBoundsByPoint(b, node.start);
      expandBoundsByPoint(b, node.end);
      return;
    case "circle":
      expandBoundsByRect(
        b,
        node.center.x - node.radius,
        node.center.y - node.radius,
        node.center.x + node.radius,
        node.center.y + node.radius,
      );
      return;
    case "triangle":
      expandBoundsByPoint(b, node.a);
      expandBoundsByPoint(b, node.b);
      expandBoundsByPoint(b, node.c);
      return;
    case "arc":
      expandBoundsByArc(b, node);
      return;
    case "text":
      expandBoundsByText(b, node);
      return;
    default:
      return;
  }
}

function computeScenePreviewFrame(root) {
  const b = emptyBounds();
  expandBoundsByNode(b, root);
  if (![b.minX, b.minY, b.maxX, b.maxY].every((v) => Number.isFinite(v))) {
    // Fallback to a non-degenerate frame.
    return { minX: 0, maxX: 1, minY: 0, maxY: 1 };
  }
  // Small deterministic pad for stroke/text heuristics; viewBox adds additional pad later.
  const pad = 1;
  return {
    minX: b.minX - pad,
    maxX: b.maxX + pad,
    minY: b.minY - pad,
    maxY: b.maxY + pad,
  };
}

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

  /** @type {import('../model/sceneModel.mjs').GroupNode[]} */
  const timeDeltaChildren = [];
  for (let idx = 0; idx < cluster.timeDelta.length; idx += 1) {
    const seg = cluster.timeDelta[idx];
    const node = text({
      content: seg.content,
      size: seg.fontSize,
      hAlign: seg.hAlign ?? "center",
      angleRad: 0,
      anchor: mapPoint(seg.anchor, cx, cy),
    });
    if (idx === 0) timeDeltaChildren.push(group("EventKind", [node]));
    else if (idx === 1) timeDeltaChildren.push(group("DeltaGlue", [node]));
    else timeDeltaChildren.push(group("DeltaInterval", [node]));
  }
  if (cluster.timeDeltaEmptyMessage != null) {
    const m = cluster.timeDeltaEmptyMessage;
    timeDeltaChildren.push(
      group("NoMoreTidesToday", [
        text({
          content: m.content,
          size: m.fontSize,
          hAlign: m.hAlign ?? "center",
          angleRad: 0,
          anchor: mapPoint(m.anchor, cx, cy),
        }),
      ]),
    );
  }

  const frameGroup = group("CentreClusterFrame", [
    ...frameLineNodes,
    arc(frameArcCenter, frameArcStart, fa.sweepRad),
  ]);
  /** @type {import('../model/sceneModel.mjs').GroupNode[]} */
  const children = [frameGroup];
  if (timeDeltaChildren.length > 0) {
    children.push(group("TimeDelta", timeDeltaChildren));
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
    timeNowLabel,
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

  const timeNowLabelGroup =
    timeNowLabel != null
      ? group("TimeNowLabel", [
          text({
            content: timeNowLabel.content,
            size: timeNowLabel.fontSize,
            hAlign: timeNowLabel.hAlign ?? "center",
            angleRad: 0,
            anchor: mapPoint(timeNowLabel.anchor, cx, cy),
          }),
        ])
      : null;

  // NowRadialLine, NowLabel, and WaitArc share omission when they would occlude NextPointer;
  // NowTriangle stays in the model (see shouldOmitNowWaitVisualsForNextPointerClearance).
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
          ...(nowPointer.radialLine != null
            ? [
                group("NowRadialLine", [
                  line(
                    mapPoint(nowPointer.radialLine.start, cx, cy),
                    mapPoint(nowPointer.radialLine.end, cx, cy),
                  ),
                ]),
              ]
            : []),
          ...(nowPointer.nowLabel != null
            ? [
                group("NowLabel", [
                  text({
                    content: nowPointer.nowLabel.content,
                    size: nowPointer.nowLabel.fontSize,
                    hAlign: "center",
                    angleRad: nowPointer.nowLabel.angleRad,
                    anchor: mapPoint(nowPointer.nowLabel.anchor, cx, cy),
                  }),
                ]),
              ]
            : []),
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

  const meta = {
    title,
    width,
    height,
    // previewFrame computed from actual primitives (scene space).
    previewFrame: null,
  };

  const root = group("tideDiagram", [
    refArcGroup,
    ...(waitArcGroup != null ? [waitArcGroup] : []),
    ticksGroup,
    tideMarksGroup,
    tickLabelsGroup,
    ...(centreClusterGroup != null ? [centreClusterGroup] : []),
    ...(timeNowLabelGroup != null ? [timeNowLabelGroup] : []),
    ...(nowPointerGroup != null ? [nowPointerGroup] : []),
    ...(nextPointerGroup != null ? [nextPointerGroup] : []),
  ]);
  meta.previewFrame = computeScenePreviewFrame(root);

  return {
    version: 2,
    meta,
    root,
  };
}
