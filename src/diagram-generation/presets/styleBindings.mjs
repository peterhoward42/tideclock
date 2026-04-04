/**
 * styleBindings.mjs — Loads named styles and scene-leaf bindings into runtime maps for SVG render.
 * Consumed at collaborator init. Kind: Service (load-time). Does not layout geometry.
 *
 * Style registry and leaf-name style bindings (load-time only).
 *
 * Policy:
 * - Bindings are directional: scene leaf name → named style.
 * - Duplicate leaf names throw; unknown styleName in a binding throws.
 * - `color` allows CSS named colors and 3-digit hex (#abc).
 * - Optional `lineStyle` is a domain token validated against `lineStyleRendering.mjs`.
 *
 * `loadStyleModel` returns maps used when resolving SVG attributes from scene nodes;
 * pass `null`/`undefined` for an empty registry (no styles), otherwise an object shaped
 * like {@link StyleModelSpec} (validated field-by-field; throws on bad data).
 */

import { assertKnownLineStyleToken } from "./lineStyleRendering.mjs";

/** @typedef {{ color?: string, lineStyle?: string }} StyleProps */

/** @typedef {{ name: string, style: StyleProps }} NamedStyle */

/** @typedef {{ name: string, styleName: string }} NameStyleBinding */

/** @typedef {{
 *   styles: NamedStyle[],
 *   bindings: NameStyleBinding[],
 * }} StyleModelSpec
 */

const CSS_NAMED_COLORS = new Set([
  "aliceblue", "antiquewhite", "aqua", "aquamarine", "azure", "beige",
  "bisque", "black", "blanchedalmond", "blue", "blueviolet", "brown",
  "burlywood", "cadetblue", "chartreuse", "chocolate", "coral",
  "cornflowerblue", "cornsilk", "crimson", "cyan", "darkblue", "darkcyan",
  "darkgoldenrod", "darkgray", "darkgreen", "darkgrey", "darkkhaki",
  "darkmagenta", "darkolivegreen", "darkorange", "darkorchid", "darkred",
  "darksalmon", "darkseagreen", "darkslateblue", "darkslategray",
  "darkslategrey", "darkturquoise", "darkviolet", "deeppink", "deepskyblue",
  "dimgray", "dimgrey", "dodgerblue", "firebrick", "floralwhite",
  "forestgreen", "fuchsia", "gainsboro", "ghostwhite", "gold", "goldenrod",
  "gray", "green", "greenyellow", "grey", "honeydew", "hotpink",
  "indianred", "indigo", "ivory", "khaki", "lavender", "lavenderblush",
  "lawngreen", "lemonchiffon", "lightblue", "lightcoral", "lightcyan",
  "lightgoldenrodyellow", "lightgray", "lightgreen", "lightgrey",
  "lightpink", "lightsalmon", "lightseagreen", "lightskyblue",
  "lightslategray", "lightslategrey", "lightsteelblue", "lightyellow",
  "lime", "limegreen", "linen", "magenta", "maroon", "mediumaquamarine",
  "mediumblue", "mediumorchid", "mediumpurple", "mediumseagreen",
  "mediumslateblue", "mediumspringgreen", "mediumturquoise",
  "mediumvioletred", "midnightblue", "mintcream", "mistyrose", "moccasin",
  "navajowhite", "navy", "oldlace", "olive", "olivedrab", "orange",
  "orangered", "orchid", "palegoldenrod", "palegreen", "paleturquoise",
  "palevioletred", "papayawhip", "peachpuff", "peru", "pink", "plum",
  "powderblue", "purple", "rebeccapurple", "red", "rosybrown", "royalblue",
  "saddlebrown", "salmon", "sandybrown", "seagreen", "seashell", "sienna",
  "silver", "skyblue", "slateblue", "slategray", "slategrey", "snow",
  "springgreen", "steelblue", "tan", "teal", "thistle", "tomato",
  "turquoise", "violet", "wheat", "white", "whitesmoke", "yellow",
  "yellowgreen",
]);

const THREE_DIGIT_HEX = /^#[0-9a-fA-F]{3}$/;

/**
 * Parse and validate a style model config.
 *
 * @param {unknown} raw `null`/`undefined` → empty maps; otherwise must be an object with
 *   `styles` and `bindings` arrays per {@link StyleModelSpec}.
 * @returns {{
 *   stylesByName: Map<string, StyleProps>,
 *   nameToStyle: Map<string, string>,
 * }} Resolved named styles and leaf→styleName lookup for render.
 */
