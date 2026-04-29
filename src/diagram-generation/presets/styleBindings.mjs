/**
 * styleBindings.mjs — Loads semantic color roles and scene-leaf bindings for SVG render.
 * Consumed at collaborator init. Kind: Service (load-time). Does not layout geometry.
 *
 * Style registry and leaf-name bindings (load-time only).
 *
 * Policy:
 * - Bindings are directional: scene leaf name → semantic role name.
 * - Duplicate leaf names throw; unknown roleName in a binding throws.
 * - `color`/`strokeColor`/`fillColor` allow CSS named colors and 3/6-digit hex (#abc, #aabbcc).
 * - Optional line styles are externalized from color roles: leaf name → lineStyle token.
 *
 * `loadStyleModel` returns maps used when resolving SVG attributes from scene nodes;
 * pass `null`/`undefined` for an empty registry (no styles), otherwise an object shaped
 * like {@link StyleModelSpec} (validated field-by-field; throws on bad data).
 * Declarative product defaults: `src/diagram-config/homeTideStyleModel.preset.ts`.
 */

import { assertKnownLineStyleToken } from "./lineStyleRendering.mjs";

/** @typedef {{ color?: string, strokeColor?: string, fillColor?: string }} RoleColorProps */

/** @typedef {{ name: string, colors: RoleColorProps }} SemanticRole */

/** @typedef {{ name: string, roleName: string }} NameRoleBinding */

/** @typedef {{ name: string, lineStyle: string }} NameLineStyleBinding */

/** @typedef {{
 *   roles: SemanticRole[],
 *   bindings: NameRoleBinding[],
 *   lineStyles?: NameLineStyleBinding[],
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

const SHORT_HEX = /^#[0-9a-fA-F]{3}$/;
const LONG_HEX = /^#[0-9a-fA-F]{6}$/;

/**
 * Parse and validate a style model config.
 *
 * @param {unknown} raw `null`/`undefined` → empty maps; otherwise must be an object with
 *   `roles` and `bindings` arrays per {@link StyleModelSpec}.
 * @returns {{
 *   roleColorsByName: Map<string, RoleColorProps>,
 *   nameToRole: Map<string, string>,
 *   lineStyleByName: Map<string, string>,
 * }} Resolved roles and leaf→role/lineStyle lookups for render.
 */
export function loadStyleModel(raw) {
  if (raw == null) {
    return {
      roleColorsByName: new Map(),
      nameToRole: new Map(),
      lineStyleByName: new Map(),
    };
  }
  if (typeof raw !== "object") {
    throw new Error("styleModel must be an object");
  }
  const model = /** @type {Record<string, unknown>} */ (raw);

  const roleColorsByName = loadSemanticRoles(model.roles);
  const nameToRole = loadNameRoleBindings(model.bindings, roleColorsByName);
  const lineStyleByName = loadNameLineStyleBindings(model.lineStyles, nameToRole);

  return { roleColorsByName, nameToRole, lineStyleByName };
}

/**
 * @param {unknown} rawRoles
 * @returns {Map<string, RoleColorProps>}
 */
function loadSemanticRoles(rawRoles) {
  if (!Array.isArray(rawRoles)) {
    throw new Error("styleModel.roles must be an array");
  }
  /** @type {Map<string, RoleColorProps>} */
  const roleColorsByName = new Map();
  for (const [idx, entry] of rawRoles.entries()) {
    if (entry == null || typeof entry !== "object") {
      throw new Error(`styleModel.roles[${idx}] must be an object`);
    }
    const s = /** @type {Record<string, unknown>} */ (entry);
    if (typeof s.name !== "string" || s.name.trim() === "") {
      throw new Error(`styleModel.roles[${idx}].name must be a non-empty string`);
    }
    if (roleColorsByName.has(s.name)) {
      throw new Error(`duplicate role name "${s.name}"`);
    }
    if (s.colors == null || typeof s.colors !== "object") {
      throw new Error(`styleModel.roles[${idx}].colors must be an object`);
    }
    const colors = normalizeRoleColorProps(
      /** @type {Record<string, unknown>} */ (s.colors),
      `styleModel.roles[${idx}].colors`,
    );
    roleColorsByName.set(s.name, colors);
  }
  return roleColorsByName;
}

/**
 * @param {unknown} rawBindings
 * @param {Map<string, RoleColorProps>} roleColorsByName
 * @returns {Map<string, string>}
 */
