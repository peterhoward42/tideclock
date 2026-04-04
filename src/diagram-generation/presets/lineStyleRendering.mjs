/**
 * Domain `lineStyle` tokens for named diagram styles (see `StyleProps.lineStyle`).
 * Preview / SVG output maps each token to `stroke-dasharray`; `null` means solid stroke.
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
 * SVG attribute fragment for stroked primitives (empty string when solid).
 *
 * @param {string | undefined} lineStyle
 * @returns {string}
 */
export function svgStrokeDasharrayAttrFragment(lineStyle) {
  if (lineStyle == null) return "";
  const dash = LINE_STYLE_SVG_DASHARRAY[lineStyle];
  if (dash == null) return "";
  return ` stroke-dasharray="${dash}"`;
}
