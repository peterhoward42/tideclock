/**
 * Compile-time style model for tide diagram product definition.
 * Runtime input does not carry style bindings.
 */

/** @type {import('./styleBindings.mjs').StyleModelSpec} */
export const STATIC_STYLE_MODEL = {
  styles: [
    {
      name: "baseCurve",
      style: { color: "#335" },
    },
    {
      name: "accent",
      style: { color: "tomato" },
    },
  ],
  bindings: [
    { name: "refArc", styleName: "baseCurve" },
    { name: "waitArc", styleName: "accent" },
  ],
};