function loadNameRoleBindings(rawBindings, roleColorsByName) {
  if (!Array.isArray(rawBindings)) {
    throw new Error("styleModel.bindings must be an array");
  }
  /** @type {Map<string, string>} leaf name -> role name */
  const nameToRole = new Map();
  for (const [idx, entry] of rawBindings.entries()) {
    if (entry == null || typeof entry !== "object") {
      throw new Error(`styleModel.bindings[${idx}] must be an object`);
    }
    const b = /** @type {Record<string, unknown>} */ (entry);
    if (typeof b.name !== "string" || b.name.trim() === "") {
      throw new Error(`styleModel.bindings[${idx}].name must be a non-empty string`);
    }
    if (typeof b.roleName !== "string" || b.roleName.trim() === "") {
      throw new Error(`styleModel.bindings[${idx}].roleName must be a non-empty string`);
    }
    if (!roleColorsByName.has(b.roleName)) {
      throw new Error(
        `styleModel.bindings[${idx}] references unknown role "${b.roleName}"`,
      );
    }
    if (nameToRole.has(b.name)) {
      throw new Error(
        `duplicate binding for "${b.name}": already bound to "${nameToRole.get(b.name)}", cannot bind to "${b.roleName}"`,
      );
    }
    nameToRole.set(b.name, b.roleName);
  }
  return nameToRole;
}

/**
 * @param {unknown} rawLineStyles
 * @param {Map<string, string>} nameToRole
 * @returns {Map<string, string>}
 */
function loadNameLineStyleBindings(rawLineStyles, nameToRole) {
  if (rawLineStyles == null) {
    return new Map();
  }
  if (!Array.isArray(rawLineStyles)) {
    throw new Error("styleModel.lineStyles must be an array when provided");
  }
  /** @type {Map<string, string>} leaf name -> lineStyle token */
  const lineStyleByName = new Map();
  for (const [idx, entry] of rawLineStyles.entries()) {
    if (entry == null || typeof entry !== "object") {
      throw new Error(`styleModel.lineStyles[${idx}] must be an object`);
    }
    const b = /** @type {Record<string, unknown>} */ (entry);
    if (typeof b.name !== "string" || b.name.trim() === "") {
      throw new Error(`styleModel.lineStyles[${idx}].name must be a non-empty string`);
    }
    if (!nameToRole.has(b.name)) {
      throw new Error(
        `styleModel.lineStyles[${idx}] references unknown bound leaf "${b.name}"`,
      );
    }
    if (typeof b.lineStyle !== "string" || b.lineStyle.trim() === "") {
      throw new Error(
        `styleModel.lineStyles[${idx}].lineStyle must be a non-empty string`,
      );
    }
    assertKnownLineStyleToken(b.lineStyle, `styleModel.lineStyles[${idx}]`);
    if (lineStyleByName.has(b.name)) {
      throw new Error(
        `duplicate lineStyle binding for "${b.name}": already bound to "${lineStyleByName.get(b.name)}", cannot bind to "${b.lineStyle}"`,
      );
    }
    lineStyleByName.set(b.name, b.lineStyle);
  }
  return lineStyleByName;
}

/**
 * @param {Record<string, unknown>} raw
 * @param {string} context
 * @returns {RoleColorProps}
 */
function normalizeRoleColorProps(raw, context) {
  /** @type {RoleColorProps} */
  const out = {};
  if (raw.color !== undefined) {
    if (typeof raw.color !== "string") {
      throw new Error(`${context}.color must be a string`);
    }
    if (!isAllowedColor(raw.color)) {
      throw new Error(
        `${context}.color must be a CSS named color or 3/6-digit hex like "#333" or "#0FFF50"`,
      );
    }
    out.color = raw.color;
  }
  if (raw.strokeColor !== undefined) {
    if (typeof raw.strokeColor !== "string") {
      throw new Error(`${context}.strokeColor must be a string`);
    }
    if (!isAllowedColor(raw.strokeColor)) {
      throw new Error(
        `${context}.strokeColor must be a CSS named color or 3/6-digit hex like "#333" or "#0FFF50"`,
      );
    }
    out.strokeColor = raw.strokeColor;
  }
  if (raw.fillColor !== undefined) {
    if (typeof raw.fillColor !== "string") {
      throw new Error(`${context}.fillColor must be a string`);
    }
    if (!isAllowedColor(raw.fillColor)) {
      throw new Error(
        `${context}.fillColor must be a CSS named color or 3/6-digit hex like "#333" or "#0FFF50"`,
      );
    }
    out.fillColor = raw.fillColor;
  }
  return out;
}

/**
 * @param {string} value
 * @returns {boolean}
 */
function isAllowedColor(value) {
  if (SHORT_HEX.test(value) || LONG_HEX.test(value)) return true;
  return CSS_NAMED_COLORS.has(value.toLowerCase());
}
