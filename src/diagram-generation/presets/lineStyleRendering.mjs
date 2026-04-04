/**
 * lineStyleRendering.mjs — Maps domain `lineStyle` tokens to SVG `stroke-dasharray` fragments.
 * Used at style load and render. Kind: Definition + pure logic. Does not own colour palettes.
 *
 * Domain `lineStyle` tokens for named diagram styles (`StyleProps.lineStyle` in styleBindings).
 * Entry value `null` means omit dasharray (solid). Tokens are asserted at style load via {@link assertKnownLineStyleToken}.
 *
 * Add new tokens here when the product introduces variants (e.g. `special-dashed`).
 */

/** @type {Record<string, string | null>} */
export const LINE_STYLE_SVG_DASHARRAY = {
  solid: null,
  dashed: "6 4",
};

/**
 * @param {string} token
 * @param {string} context
 * @returns {void}
 */
export function assertKnownLineStyleToken(token, context) {
  if (!Object.prototype.hasOwnProperty.call(LINE_STYLE_SVG_DASHARRAY, token)) {
    throw new Error(
      `${context}: unknown lineStyle "${token}" (add it to LINE_STYLE_SVG_DASHARRAY in lineStyleRendering.mjs)`,
    );
  }
}

/**
 * SVG attribute fragment for stroked primitives: empty when solid/omitted or unknown token.
 *
 * @param {string | undefined} lineStyle token from a loaded style, or undefined
 * @returns {string}
 */
export function svgStrokeDasharrayAttrFragment(lineStyle) {
  if (lineStyle == null) return "";
  const dash = LINE_STYLE_SVG_DASHARRAY[lineStyle];
  if (dash == null) return "";
  return ` stroke-dasharray="${dash}"`;
}
