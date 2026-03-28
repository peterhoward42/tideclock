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
 * }} ArcPrimitive
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
 * @typedef { LinePrimitive | ArcPrimitive | TextPrimitive | GroupNode } SceneNode
 *
 * @typedef {{
 *   version: number,
 *   meta: { title: string, width: number, height: number },
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
 * Circular arc: radius from `center` to `start`; sweep CCW by `sweepRad`.
 * @param {Point} center
 * @param {Point} start
 * @param {number} sweepRad
 * @returns {ArcPrimitive}
 */
export function arc(center, start, sweepRad) {
  return { kind: "arc", center, start, sweepRad };
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
