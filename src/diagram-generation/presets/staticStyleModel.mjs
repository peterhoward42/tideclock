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
      name: "emphtide",
      style: { color: "orchid" },
    },
    {
      name: "emphnow",
      style: { color: "lawngreen" },
    },
    {
      name: "emphnow-dashed",
      style: { color: "lawngreen", lineStyle: "dashed" },
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
    { name: "HeightLabel", styleName: "emphtide" },
    { name: "TimeDeltaLine", styleName: "greyA" },
    { name: "NextPointer", styleName: "emphtide" },
    { name: "WaitArc", styleName: "emphnow" },
    { name: "TimePointer", styleName: "emphtide" },
    { name: "TimeLabel", styleName: "grey6" },
    { name: "TickLabel", styleName: "grey6" },
    { name: "CentreFrame", styleName: "centre-frame" },
    { name: "TimeNowLabelHms", styleName: "grey5" },
    { name: "TimeNowLabelSecondsColon", styleName: "emphnow" },
    { name: "TimeNowLabelSeconds", styleName: "emphnow" },
    { name: "NoMoreTidesToday", styleName: "grey6" },
    { name: "NowTriangle", styleName: "emphnow" },
    { name: "NowRadialLine", styleName: "emphnow-dashed" },
    { name: "NowLabel", styleName: "emphnow" },
  ],
};
