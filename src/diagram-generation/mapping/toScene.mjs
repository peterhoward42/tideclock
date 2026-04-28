/**
 * toScene.mjs — Maps a `TideDiagramDocument` from `buildDiagram` into the scene graph for SVG render.
 * Kind: Pure logic (structure + coordinates). Does not stringify SVG.
 *
 * Callers must pass a complete document per tideDiagramModel (e.g. tickLabels and tideMarks are arrays, not omitted).
 */
import {
  annularSector,
  arc,
  arcSegment,
  group,
  line,
  point,
  roundedRect,
  text,
} from "../model/sceneModel.mjs";

/**
 * Deterministic scene-space bounds (x right, y up).
 * Used to derive `scene.meta.previewFrame` from actual primitives, not from legacy spec constants.
 */
function emptyBounds() {
  return { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
}

/**
 * @param {{ minX: number, minY: number, maxX: number, maxY: number }} b mutated in place
 * @param {{ x: number, y: number }} p
 */
function expandBoundsByPoint(b, p) {
  if (p.x < b.minX) b.minX = p.x;
  if (p.y < b.minY) b.minY = p.y;
  if (p.x > b.maxX) b.maxX = p.x;
  if (p.y > b.maxY) b.maxY = p.y;
}

/** @param {{ minX: number, minY: number, maxX: number, maxY: number }} b mutated in place */
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

/**
 * Shortest signed CCW/CW delta from angle a2 to a3, in (-π, π].
 *
 * @param {number} a2
 * @param {number} a3
 * @returns {number}
 */
function shortestSignedAngleDelta(a2, a3) {
  let d = a3 - a2;
  const tau = 2 * Math.PI;
  while (d <= -Math.PI) d += tau;
  while (d > Math.PI) d -= tau;
  return d;
}

/**
 * True if `pointAngle` lies strictly in the interior of the arc from `startAngle`
 * with signed `sweepRad` (CCW positive), modulo 2π.
 *
 * @param {number} pointAngle
 * @param {number} startAngle
 * @param {number} sweepRad
 * @returns {boolean}
 */
function angleStrictlyInSignedSweep(pointAngle, startAngle, sweepRad) {
  const eps = 1e-7;
  if (Math.abs(sweepRad) < eps) return false;
  const p = normalizeAngleRad(pointAngle);
  const s0 = normalizeAngleRad(startAngle);
  const s1 = normalizeAngleRad(startAngle + sweepRad);
  if (sweepRad > 0) {
    if (s1 >= s0) return p > s0 + eps && p < s1 - eps;
    return p > s0 + eps || p < s1 - eps;
  }
  if (s1 <= s0) return p < s0 - eps && p > s1 + eps;
  return p < s0 - eps || p > s1 + eps;
}

/**
 * CCW arc from v2 to v3 on the circle through the tide-pointer head that does **not**
 * pass through v1 (the pin tip). See docs/specs/tide-diagram.md §TimePointer.
 *
 * @param {{ x: number, y: number }} v1
 * @param {{ x: number, y: number }} v2
 * @param {{ x: number, y: number }} v3
 * @param {{ x: number, y: number }} center
 * @returns {number}
 */
function timePointerHeadArcSweepRad(v1, v2, v3, center) {
  const cx = center.x;
  const cy = center.y;
  const a1 = Math.atan2(v1.y - cy, v1.x - cx);
  const a2 = Math.atan2(v2.y - cy, v2.x - cx);
  const a3 = Math.atan2(v3.y - cy, v3.x - cx);
  const shortSweep = shortestSignedAngleDelta(a2, a3);
  const tau = 2 * Math.PI;
  const longSweep = shortSweep > 0 ? shortSweep - tau : shortSweep + tau;
  const shortHasV1 = angleStrictlyInSignedSweep(a1, a2, shortSweep);
  return shortHasV1 ? longSweep : shortSweep;
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

/** @param {{ minX: number, minY: number, maxX: number, maxY: number }} b mutated in place */
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

/** @param {{ minX: number, minY: number, maxX: number, maxY: number }} b mutated in place */
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
  const ay = node.anchor.y;
  let y0;
  let y1;
  if (node.dominantBaseline === "middle") {
    // Match `dominant-baseline="middle"`: symmetric em box around anchor.
    const halfEm = 0.52 * size;
    y0 = ay - halfEm;
    y1 = ay + halfEm;
  } else {
    // `dominant-baseline="alphabetic"`: anchor is baseline.
    y0 = ay - desc;
    y1 = ay + asc;
  }

  const ang = Number(node.angleRad) || 0;
  if (Math.abs(ang) < 1e-12) {
    expandBoundsByRect(b, x0, y0, x1, y1);
    return;
  }
  const c = Math.cos(ang);
  const s = Math.sin(ang);
  const ax = node.anchor.x;
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

/** @param {{ minX: number, minY: number, maxX: number, maxY: number }} b mutated in place */
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
    case "roundedRect": {
      const { center, width, height } = node;
      const hw = 0.5 * width;
      const hh = 0.5 * height;
      expandBoundsByRect(
        b,
        center.x - hw,
        center.y - hh,
        center.x + hw,
        center.y + hh,
      );
      return;
    }
    case "triangle":
      expandBoundsByPoint(b, node.a);
      expandBoundsByPoint(b, node.b);
      expandBoundsByPoint(b, node.c);
      return;
    case "nowWedgeOutline":
      expandBoundsByPoint(b, node.vertex);
      expandBoundsByPoint(b, node.outerArcStart);
      expandBoundsByArc(b, {
        center: node.center,
        start: node.outerArcStart,
        sweepRad: node.outerArcSweepRad,
      });
      return;
    case "arc":
      expandBoundsByArc(b, node);
      return;
    case "arcSegment":
      expandBoundsByArc(b, node);
      return;
    case "annularSector":
      expandBoundsByAnnularSector(b, node);
      return;
    case "text":
      expandBoundsByText(b, node);
      return;
    default:
      // Unknown scene node kinds: skip (extensible renderer may add kinds before bounds logic catches up).
      return;
  }
}

