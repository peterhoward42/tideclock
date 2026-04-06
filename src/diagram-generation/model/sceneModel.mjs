/**
 * sceneModel.mjs — Scene graph primitives and constructors used by `toScene` and render.
 * Coordinates: x right, y up (math-style, not SVG). Kind: Definition. Does not read tide specs.
 *
 * Scene graph: named groups (structure) and geometry primitives.
 * Coordinates: x right, y up (math-style, not SVG). Angles: radians (CCW from +x).
 *
 * @typedef {{ x: number, y: number }} Point
 *
 * @typedef {'left' | 'center' | 'right'} TextHAlign
 *
 * @typedef {{
 *   kind: 'line',
 *   start: Point,
 *   end: Point,
 * }} LinePrimitive
 *
 * @typedef {{
 *   at: 'end',
 *   lengthK: number,
 *   widthK: number,
 *   insetK: number,
 *   style: 'filled' | 'open',
 *   scaleWithStroke: boolean,
 * }} ArcArrowMeta
 *
 * @typedef {{
 *   kind: 'arc',
 *   center: Point,
 *   start: Point,
 *   sweepRad: number,
 *   facetedPreview?: boolean,
 *   arrow?: ArcArrowMeta,
 * }} ArcPrimitive
 *
 * @typedef {{
 *   kind: 'triangle',
 *   a: Point,
 *   b: Point,
 *   c: Point,
 *   outline?: boolean,
 * }} TrianglePrimitive
 *
 * Stroke-only closed path for the Now “triangle”: vertex on RefArc, two segments to the annulus
 * outer circle, cap = minor arc on that circle. See docs/specs/tide-diagram.md §NowPointer.
 *
 * @typedef {{
 *   kind: 'nowWedgeOutline',
 *   center: Point,
 *   vertex: Point,
 *   outerArcStart: Point,
 *   outerArcSweepRad: number,
 * }} NowWedgeOutlinePrimitive
 *
 * @typedef {{
 *   kind: 'circle',
 *   center: Point,
 *   radius: number,
 * }} CirclePrimitive
 *
 * Closed annular sector: inner/outer circular arcs (same centre, CCW **sweepRad** from **thetaStart**)
 * joined by radial segments at both ends. See docs/specs/tide-diagram.md §AnnularBand.
 *
 * @typedef {{
 *   kind: 'annularSector',
 *   center: Point,
 *   rInner: number,
 *   rOuter: number,
 *   thetaStart: number,
 *   sweepRad: number,
 * }} AnnularSectorPrimitive
 *
 * @typedef {{
 *   kind: 'text',
 *   content: string,
 *   size: number,
 *   hAlign: TextHAlign,
 *   angleRad: number,
 *   anchor: Point,
 * }} TextPrimitive
 *
 * @typedef {{
 *   kind: 'group',
 *   name: string,
 *   children: SceneNode[],
 * }} GroupNode
 *
 * @typedef { LinePrimitive | ArcPrimitive | TrianglePrimitive | NowWedgeOutlinePrimitive | CirclePrimitive | AnnularSectorPrimitive | TextPrimitive | GroupNode } SceneNode
 *
 * @typedef {{
 *   title: string,
 *   width: number,
 *   height: number,
 *   previewFrame: { minX: number, maxX: number, minY: number, maxY: number },
 * }} SceneMeta
 *
 * @typedef {{
 *   version: number,
 *   meta: SceneMeta,
 *   root: GroupNode,
 * }} SceneDocument
 */

/** @param {string} label @param {number} value */
function assertFiniteNumber(label, value) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
}

/**
 * @param {string} label
 * @param {unknown} p
 */
function assertPoint(label, p) {
  if (p == null || typeof p !== "object") {
    throw new Error(`${label} must be a point { x, y }`);
  }
  const o = /** @type {{ x?: unknown, y?: unknown }} */ (p);
  assertFiniteNumber(`${label}.x`, /** @type {number} */ (o.x));
  assertFiniteNumber(`${label}.y`, /** @type {number} */ (o.y));
}

const TEXT_HALIGNS = /** @type {const} */ (["left", "center", "right"]);

/** @param {number} x @param {number} y @returns {Point} */
export function point(x, y) {
  assertFiniteNumber("x", x);
  assertFiniteNumber("y", y);
  return { x, y };
}

/**
 * @param {string} name
 * @param {SceneNode[]} children
 * @returns {GroupNode}
 * @throws {Error} `name` is not a string or `children` is not an array
 */
export function group(name, children) {
  if (typeof name !== "string") {
    throw new Error("name must be a string");
  }
  if (!Array.isArray(children)) {
    throw new Error("children must be an array");
  }
  return { kind: "group", name, children };
}

/**
 * @param {Point} start
 * @param {Point} end
 * @returns {LinePrimitive}
 * @throws {Error} `start` or `end` is not a finite point
 */