export function loadStyleModel(raw) {
  if (raw == null) {
    return {
      stylesByName: new Map(),
      nameToStyle: new Map(),
    };
  }
  if (typeof raw !== "object") {
    throw new Error("styleModel must be an object");
  }
  const model = /** @type {Record<string, unknown>} */ (raw);

  const stylesByName = loadNamedStyles(model.styles);
  const nameToStyle = loadNameStyleBindings(model.bindings, stylesByName);

  return { stylesByName, nameToStyle };
}

/**
 * @param {unknown} rawStyles
 * @returns {Map<string, StyleProps>}
 */
function loadNamedStyles(rawStyles) {
  if (!Array.isArray(rawStyles)) {
    throw new Error("styleModel.styles must be an array");
  }
  /** @type {Map<string, StyleProps>} */
  const stylesByName = new Map();
  for (const [idx, entry] of rawStyles.entries()) {
    if (entry == null || typeof entry !== "object") {
      throw new Error(`styleModel.styles[${idx}] must be an object`);
    }
    const s = /** @type {Record<string, unknown>} */ (entry);
    if (typeof s.name !== "string" || s.name.trim() === "") {
      throw new Error(`styleModel.styles[${idx}].name must be a non-empty string`);
    }
    if (stylesByName.has(s.name)) {
      throw new Error(`duplicate style name "${s.name}"`);
    }
    if (s.style == null || typeof s.style !== "object") {
      throw new Error(`styleModel.styles[${idx}].style must be an object`);
    }
    const style = normalizeStyleProps(
      /** @type {Record<string, unknown>} */ (s.style),
      `styleModel.styles[${idx}].style`,
    );
    stylesByName.set(s.name, style);
  }
  return stylesByName;
}

/**
 * @param {unknown} rawBindings
 * @param {Map<string, StyleProps>} stylesByName
 * @returns {Map<string, string>}
 */
function loadNameStyleBindings(rawBindings, stylesByName) {
  if (!Array.isArray(rawBindings)) {
    throw new Error("styleModel.bindings must be an array");
  }
  /** @type {Map<string, string>} */
  const nameToStyle = new Map();
  for (const [idx, entry] of rawBindings.entries()) {
    if (entry == null || typeof entry !== "object") {
      throw new Error(`styleModel.bindings[${idx}] must be an object`);
    }
    const b = /** @type {Record<string, unknown>} */ (entry);
    if (typeof b.name !== "string" || b.name.trim() === "") {
      throw new Error(`styleModel.bindings[${idx}].name must be a non-empty string`);
    }
    if (typeof b.styleName !== "string" || b.styleName.trim() === "") {
      throw new Error(`styleModel.bindings[${idx}].styleName must be a non-empty string`);
    }
    if (!stylesByName.has(b.styleName)) {
      throw new Error(
        `styleModel.bindings[${idx}] references unknown style "${b.styleName}"`,
      );
    }
    if (nameToStyle.has(b.name)) {
      throw new Error(
        `duplicate binding for "${b.name}": already bound to "${nameToStyle.get(b.name)}", cannot bind to "${b.styleName}"`,
      );
    }
    nameToStyle.set(b.name, b.styleName);
  }
  return nameToStyle;
}

/**
 * @param {Record<string, unknown>} raw
 * @param {string} context
 * @returns {StyleProps}
 */
function normalizeStyleProps(raw, context) {
  /** @type {StyleProps} */
  const out = {};
  if (raw.color !== undefined) {
    if (typeof raw.color !== "string") {
      throw new Error(`${context}.color must be a string`);
    }
    if (!isAllowedColor(raw.color)) {
      throw new Error(
        `${context}.color must be a CSS named color or 3-digit hex like "#333"`,
      );
    }
    out.color = raw.color;
  }
  if (raw.lineStyle !== undefined) {
    if (typeof raw.lineStyle !== "string" || raw.lineStyle.trim() === "") {
      throw new Error(`${context}.lineStyle must be a non-empty string`);
    }
    assertKnownLineStyleToken(raw.lineStyle, context);
    out.lineStyle = raw.lineStyle;
  }
  return out;
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isAllowedColor(value) {
  if (THREE_DIGIT_HEX.test(value)) return true;
  return CSS_NAMED_COLORS.has(value.toLowerCase());
}
