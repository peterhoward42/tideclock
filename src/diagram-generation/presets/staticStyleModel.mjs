/**
 * staticStyleModel.mjs — Default `StyleModelSpec` baked in at build time for `loadStyleModel`.
 * Kind: Definition (product preset). Runtime spec does not override these bindings.
 *
 * Product style model passed to `loadStyleModel` at diagram init (see app collaborator).
 * Not merged from runtime spec: diagram `buildDiagram` input carries geometry only.
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
    {
      name: "grey-strokes-dashed",
      style: { color: "darkgrey", lineStyle: "dashed" },
    },
    {
      name: "time-now-label",
      style: { color: "antiquewhite" },
    },
    {
      name: "time-now-label-seconds",
      style: { color: "limegreen" },
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
    { name: "TimeNowLabelHms", styleName: "time-now-label" },
    { name: "TimeNowLabelSeconds", styleName: "time-now-label-seconds" },
    { name: "DeltaGlue", styleName: "grey-writing" },
    { name: "DeltaInterval", styleName: "grey-writing" },
    { name: "NoMoreTidesToday", styleName: "grey-writing" },
    { name: "NowTriangle", styleName: "grey-strokes" },
    { name: "NowRadialLine", styleName: "grey-strokes-dashed" },
    { name: "NowLabel", styleName: "grey-writing" },
  ],
};