/** @param {{ center: { x: number, y: number }, rInner: number, rOuter: number, thetaStart: number, sweepRad: number }} node */
function expandBoundsByAnnularSector(b, node) {
  const { center, rInner, rOuter, thetaStart, sweepRad } = node;
  expandBoundsByArc(b, {
    center,
    start: {
      x: center.x + rInner * Math.cos(thetaStart),
      y: center.y + rInner * Math.sin(thetaStart),
    },
    sweepRad,
  });
  expandBoundsByArc(b, {
    center,
    start: {
      x: center.x + rOuter * Math.cos(thetaStart),
      y: center.y + rOuter * Math.sin(thetaStart),
    },
    sweepRad,
  });
}

/** @param {import('../model/sceneModel.mjs').GroupNode} root */
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
 * @param {import('../model/tideDiagramModel.mjs').CentreFrameDiagram} cf
 * @param {number} cx
 * @param {number} cy
 * @returns {import('../model/sceneModel.mjs').GroupNode}
 */
export function centreFrameDiagramToGroup(cf, cx, cy) {
  const fa = cf.frameArc;
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
  return group("CentreFrame", [
    arcSegment(frameArcCenter, frameArcStart, fa.sweepRad),
  ]);
}

/**
 * @param {import('../model/tideDiagramModel.mjs').TimeDeltaDiagram} td
 * @param {number} cx
 * @param {number} cy
 * @returns {import('../model/sceneModel.mjs').GroupNode}
 */
