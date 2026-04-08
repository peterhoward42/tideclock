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
      name: "emph",
      style: { color: "orchid" },
    },
    {
      name: "grey2",
      style: { color: "#222" },
    },
    {
      name: "grey5",
      style: { color: "#555" },
    },
    {
      name: "grey6",
      style: { color: "#666" },
    },
	{
      name: "grey8",
      style: { color: "#888" },
    },
	{
      name: "greyA",
      style: { color: "#AAA" },
    },
    {
      name: "grey8-dashed",
      style: { color: "#888", lineStyle: "dashed" },
    },
    {
      name: "centre-frame",
      style: { strokeColor: "#555", fillColor: "#222" },
    },
    {
      name: "white",
      style: { color: "white" },
    },
  ],
  bindings: [
    { name: "AnnularBand", styleName: "grey2" },
    { name: "RefArc", styleName: "grey8" },
    { name: "TickMark", styleName: "grey8" },
    { name: "HeightLabel", styleName: "emph" },
    { name: "TimeDeltaLine", styleName: "greyA" },
    { name: "NextPointer", styleName: "emph" },
    { name: "WaitArc", styleName: "grey8" },
    { name: "TimePointer", styleName: "emph" },
    { name: "TimeLabel", styleName: "grey6" },
    { name: "TickLabel", styleName: "grey6" },
    { name: "CentreFrame", styleName: "centre-frame" },
    { name: "TimeNowLabelHms", styleName: "grey5" },
    { name: "TimeNowLabelSecondsColon", styleName: "greyA" },
    { name: "TimeNowLabelSeconds", styleName: "greyA" },
    { name: "NoMoreTidesToday", styleName: "grey6" },
    { name: "NowTriangle", styleName: "greyA" },
    { name: "NowRadialLine", styleName: "grey8-dashed" },
    { name: "NowLabel", styleName: "grey8" },
  ],
};