export function line(start, end) {
  assertPoint("start", start);
  assertPoint("end", end);
  return { kind: "line", start, end };
}

/**
 * @param {Point} center
 * @param {Point} start
 * @param {number} sweepRad
 * @param {{ facetedPreview?: boolean, arrow?: ArcArrowMeta }} [opts]
 * @returns {ArcPrimitive}
 * @throws {Error} `center`, `start`, or `sweepRad` invalid; optional `opts.arrow` not a plain object when present
 */
export function arc(center, start, sweepRad, opts) {
  assertPoint("center", center);
  assertPoint("start", start);
  assertFiniteNumber("sweepRad", sweepRad);
  if (opts?.arrow != null && (typeof opts.arrow !== "object" || opts.arrow === null)) {
    throw new Error("opts.arrow must be a plain object when provided");
  }
  const o = /** @type {ArcPrimitive} */ ({
    kind: "arc",
    center,
    start,
    sweepRad,
  });
  if (opts?.facetedPreview === true) o.facetedPreview = true;
  if (opts?.arrow != null) o.arrow = opts.arrow;
  return o;
}

/**
 * @param {Point} a
 * @param {Point} b
 * @param {Point} c
 * @param {{ outline?: boolean }} [opts]
 * @returns {TrianglePrimitive}
 * @throws {Error} any vertex is not a finite point
 */
export function triangle(a, b, c, opts) {
  assertPoint("a", a);
  assertPoint("b", b);
  assertPoint("c", c);
  const node = /** @type {TrianglePrimitive} */ ({ kind: "triangle", a, b, c });
  if (opts?.outline === true) node.outline = true;
  return node;
}

/**
 * @param {Point} center — RefArc centre (diagram space)
 * @param {Point} vertex — on RefArc, wedge tip toward **center**
 * @param {Point} outerArcStart — one intersection of a wedge ray with the annulus outer circle
 * @param {number} outerArcSweepRad — signed CCW sweep on the outer circle to the other ray intersection (minor arc)
 * @returns {NowWedgeOutlinePrimitive}
 */
export function nowWedgeOutline(center, vertex, outerArcStart, outerArcSweepRad) {
  assertPoint("center", center);
  assertPoint("vertex", vertex);
  assertPoint("outerArcStart", outerArcStart);
  assertFiniteNumber("outerArcSweepRad", outerArcSweepRad);
  return {
    kind: "nowWedgeOutline",
    center,
    vertex,
    outerArcStart,
    outerArcSweepRad,
  };
}

/**
 * @param {Point} center
 * @param {number} radius
 * @returns {CirclePrimitive}
 * @throws {Error} `center` is not a finite point or `radius` is not a finite non-negative number
 */
export function circle(center, radius) {
  assertPoint("center", center);
  assertFiniteNumber("radius", radius);
  if (radius < 0) {
    throw new Error("radius must be non-negative");
  }
  return { kind: "circle", center, radius };
}

/**
 * @param {Point} center
 * @param {number} rInner
 * @param {number} rOuter
 * @param {number} thetaStart radians (CCW from +x), inner arc start angle
 * @param {number} sweepRad signed CCW sweep for the inner arc (same subtended angle as RefArc)
 * @returns {AnnularSectorPrimitive}
 * @throws {Error} invalid geometry
 */
export function annularSector(center, rInner, rOuter, thetaStart, sweepRad) {
  assertPoint("center", center);
  assertFiniteNumber("rInner", rInner);
  assertFiniteNumber("rOuter", rOuter);
  assertFiniteNumber("thetaStart", thetaStart);
  assertFiniteNumber("sweepRad", sweepRad);
  if (rInner <= 0) {
    throw new Error("rInner must be positive");
  }
  if (rOuter <= rInner) {
    throw new Error("rOuter must be greater than rInner");
  }
  return {
    kind: "annularSector",
    center,
    rInner,
    rOuter,
    thetaStart,
    sweepRad,
  };
}

/**
 * @param {object} o
 * @param {string} o.content
 * @param {number} o.size
 * @param {TextHAlign} o.hAlign
 * @param {number} o.angleRad
 * @param {Point} o.anchor
 * @returns {TextPrimitive}
 * @throws {Error} missing or invalid fields
 */
export function text({ content, size, hAlign, angleRad, anchor }) {
  if (typeof content !== "string") {
    throw new Error("content must be a string");
  }
  assertFiniteNumber("size", size);
  if (!TEXT_HALIGNS.includes(hAlign)) {
    throw new Error('hAlign must be "left", "center", or "right"');
  }
  assertFiniteNumber("angleRad", angleRad);
  assertPoint("anchor", anchor);
  return { kind: "text", content, size, hAlign, angleRad, anchor };
}
