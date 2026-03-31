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
    {
      name: "dominant",
      style: { color: "yellow" },
    },
  ],
  bindings: [
    { name: "RefArc", styleName: "dominant" },
    { name: "TickMark", styleName: "dominant" },
    { name: "HeightLabel", styleName: "dominant" },
    { name: "EventKind", styleName: "dominant" },
    { name: "NextPointer", styleName: "dominant" },
    { name: "WaitArc", styleName: "dominant" },
  ],
};
