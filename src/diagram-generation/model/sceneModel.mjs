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
 *   kind: 'arcSegment',
 *   center: Point,
 *   start: Point,
 *   sweepRad: number,
 * }} ArcSegmentPrimitive
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
 * Axis-aligned rounded rectangle in scene space (**y** upward), centred on **center**:
 * spans **width** along **+X** and **height** along **+Y** (edges at **center ± half**).
 *
 * @typedef {{
 *   kind: 'roundedRect',
 *   center: Point,
 *   width: number,
 *   height: number,
 *   rx: number,
 * }} RoundedRectPrimitive
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
 *   fillOnly?: boolean,
 * }} AnnularSectorPrimitive
 *
 * Closed map-pin silhouette for **TimePointer**: tip **v1**, sides **v1→v2** and **v1→v3**,
 * head arc from **v2** to **v3** on the circle centred at **headCenter** with signed **headSweepRad**
 * (same arc selection as the former independent line/arc trio). See docs/specs/tide-diagram.md §TimePointer.
 *
 * @typedef {{
 *   kind: 'timePointerPath',
 *   v1: Point,
 *   v2: Point,
 *   v3: Point,
 *   headCenter: Point,
 *   headSweepRad: number,
 * }} TimePointerPathPrimitive
 *
 * @typedef {{
 *   kind: 'text',
 *   content: string,
 *   size: number,
 *   hAlign: TextHAlign,
 *   angleRad: number,
 *   anchor: Point,
 *   dominantBaseline?: 'alphabetic' | 'middle',
 * }} TextPrimitive
 *
 * Text along a circular arc: each code point is a separate {@link text} with tangential rotation; spacing is
 * uniform in angle (see layout **arcSweepRad**). Avoid SVG **textPath** under the scene Y-flip without mirroring
 * the path—mirroring **text** alone warps **textPath** geometry by dial position.
 *
 * @typedef {{
 *   kind: 'arcText',
 *   content: string,
 *   size: number,
 *   center: Point,
 *   radius: number,
 *   thetaStart: number,
 *   sweepRad: number,
 * }} ArcTextPrimitive
 *
 * @typedef {{
 *   kind: 'group',
 *   name: string,
 *   children: SceneNode[],
 * }} GroupNode
 *
 * @typedef { LinePrimitive | ArcPrimitive | ArcSegmentPrimitive | TrianglePrimitive | CirclePrimitive | RoundedRectPrimitive | AnnularSectorPrimitive | TimePointerPathPrimitive | TextPrimitive | ArcTextPrimitive | GroupNode } SceneNode
 *
 * @typedef {{
 *   title: string,
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
 * Closed circular segment: an arc and the straight chord joining arc endpoints.
 *
 * @param {Point} center
 * @param {Point} start
 * @param {number} sweepRad
 * @returns {ArcSegmentPrimitive}
 */
export function arcSegment(center, start, sweepRad) {
  assertPoint("center", center);
  assertPoint("start", start);
  assertFiniteNumber("sweepRad", sweepRad);
  return {
    kind: "arcSegment",
    center,
    start,
    sweepRad,
  };
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
 * @param {Point} center — geometric centre (scene / diagram space, **y** up)
 * @param {number} width — full width along **+X**
 * @param {number} height — full height along **+Y**
 * @param {number} rx — corner radius (SVG **rx**); must be **≤ min(width,height)/2**
 * @returns {RoundedRectPrimitive}
 */
export function roundedRect(center, width, height, rx) {
  assertPoint("center", center);
  assertFiniteNumber("width", width);
  assertFiniteNumber("height", height);
  assertFiniteNumber("rx", rx);
  if (!(width > 0)) {
    throw new Error("width must be greater than 0");
  }
  if (!(height > 0)) {
    throw new Error("height must be greater than 0");
  }
  if (rx < 0) {
    throw new Error("rx must be non-negative");
  }
  const maxRx = 0.5 * Math.min(width, height);
  if (rx > maxRx + 1e-9) {
    throw new Error("rx must not exceed half the smaller of width and height");
  }
  return { kind: "roundedRect", center, width, height, rx };
}

/**
 * @param {Point} center
 * @param {number} rInner
 * @param {number} rOuter
 * @param {number} thetaStart radians (CCW from +x), inner arc start angle
 * @param {number} sweepRad signed CCW sweep for the inner arc (same subtended angle as RefArc)
 * @param {{ fillOnly?: boolean }} [opts] when **fillOnly**, render fill without stroke (pair with separate rim strokes).
 * @returns {AnnularSectorPrimitive}
 * @throws {Error} invalid geometry
 */
export function annularSector(center, rInner, rOuter, thetaStart, sweepRad, opts) {
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
  const node = {
    kind: "annularSector",
    center,
    rInner,
    rOuter,
    thetaStart,
    sweepRad,
  };
  if (opts?.fillOnly === true) {
    node.fillOnly = true;
  }
  return node;
}

/**
 * Closed **TimePointer** boundary (fill + stroke). Geometry matches the former line–line–arc trio.
 *
 * @param {Point} v1 — tip on RefArc
 * @param {Point} v2
 * @param {Point} v3
 * @param {Point} headCenter — head-circle centre
 * @param {number} headSweepRad — signed CCW sweep from **v2** to **v3** on that circle (excludes **v1**)
 * @returns {TimePointerPathPrimitive}
 */
export function timePointerPath(v1, v2, v3, headCenter, headSweepRad) {
  assertPoint("v1", v1);
  assertPoint("v2", v2);
  assertPoint("v3", v3);
  assertPoint("headCenter", headCenter);
  assertFiniteNumber("headSweepRad", headSweepRad);
  return {
    kind: "timePointerPath",
    v1,
    v2,
    v3,
    headCenter,
    headSweepRad,
  };
}

/**
 * @param {object} o
 * @param {string} o.content
 * @param {number} o.size
 * @param {TextHAlign} o.hAlign
 * @param {number} o.angleRad
 * @param {Point} o.anchor
 * @param {'alphabetic' | 'middle'} [o.dominantBaseline] - default **alphabetic** (SVG default); **middle** centres the em box on **anchor** for upright labels
 * @returns {TextPrimitive}
 * @throws {Error} missing or invalid fields
 */
export function text({ content, size, hAlign, angleRad, anchor, dominantBaseline }) {
  if (typeof content !== "string") {
    throw new Error("content must be a string");
  }
  assertFiniteNumber("size", size);
  if (!TEXT_HALIGNS.includes(hAlign)) {
    throw new Error('hAlign must be "left", "center", or "right"');
  }
  assertFiniteNumber("angleRad", angleRad);
  assertPoint("anchor", anchor);
  const node = /** @type {TextPrimitive} */ ({
    kind: "text",
    content,
    size,
    hAlign,
    angleRad,
    anchor,
  });
  if (dominantBaseline === "middle") {
    node.dominantBaseline = "middle";
  }
  return node;
}

/**
 * Text laid along a circular arc in scene space (per-glyph tangential **text**; see typedef).
 *
 * @param {object} o
 * @param {string} o.content
 * @param {number} o.size
 * @param {Point} o.center
 * @param {number} o.radius
 * @param {number} o.thetaStart — radians, first glyph sits near **thetaStart** (centres at **thetaStart + (i+½)·sweep/n**)
 * @param {number} o.sweepRad — total CCW angular span for the string (same sign convention as {@link arc})
 * @returns {ArcTextPrimitive}
 */
export function arcText({ content, size, center, radius, thetaStart, sweepRad }) {
  if (typeof content !== "string") {
    throw new Error("content must be a string");
  }
  assertFiniteNumber("size", size);
  assertPoint("center", center);
  assertFiniteNumber("radius", radius);
  assertFiniteNumber("thetaStart", thetaStart);
  assertFiniteNumber("sweepRad", sweepRad);
  if (!(radius > 0)) {
    throw new Error("radius must be greater than 0");
  }
  return {
    kind: "arcText",
    content,
    size,
    center,
    radius,
    thetaStart,
    sweepRad,
  };
}

