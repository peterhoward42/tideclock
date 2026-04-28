/**
 * Baked-in style roles and scene-leaf bindings for the Home tide diagram (`loadStyleModel`).
 * Open this preset to adjust colors and bindings; validation lives in diagram-generation.
 */

import type { StyleModelSpec } from "./homeTideStyleModel.types";

export const homeTideStyleModel: StyleModelSpec = {
  roles: [
    {
      name: "role.tide.primary",
      colors: { color: "#bf94e4" }, // bright lavender
    },
    {
      name: "role.tide.secondary",
      colors: { color: "#AAA" },
    },
    {
      name: "role.now.live",
      colors: { color: "#0FFF50" }, // bright neon green
    },
    {
      name: "role.now.projection",
      colors: { color: "#555" }, 
    },
    {
      name: "role.structure.band",
      colors: { color: "#222" },
    },
    {
      name: "role.structure.mid",
      colors: { color: "#444" },
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
      colors: { strokeColor: "#555", fillColor: "#151515" },
    },
    {
      name: "role.text.primary",
      colors: { color: "white" },
    },
    {
      name: "role.menu.trigger",
      colors: { strokeColor: "#888", fillColor: "#111" },
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
    { name: "TimeDeltaNext", roleName: "role.tide.secondary" },
    { name: "TimeDeltaNextTime", roleName: "role.tide.secondary" },
    { name: "TimePointer", roleName: "role.tide.primary" },
    { name: "TimeLabel", roleName: "role.structure.emphasis" },
    { name: "TickLabel", roleName: "role.structure.emphasis" },
    { name: "MainLabel", roleName: "role.structure.emphasis" },
    { name: "BossCircle", roleName: "role.now.live" },
    { name: "SmallCircle", roleName: "role.now.live" },
    { name: "Extension", roleName: "role.now.live" },
    { name: "Projection", roleName: "role.now.projection" },
    { name: "Arm", roleName: "role.now.live" },
    { name: "PointerPipSideA", roleName: "role.now.live" },
    { name: "PointerPipSideB", roleName: "role.now.live" },
    { name: "PointerPipHeadArc", roleName: "role.now.live" },
    { name: "CentreFrame", roleName: "role.surface.centre-frame" },
    { name: "TimeNowDate", roleName: "role.structure.emphasis" },
    { name: "TimeNowLabelHms", roleName: "role.structure.emphasis" },
    { name: "TimeNowLabelSecondsColon", roleName: "role.now.live" },
    { name: "TimeNowLabelSeconds", roleName: "role.now.live" },
    { name: "NoMoreTidesToday", roleName: "role.structure.text" },
    { name: "HomeMenuTrigger", roleName: "role.menu.trigger" },
    { name: "HomeMenuTriggerLabel", roleName: "role.structure.emphasis" },
  ],
  lineStyles: [],
};
