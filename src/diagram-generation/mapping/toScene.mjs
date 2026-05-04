/**
 * toScene.mjs — Maps a `TideDiagramDocument` from `buildDiagram` into the scene graph for SVG render.
 * Kind: Pure logic (structure + coordinates). Does not stringify SVG.
 *
 * Callers must pass a complete document per tideDiagramModel (e.g. tickLabels and tideMarks are arrays, not omitted).
 */
import {
  annularSector,
  arc,
  circle,
  group,
  line,
  point,
  roundedRect,
  text,
  arcText,
  timePointerPath,
} from "../model/sceneModel.mjs";

/** Style-binding leaf names for tick segments (nested under scene group `TickMark`). */
function tickMarkStyleLeafGroup(hour) {
  if (hour === 0 || hour === 24) return "TickMark.Endpoint";
  if (hour === 6 || hour === 12 || hour === 18) return "TickMark.Quarter";
  return "TickMark";
}

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
function expandBoundsByArcText(b, node) {
  const chars = Array.from(node.content);
  if (chars.length === 0) return;
  const glyphSweep = node.sweepRad / chars.length;
  for (let i = 0; i < chars.length; i += 1) {
    const theta = node.thetaStart + (i + 0.5) * glyphSweep;
    const anchor = {
      x: node.center.x + node.radius * Math.cos(theta),
      y: node.center.y + node.radius * Math.sin(theta),
    };
    expandBoundsByText(b, {
      content: chars[i],
      size: node.size,
      hAlign: "center",
      angleRad: theta + Math.PI / 2,
      anchor,
      dominantBaseline: "middle",
    });
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
    case "arc":
      expandBoundsByArc(b, node);
      return;
    case "arcSegment":
      expandBoundsByArc(b, node);
      return;
    case "timePointerPath":
      expandBoundsByPoint(b, node.v1);
      expandBoundsByPoint(b, node.v2);
      expandBoundsByPoint(b, node.v3);
      expandBoundsByArc(b, {
        center: node.headCenter,
        start: node.v2,
        sweepRad: node.headSweepRad,
      });
      return;
    case "annularSector":
      expandBoundsByAnnularSector(b, node);
      return;
    case "text":
      expandBoundsByText(b, node);
      return;
    case "arcText":
      expandBoundsByArcText(b, node);
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
 * @typedef {{ name: string, place: 'before' | 'after', relativeTo: string }} PaintOrderOverride
 */

/**
 * @param {unknown} raw
 * @returns {PaintOrderOverride[]}
 */
function parsePaintOrderOverrides(raw) {
  if (raw == null) return [];
  if (typeof raw !== "object") {
    throw new Error("diagram.paintOrder must be an object when provided");
  }
  const paintOrder = /** @type {Record<string, unknown>} */ (raw);
  if (paintOrder.overrides == null) return [];
  if (!Array.isArray(paintOrder.overrides)) {
    throw new Error("diagram.paintOrder.overrides must be an array when provided");
  }
  /** @type {Set<string>} */
  const seenNames = new Set();
  return paintOrder.overrides.map((entry, i) => {
    if (entry == null || typeof entry !== "object") {
      throw new Error(`diagram.paintOrder.overrides[${i}] must be an object`);
    }
    const o = /** @type {Record<string, unknown>} */ (entry);
    if (typeof o.name !== "string" || o.name.trim() === "") {
      throw new Error(`diagram.paintOrder.overrides[${i}].name must be a non-empty string`);
    }
    if (typeof o.relativeTo !== "string" || o.relativeTo.trim() === "") {
      throw new Error(
        `diagram.paintOrder.overrides[${i}].relativeTo must be a non-empty string`,
      );
    }
    if (o.place !== "before" && o.place !== "after") {
      throw new Error(
        `diagram.paintOrder.overrides[${i}].place must be "before" or "after"`,
      );
    }
    if (o.name === o.relativeTo) {
      throw new Error(
        `diagram.paintOrder.overrides[${i}] must not self-reference (${o.name})`,
      );
    }
    if (seenNames.has(o.name)) {
      throw new Error(`duplicate paintOrder override for "${o.name}"`);
    }
    seenNames.add(o.name);
    return {
      name: o.name,
      place: o.place,
      relativeTo: o.relativeTo,
    };
  });
}

/**
 * @param {import('../model/sceneModel.mjs').GroupNode} node
 * @param {Map<string, number>} counts
 */
function collectGroupNameCounts(node, counts) {
  counts.set(node.name, (counts.get(node.name) ?? 0) + 1);
  for (const child of node.children) {
    if (child.kind !== "group") continue;
    collectGroupNameCounts(child, counts);
  }
}

/**
 * @param {string[]} names
 * @param {PaintOrderOverride[]} overrides
 */
function reorderNamesWithOverrides(names, overrides) {
  if (overrides.length === 0) return names;
  /** @type {Map<string, Set<string>>} */
  const outgoing = new Map(names.map((n) => [n, new Set()]));
  /** @type {Map<string, number>} */
  const indegree = new Map(names.map((n) => [n, 0]));
  const addEdge = (from, to) => {
    const fromEdges = outgoing.get(from);
    if (!fromEdges || fromEdges.has(to)) return;
    fromEdges.add(to);
    indegree.set(to, (indegree.get(to) ?? 0) + 1);
  };
  for (const override of overrides) {
    if (override.place === "before") {
      addEdge(override.name, override.relativeTo);
    } else {
      addEdge(override.relativeTo, override.name);
    }
  }
  const originalIndex = new Map(names.map((name, index) => [name, index]));
  const queue = names.filter((name) => (indegree.get(name) ?? 0) === 0);
  /** @type {string[]} */
  const sorted = [];
  while (queue.length > 0) {
    queue.sort((a, b) => (originalIndex.get(a) ?? 0) - (originalIndex.get(b) ?? 0));
    const name = queue.shift();
    if (!name) continue;
    sorted.push(name);
    for (const next of outgoing.get(name) ?? []) {
      const nextIn = (indegree.get(next) ?? 0) - 1;
      indegree.set(next, nextIn);
      if (nextIn === 0) queue.push(next);
    }
  }
  if (sorted.length !== names.length) {
    throw new Error("diagram.paintOrder.overrides contains cyclic relationships");
  }
  return sorted;
}

/**
 * @param {import('../model/sceneModel.mjs').GroupNode} node
 * @param {PaintOrderOverride[]} overrides
 * @returns {import('../model/sceneModel.mjs').GroupNode}
 */
function applyPaintOrderOverrides(node, overrides) {
  if (overrides.length === 0) return node;
  const nameCounts = new Map();
  collectGroupNameCounts(node, nameCounts);
  for (const override of overrides) {
    if (!nameCounts.has(override.name)) {
      throw new Error(
        `diagram.paintOrder.overrides references unknown group name "${override.name}"`,
      );
    }
    if (!nameCounts.has(override.relativeTo)) {
      throw new Error(
        `diagram.paintOrder.overrides references unknown group name "${override.relativeTo}"`,
      );
    }
  }
  /** @type {Map<PaintOrderOverride, number>} */
  const applications = new Map(overrides.map((override) => [override, 0]));
  /**
   * @param {import('../model/sceneModel.mjs').GroupNode} groupNode
   * @returns {import('../model/sceneModel.mjs').GroupNode}
   */
  const rewrite = (groupNode) => {
    const rewrittenChildren = groupNode.children.map((child) =>
      child.kind === "group" ? rewrite(child) : child,
    );
    const childGroups = rewrittenChildren.filter((child) => child.kind === "group");
    const childNameSet = new Set(childGroups.map((child) => child.name));
    const localOverrides = overrides.filter(
      (override) =>
        childNameSet.has(override.name) && childNameSet.has(override.relativeTo),
    );
    if (localOverrides.length === 0) {
      return group(groupNode.name, rewrittenChildren);
    }
    for (const override of localOverrides) {
      applications.set(override, (applications.get(override) ?? 0) + 1);
    }
    const childNames = childGroups.map((child) => child.name);
    const reorderedNames = reorderNamesWithOverrides(childNames, localOverrides);
    const groupedByName = new Map(childGroups.map((child) => [child.name, child]));
    const reorderedGroups = reorderedNames.map((name) => {
      const next = groupedByName.get(name);
      if (!next) {
        throw new Error(
          `diagram.paintOrder.overrides could not resolve name "${name}" in parent "${groupNode.name}"`,
        );
      }
      return next;
    });
    let groupCursor = 0;
    const mergedChildren = rewrittenChildren.map((child) => {
      if (child.kind !== "group") return child;
      const next = reorderedGroups[groupCursor];
      groupCursor += 1;
      return next;
    });
    return group(groupNode.name, mergedChildren);
  };
  const rewritten = rewrite(node);
  for (const override of overrides) {
    const count = applications.get(override) ?? 0;
    if (count === 0) {
      throw new Error(
        `diagram.paintOrder.override "${override.name}" could not be applied relative to "${override.relativeTo}"`,
      );
    }
    if (count > 1) {
      throw new Error(
        `diagram.paintOrder.override "${override.name}" is ambiguous relative to "${override.relativeTo}"`,
      );
    }
  }
  return rewritten;
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
  const styleSuffix = mark.temporalClass === "past" ? "Past" : "Future";
  const p1 = mapPoint(tri.v1, cx, cy);
  const p2 = mapPoint(tri.v2, cx, cy);
  const p3 = mapPoint(tri.v3, cx, cy);
  const c = mapPoint(circ.center, cx, cy);
  const headSweep = timePointerHeadArcSweepRad(p1, p2, p3, c);
  const timePointerGroup = group(`TimePointer${styleSuffix}`, [
    timePointerPath(p1, p2, p3, c, headSweep),
  ]);
  const hl = mark.heightLabel;
  const ac = hl.arcCenter;
  const thetaStart = Math.atan2(hl.anchor.y - ac.y, hl.anchor.x - ac.x);
  const radius = Math.hypot(hl.anchor.x - ac.x, hl.anchor.y - ac.y);
  return group("TideMark", [
    timePointerGroup,
    group(`HeightLabel${styleSuffix}`, [
      arcText({
        content: hl.content,
        size: hl.fontSize,
        center: mapPoint(ac, cx, cy),
        radius,
        thetaStart,
        sweepRad: hl.arcSweepRad,
      }),
    ]),
  ]);
}

/**
 * @param {import('../model/tideDiagramModel.mjs').HandDiagram} hand
 * @param {number} cx
 * @param {number} cy
 * @returns {import('../model/sceneModel.mjs').GroupNode}
 */
export function handDiagramToGroup(hand, cx, cy) {
  const ar = hand.armTimeReadout;
  return group("Hand", [
    group("BossCircle", [
      circle(mapPoint(hand.bossCircle.center, cx, cy), hand.bossCircle.radius),
    ]),
    group("Arm", [
      line(mapPoint(hand.arm.start, cx, cy), mapPoint(hand.arm.end, cx, cy)),
      group("Hand.TimeReadout", [
        text({
          content: ar.content,
          size: ar.fontSize,
          hAlign: "center",
          angleRad: ar.angleRad,
          anchor: mapPoint(ar.anchor, cx, cy),
          dominantBaseline: "middle",
        }),
      ]),
    ]),
  ]);
}

/**
 * Circular menu control + three-bar icon; **top-level** scene sibling (not under **BRHCBundle**).
 *
 * @param {import('../model/tideDiagramModel.mjs').HomeMenuTriggerDiagram} hm
 * @param {number} cx
 * @param {number} cy
 * @returns {import('../model/sceneModel.mjs').GroupNode}
 */
function homeMenuTriggerDiagramToGroup(hm, cx, cy) {
  const c = mapPoint(hm.center, cx, cy);
  const d = hm.diameter;
  const h = hm.iconBarHalfLength;
  const g = hm.iconBarCenterSpacing;
  const yTop = c.y + g;
  const yMid = c.y;
  const yBot = c.y - g;
  return group("HomeMenuTrigger", [
    roundedRect(c, d, d, 0.5 * d),
    group("HomeMenuTriggerIcon", [
      line({ x: c.x - h, y: yTop }, { x: c.x + h, y: yTop }),
      line({ x: c.x - h, y: yMid }, { x: c.x + h, y: yMid }),
      line({ x: c.x - h, y: yBot }, { x: c.x + h, y: yBot }),
    ]),
  ]);
}

/**
 * @param {import('../model/tideDiagramModel.mjs').TideDiagramDocument} diagram
 * @returns {import('../model/sceneModel.mjs').SceneDocument}
 */
export function tideDiagramToScene(diagram) {
  const { title } = diagram.meta;
  // Scene coords use diagram space as-is; SVG viewBox and y-flip baseline come from `previewFrame` in render.
  const cx = 0;
  const cy = 0;
  const {
    refArc,
    dividorArc,
    tickMarks,
    tickLabels,
    tideMarks,
    annularBand: annularBandDiagram,
    homeMenuTrigger,
    hand,
    mainLabel,
    brhcLocation,
    brhcDate,
    brand,
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

  const dividorR = dividorArc.radiusK * R;
  const dividorArcStart = mapPoint(
    {
      x: C.x + dividorR * Math.cos(refArc.thetaLeft),
      y: C.y + dividorR * Math.sin(refArc.thetaLeft),
    },
    cx,
    cy,
  );

  const tickChildren = tickMarks.map((tm) =>
    group(tickMarkStyleLeafGroup(tm.hour), [
      line(
        mapPoint(tm.start, cx, cy),
        mapPoint(tm.end, cx, cy),
      ),
      line(
        mapPoint(tm.bandOuterInward.start, cx, cy),
        mapPoint(tm.bandOuterInward.end, cx, cy),
      ),
    ]),
  );

  const abC = annularBandDiagram.center;
  const aThetaLeft = annularBandDiagram.thetaLeft;
  const aThetaRight = annularBandDiagram.thetaLeft + annularBandDiagram.sweepRad;
  const annularCenterScene = mapPoint(abC, cx, cy);
  const outerArcStart = mapPoint(
    {
      x: abC.x + annularBandDiagram.rOuter * Math.cos(aThetaLeft),
      y: abC.y + annularBandDiagram.rOuter * Math.sin(aThetaLeft),
    },
    cx,
    cy,
  );
  const annularBandGroup = group("AnnularBand", [
    annularSector(
      annularCenterScene,
      annularBandDiagram.rInner,
      annularBandDiagram.rOuter,
      annularBandDiagram.thetaLeft,
      annularBandDiagram.sweepRad,
      { fillOnly: true },
    ),
    arc(annularCenterScene, outerArcStart, annularBandDiagram.sweepRad),
    line(
      mapPoint(
        {
          x: abC.x + annularBandDiagram.rInner * Math.cos(aThetaLeft),
          y: abC.y + annularBandDiagram.rInner * Math.sin(aThetaLeft),
        },
        cx,
        cy,
      ),
      mapPoint(
        {
          x: abC.x + annularBandDiagram.rOuter * Math.cos(aThetaLeft),
          y: abC.y + annularBandDiagram.rOuter * Math.sin(aThetaLeft),
        },
        cx,
        cy,
      ),
    ),
    line(
      mapPoint(
        {
          x: abC.x + annularBandDiagram.rInner * Math.cos(aThetaRight),
          y: abC.y + annularBandDiagram.rInner * Math.sin(aThetaRight),
        },
        cx,
        cy,
      ),
      mapPoint(
        {
          x: abC.x + annularBandDiagram.rOuter * Math.cos(aThetaRight),
          y: abC.y + annularBandDiagram.rOuter * Math.sin(aThetaRight),
        },
        cx,
        cy,
      ),
    ),
  ]);

  const refArcGroup = group("RefArc", [
    arc(arcCenter, arcStart, refArc.sweepRad),
  ]);
  const dividorArcGroup = group("Dividor", [
    arc(arcCenter, dividorArcStart, refArc.sweepRad),
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
  const mainLabelGroup = group("MainLabel", [
    text({
      content: mainLabel.content,
      size: mainLabel.fontSize,
      hAlign: mainLabel.hAlign,
      angleRad: 0,
      anchor: mapPoint(mainLabel.anchor, cx, cy),
    }),
  ]);

  const tideMarkGroups = tideMarks.map((m) =>
    tideMarkDiagramToGroup(m, cx, cy),
  );
  const tideMarksGroup = group("TideMarks", tideMarkGroups);
  const handGroup = handDiagramToGroup(hand, cx, cy);

  const brhcLocationGroup = group("BRHCLocation", [
    text({
      content: brhcLocation.content,
      size: brhcLocation.fontSize,
      hAlign: brhcLocation.hAlign ?? "center",
      angleRad: 0,
      anchor: mapPoint(brhcLocation.anchor, cx, cy),
    }),
  ]);

  const brhcDateGroup = group("BRHCDate", [
    text({
      content: brhcDate.content,
      size: brhcDate.fontSize,
      hAlign: brhcDate.hAlign ?? "center",
      angleRad: 0,
      anchor: mapPoint(brhcDate.anchor, cx, cy),
    }),
  ]);

  const homeMenuTriggerGroup = homeMenuTriggerDiagramToGroup(homeMenuTrigger, cx, cy);
  const brandGroup = group(
    "Brand",
    brand.segments.map((seg) =>
      group(seg.leafName, [
        text({
          content: seg.content,
          size: brand.fontSize,
          hAlign: seg.hAlign ?? "left",
          angleRad: 0,
          anchor: mapPoint(seg.anchor, cx, cy),
          ...(seg.dominantBaseline === "middle"
            ? { dominantBaseline: "middle" }
            : {}),
        }),
      ]),
    ),
  );
  const brhcBundleGroup = group("BRHCBundle", [
    mainLabelGroup,
    brhcDateGroup,
    brhcLocationGroup,
  ]);

  const meta = {
    title,
    // previewFrame computed from actual primitives (scene space).
    previewFrame: null,
  };

  const root = group("tideDiagram", [
    handGroup,
    annularBandGroup,
    refArcGroup,
    dividorArcGroup,
    ticksGroup,
    tideMarksGroup,
    tickLabelsGroup,
    brhcBundleGroup,
    brandGroup,
    homeMenuTriggerGroup,
  ]);
  const orderedRoot = applyPaintOrderOverrides(
    root,
    parsePaintOrderOverrides(diagram.paintOrder),
  );
  meta.previewFrame = computeScenePreviewFrame(orderedRoot);

  return {
    version: 2,
    meta,
    root: orderedRoot,
  };
}
