/**
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
 * @typedef {{
 *   kind: 'circle',
 *   center: Point,
 *   radius: number,
 * }} CirclePrimitive
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
 * @typedef { LinePrimitive | ArcPrimitive | TrianglePrimitive | CirclePrimitive | TextPrimitive | GroupNode } SceneNode
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
