/**
 * Compile-time style model for tide diagram product definition.
 * Runtime input does not carry style bindings.
 */

/** @type {import('./styleBindings.mjs').StyleModelSpec} */
export const STATIC_STYLE_MODEL = {
  styles: [
    {
      name: "dominant",
      style: { color: "yellow" },
    },
    {
      name: "time-pointer-filled",
      style: { color: "darkgrey" },
    },
    {
      name: "grey-writing",
      style: { color: "darkgrey" },
    },
    {
      name: "grey-strokes",
      style: { color: "darkgrey" },
    },
  ],
  bindings: [
    { name: "RefArc", styleName: "dominant" },
    { name: "TickMark", styleName: "dominant" },
    { name: "HeightLabel", styleName: "dominant" },
    { name: "EventKind", styleName: "dominant" },
    { name: "NextPointer", styleName: "dominant" },
    { name: "WaitArc", styleName: "grey-strokes" },
    { name: "TimePointer", styleName: "time-pointer-filled" },
    { name: "TimeLabel", styleName: "grey-writing" },
    { name: "TickLabel", styleName: "grey-writing" },
    { name: "CentreClusterFrame", styleName: "grey-strokes" },
    { name: "NowTime", styleName: "grey-writing" },
    { name: "DeltaGlue", styleName: "grey-writing" },
    { name: "DeltaInterval", styleName: "grey-writing" },
    { name: "NoMoreTidesToday", styleName: "grey-writing" },
    { name: "NowTriangle", styleName: "grey-strokes" },
    { name: "NowRadialLine", styleName: "grey-strokes" },
    { name: "NowLabel", styleName: "grey-writing" },
  ],
};
