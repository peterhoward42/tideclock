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
 *   kind: 'arc',
 *   center: Point,
 *   start: Point,
 *   sweepRad: number,
 *   facetedPreview?: boolean,
 *   arrowAtEnd?: boolean,
 * }} ArcPrimitive
 *
 * @typedef {{
 *   kind: 'triangle',
 *   a: Point,
 *   b: Point,
 *   c: Point,
 *   // If true, preview renders stroke-only outline; otherwise filled.
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
 * Scene-space axis-aligned rectangle for preview framing (diagram `contentBounds` via `toScene`, or set in scenegen `spec`).
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

/** @param {number} x @param {number} y @returns {Point} */
export function point(x, y) {
  return { x, y };
}

/**
 * @param {string} name
 * @param {SceneNode[]} children
 * @returns {GroupNode}
 */
export function group(name, children) {
  return { kind: "group", name, children };
}

/**
 * @param {Point} start
 * @param {Point} end
 * @returns {LinePrimitive}
 */
export function line(start, end) {
  return { kind: "line", start, end };
}

/**
 * Circular arc only (constant radius from `center` to `start`); sweep CCW by `sweepRad`.
 * Elliptical arcs are not part of the model — preview renders with SVG `A` using rx = ry.
 *
 * @param {Point} center
 * @param {Point} start
 * @param {number} sweepRad
 * @param {{ facetedPreview?: boolean, arrowAtEnd?: boolean }} [opts]
 * if `facetedPreview`, HTML preview uses a polyline sample (debug).
 * if `arrowAtEnd`, renderers may draw an arrowhead at arc end.
 * @returns {ArcPrimitive}
 */
export function arc(center, start, sweepRad, opts) {
  const o = /** @type {ArcPrimitive} */ ({
    kind: "arc",
    center,
    start,
    sweepRad,
  });
  if (opts?.facetedPreview === true) o.facetedPreview = true;
  if (opts?.arrowAtEnd === true) o.arrowAtEnd = true;
  return o;
}

/**
 * Triangle primitive. Preview renders filled by default; `outline: true` requests stroke-only.
 * @param {Point} a
 * @param {Point} b
 * @param {Point} c
 * @param {{ outline?: boolean }} [opts]
 * @returns {TrianglePrimitive}
 */
export function triangle(a, b, c, opts) {
  const node = /** @type {TrianglePrimitive} */ ({ kind: "triangle", a, b, c });
  if (opts?.outline === true) node.outline = true;
  return node;
}

/**
 * Filled circle primitive (currently preview uses a solid fill).
 * @param {Point} center
 * @param {number} radius
 * @returns {CirclePrimitive}
 */
export function circle(center, radius) {
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
 */
export function text({ content, size, hAlign, angleRad, anchor }) {
  return { kind: "text", content, size, hAlign, angleRad, anchor };
}
