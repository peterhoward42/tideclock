/**
 * staticStyleModel.mjs — Default `StyleModelSpec` baked in at build time for `loadStyleModel`.
 * Kind: Definition (product preset). Runtime spec does not override these bindings.
 *
 * Product style model passed to `loadStyleModel` at diagram init (see app collaborator).
 * Not merged from runtime spec: diagram `buildDiagram` input carries geometry only.
 */

/** @type {import('./styleBindings.mjs').StyleModelSpec} */
export const STATIC_STYLE_MODEL = {
  roles: [
    {
      name: "role.tide.primary",
      colors: { color: "orchid" },
    },
    {
      name: "role.now.live",
      colors: { color: "lawngreen" },
    },
    {
      name: "role.structure.band",
      colors: { color: "#222" },
    },
    {
      name: "role.structure.mid",
      colors: { color: "#555" },
    },
    {
      name: "role.structure.text",
      colors: { color: "#666" },
    },
    {
      name: "role.structure.ref",
      colors: { color: "#888" },
    },
    {
      name: "role.structure.emphasis",
      colors: { color: "#AAA" },
    },
    {
      name: "role.surface.centre-frame",
      colors: { strokeColor: "#555", fillColor: "#222" },
    },
    {
      name: "role.text.primary",
      colors: { color: "white" },
    },
  ],
  bindings: [
    { name: "AnnularBand", roleName: "role.structure.band" },
    { name: "InsideTrack", roleName: "role.structure.mid" },
    { name: "RefArc", roleName: "role.structure.ref" },
    { name: "TickMark", roleName: "role.structure.ref" },
    { name: "HeightLabel", roleName: "role.tide.primary" },
    { name: "TimeDeltaLocation", roleName: "role.text.primary" },
    { name: "TimeDeltaPhase", roleName: "role.tide.primary" },
    { name: "TimeDeltaNext", roleName: "role.tide.primary" },
    { name: "NextPointer", roleName: "role.tide.primary" },
    { name: "WaitArc", roleName: "role.now.live" },
    { name: "TimePointer", roleName: "role.tide.primary" },
    { name: "TimeLabel", roleName: "role.structure.text" },
    { name: "TickLabel", roleName: "role.structure.text" },
    { name: "CentreFrame", roleName: "role.surface.centre-frame" },
    { name: "TimeNowDate", roleName: "role.structure.mid" },
    { name: "TimeNowLabelHms", roleName: "role.structure.mid" },
    { name: "TimeNowLabelSecondsColon", roleName: "role.now.live" },
    { name: "TimeNowLabelSeconds", roleName: "role.now.live" },
    { name: "NoMoreTidesToday", roleName: "role.structure.text" },
    { name: "NowTriangle", roleName: "role.now.live" },
    { name: "NowRadialLine", roleName: "role.now.live" },
    { name: "NowLabel", roleName: "role.now.live" },
  ],
  lineStyles: [{ name: "NowRadialLine", lineStyle: "dashed" }],
};
