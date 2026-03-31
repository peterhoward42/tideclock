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
    {
      name: "tbd",
      style: { color: "red" },
    },
  ],
  bindings: [
    { name: "RefArc", styleName: "dominant" },
    { name: "TickMark", styleName: "dominant" },
    { name: "HeightLabel", styleName: "dominant" },
    { name: "EventKind", styleName: "dominant" },
    { name: "NextPointer", styleName: "dominant" },
    { name: "WaitArc", styleName: "dominant" },
    { name: "TimePointer", styleName: "tbd" },
    { name: "TimeLabel", styleName: "tbd" },
    { name: "TickLabel", styleName: "tbd" },
    { name: "CentreClusterFrame", styleName: "tbd" },
    { name: "NowTime", styleName: "tbd" },
    { name: "DeltaGlue", styleName: "tbd" },
    { name: "DeltaInterval", styleName: "tbd" },
    { name: "NowTriangle", styleName: "tbd" },
    { name: "NowRadialLine", styleName: "tbd" },
    { name: "NowLabel", styleName: "tbd" },
  ],
};
