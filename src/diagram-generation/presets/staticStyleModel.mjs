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
      name: "time-pointer-stroke",
      style: { color: "#555" },
    },
    {
      name: "now-triangle-fill",
      style: { color: "#555" },
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
      name: "grey-skeleton",
      style: { color: "darkgrey" },
    },
    {
      name: "dim-grey-fill",
      style: { color: "#222" },
    },
    {
      name: "time-now-label",
      style: { color: "lightgrey" },
    },
    {
      name: "time-now-label-seconds-colon",
      style: { color: "lightgrey" },
    },
    {
      name: "time-now-label-seconds",
      style: { color: "white" },
    },
  ],
  bindings: [
    { name: "AnnularBand", styleName: "dim-grey-fill" },
    { name: "RefArc", styleName: "grey-skeleton" },
    { name: "TickMark", styleName: "grey-skeleton" },
    { name: "HeightLabel", styleName: "dominant" },
    { name: "EventKind", styleName: "dominant" },
    { name: "NextPointer", styleName: "dominant" },
    { name: "WaitArc", styleName: "grey-strokes" },
    { name: "TimePointer", styleName: "time-pointer-stroke" },
    { name: "TimeLabel", styleName: "grey-writing" },
    { name: "TickLabel", styleName: "grey-writing" },
    { name: "CentreFrame", styleName: "grey-strokes" },
    { name: "TimeNowLabelHms", styleName: "time-now-label" },
    { name: "TimeNowLabelSecondsColon", styleName: "time-now-label-seconds-colon" },
    { name: "TimeNowLabelSeconds", styleName: "time-now-label-seconds" },
    { name: "DeltaGlue", styleName: "grey-writing" },
    { name: "DeltaInterval", styleName: "grey-writing" },
    { name: "NoMoreTidesToday", styleName: "grey-writing" },
    { name: "NowTriangle", styleName: "now-triangle-fill" },
    { name: "NowRadialLine", styleName: "grey-strokes-dashed" },
    { name: "NowLabel", styleName: "grey-writing" },
  ],
};