export function timeDeltaDiagramToGroup(td, cx, cy) {
  /** @type {import('../model/sceneModel.mjs').GroupNode[]} */
  const timeDeltaChildren = [];
  if (td.countdownStripes != null) {
    const stripeNames = [
      "TimeDeltaLocation",
      "TimeDeltaPhase",
      "TimeDeltaNext",
      "TimeDeltaNextTime",
    ];
    if (td.countdownStripes.length !== stripeNames.length) {
      throw new Error(
        `timeDeltaDiagram.countdownStripes must have length ${stripeNames.length}`,
      );
    }
    for (let i = 0; i < td.countdownStripes.length; i += 1) {
      const seg = td.countdownStripes[i];
      const leaf = stripeNames[i];
      const node = text({
        content: seg.content,
        size: seg.fontSize,
        hAlign: seg.hAlign,
        angleRad: 0,
        anchor: mapPoint(seg.anchor, cx, cy),
      });
      timeDeltaChildren.push(group(leaf, [node]));
    }
  }
  if (td.timeDeltaEmptyStripes != null) {
    const emptyStripeNames = [
      "TimeDeltaLocation",
      "TimeDeltaPhase",
      "NoMoreTidesToday",
    ];
    if (td.timeDeltaEmptyStripes.length !== emptyStripeNames.length) {
      throw new Error(
        `timeDeltaDiagram.timeDeltaEmptyStripes must have length ${emptyStripeNames.length}`,
      );
    }
    for (let i = 0; i < emptyStripeNames.length; i += 1) {
      const seg = td.timeDeltaEmptyStripes[i];
      const leaf = emptyStripeNames[i];
      timeDeltaChildren.push(
        group(leaf, [
          text({
            content: seg.content,
            size: seg.fontSize,
            hAlign: seg.hAlign,
            angleRad: 0,
            anchor: mapPoint(seg.anchor, cx, cy),
          }),
        ]),
      );
    }
  }
  return group("TimeDelta", timeDeltaChildren);
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
  const p1 = mapPoint(tri.v1, cx, cy);
  const p2 = mapPoint(tri.v2, cx, cy);
  const p3 = mapPoint(tri.v3, cx, cy);
  const c = mapPoint(circ.center, cx, cy);
  const headSweep = timePointerHeadArcSweepRad(p1, p2, p3, c);
  const timePointerGroup = group("TimePointer", [
    line(p1, p2),
    line(p1, p3),
    arc(c, p2, headSweep),
  ]);
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
    insideTrack,
    tickMarks,
    tickLabels,
    tideMarks,
    annularBand: annularBandDiagram,
    homeMenuTrigger,
    timeNowDate,
    timeNowClock,
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

  const it = insideTrack;
  const insideTrackStart = mapPoint(
    {
      x: it.center.x + it.radius * Math.cos(it.thetaLeft),
      y: it.center.y + it.radius * Math.sin(it.thetaLeft),
    },
    cx,
    cy,
  );
  const insideTrackCenter = mapPoint(it.center, cx, cy);

  const tickChildren = tickMarks.map((tm) =>
    line(
      mapPoint(tm.start, cx, cy),
      mapPoint(tm.end, cx, cy),
    ),
  );

  const annularBandGroup = group("AnnularBand", [
    annularSector(
      mapPoint(annularBandDiagram.center, cx, cy),
      annularBandDiagram.rInner,
      annularBandDiagram.rOuter,
      annularBandDiagram.thetaLeft,
      annularBandDiagram.sweepRad,
    ),
  ]);

  const insideTrackGroup = group("InsideTrack", [
    arc(insideTrackCenter, insideTrackStart, insideTrack.sweepRad),
  ]);

  const refArcGroup = group("RefArc", [
    arc(arcCenter, arcStart, refArc.sweepRad),
  ]);
  const ticksGroup = group("TickMark", tickChildren);

  const tickLabelChildren = tickLabels.map((tl) =>
    text({
      content: tl.content,
      size: tl.fontSize,
      hAlign: "center",
      angleRad: 0,
      anchor: mapPoint(tl.anchor, cx, cy),
    }),
  );
  const tickLabelsGroup = group("TickLabel", tickLabelChildren);

  const tideMarkGroups = tideMarks.map((m) =>
    tideMarkDiagramToGroup(m, cx, cy),
  );
  const tideMarksGroup = group("TideMarks", tideMarkGroups);

  const centreFrameGroup = centreFrameDiagramToGroup(
    diagram.centreFrameDiagram,
    cx,
    cy,
  );
  const timeDeltaGroup = timeDeltaDiagramToGroup(
    diagram.timeDeltaDiagram,
    cx,
    cy,
  );

  const timeNowDateGroup = group("TimeNowDate", [
    text({
      content: timeNowDate.content,
      size: timeNowDate.fontSize,
      hAlign: timeNowDate.hAlign ?? "center",
      angleRad: 0,
      anchor: mapPoint(timeNowDate.anchor, cx, cy),
    }),
  ]);

  const timeNowClockGroup = group("TimeNowClock", [
    group("TimeNowLabelHms", [
      text({
        content: timeNowClock.hhmm.content,
        size: timeNowClock.hhmm.fontSize,
        hAlign: timeNowClock.hhmm.hAlign ?? "center",
        angleRad: 0,
        anchor: mapPoint(timeNowClock.hhmm.anchor, cx, cy),
      }),
    ]),
    group("TimeNowLabelSecondsColon", [
      text({
        content: timeNowClock.secondsColon.content,
        size: timeNowClock.secondsColon.fontSize,
        hAlign: timeNowClock.secondsColon.hAlign ?? "center",
        angleRad: 0,
        anchor: mapPoint(timeNowClock.secondsColon.anchor, cx, cy),
      }),
    ]),
    group("TimeNowLabelSeconds", [
      text({
        content: timeNowClock.seconds.content,
        size: timeNowClock.seconds.fontSize,
        hAlign: timeNowClock.seconds.hAlign ?? "center",
        angleRad: 0,
        anchor: mapPoint(timeNowClock.seconds.anchor, cx, cy),
      }),
    ]),
  ]);

  const menuCenter = mapPoint(homeMenuTrigger.center, cx, cy);
  const homeMenuTriggerGroup = group("HomeMenuTrigger", [
    roundedRect(
      menuCenter,
      homeMenuTrigger.width,
      homeMenuTrigger.height,
      homeMenuTrigger.cornerRadius,
    ),
    group("HomeMenuTriggerLabel", [
      text({
        content: homeMenuTrigger.label,
        size: homeMenuTrigger.labelSize,
        hAlign: "center",
        angleRad: 0,
        anchor: menuCenter,
        dominantBaseline: "middle",
      }),
    ]),
  ]);

  const meta = {
    title,
    width,
    height,
    // previewFrame computed from actual primitives (scene space).
    previewFrame: null,
  };

  const root = group("tideDiagram", [
    annularBandGroup,
    insideTrackGroup,
    refArcGroup,
    ticksGroup,
    tideMarksGroup,
    tickLabelsGroup,
    centreFrameGroup,
    timeDeltaGroup,
    timeNowDateGroup,
    timeNowClockGroup,
    homeMenuTriggerGroup,
  ]);
  meta.previewFrame = computeScenePreviewFrame(root);

  return {
    version: 2,
    meta,
    root,
  };
}
