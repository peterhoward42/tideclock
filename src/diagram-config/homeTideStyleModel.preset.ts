/**
 * Baked-in style roles and scene-leaf bindings for the Home tide diagram (`loadStyleModel`).
 * Open this preset to adjust colors and bindings; validation lives in diagram-generation.
 */

import type { StyleModelSpec } from "./homeTideStyleModel.types";

export const homeTideStyleModel: StyleModelSpec = {
  roles: [
    {
      name: "role.tide.primary",
      colors: { color: "#bf94e4", fillColor: "#dab3f5" }, // bright lavender
    },
    { name: "role.tide.outline", colors: { color: "#bf94e4" } },
    {
      name: "role.tide.secondary",
      colors: { color: "#AAA" },
    },
    {
      name: "role.now.live",
      colors: { color: "#0FFF50" }, // bright neon green
    },
    {
      name: "role.hand.arm",
      colors: { color: "#0FFF50", strokeWidth: 4.0 }, // hand arm stroke
    },
    {
      name: "role.hand.bossCircle",
      colors: { color: "#0FFF50", strokeWidth: 4.0 }, // hand boss circle stroke
    },
    {
      name: "role.hand.bossLabel",
      colors: { color: "#0FFF50" },
    },
    {
      name: "role.structure.annular-band",
      colors: { strokeColor: "#888", fillColor: "#222" },
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
      name: "role.structure.dividor",
      colors: { color: "#777" },
    },
    {
      name: "role.structure.emphasis",
      colors: { color: "#AAA" },
    },
    {
      name: "role.structure.dialTick.endpoint",
      colors: { color: "white", strokeWidth: 2.35 },
    },
    {
      name: "role.structure.dialTick.quarter",
      colors: { color: "white", strokeWidth: 2.35 },
    },
    {
      name: "BrandURL",
      colors: { color: "#777" },
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
      colors: { strokeColor: "#555", fillColor: "#111" },
    },
    {
      name: "role.menu.trigger.icon",
      colors: { color: "#555", strokeWidth: 2.25 },
    },
  ],
  bindings: [
    { name: "AnnularBand", roleName: "role.structure.annular-band" },
    { name: "RefArc", roleName: "role.structure.ref" },
    { name: "Dividor", roleName: "role.structure.dividor" },
    { name: "TickMark", roleName: "role.structure.ref" },
    { name: "TickMark.Endpoint", roleName: "role.structure.dialTick.endpoint" },
    { name: "TickMark.Quarter", roleName: "role.structure.dialTick.quarter" },
    { name: "HeightLabel", roleName: "role.tide.primary" },
    { name: "TimeDeltaLocation", roleName: "role.text.primary" },
    { name: "TimeDeltaPhase", roleName: "role.tide.primary" },
    { name: "TimeDeltaNext", roleName: "role.tide.secondary" },
    { name: "TimeDeltaNextTime", roleName: "role.tide.secondary" },
    { name: "TimePointerFilled", roleName: "role.tide.primary" },
    { name: "TimePointerOutline", roleName: "role.tide.outline" },
    { name: "TickLabel", roleName: "role.structure.emphasis" },
    { name: "MainLabel", roleName: "role.tide.primary" },
    { name: "BossCircle", roleName: "role.hand.bossCircle" },
    { name: "BossLabel", roleName: "role.hand.bossLabel" },
    { name: "Arm", roleName: "role.hand.arm" },
    { name: "Hand.TimeReadout", roleName: "role.structure.emphasis" },
    { name: "Hand.TimeReadoutNowTag", roleName: "role.structure.text" },
    { name: "CentreFrame", roleName: "role.surface.centre-frame" },
    { name: "BRHCLocation", roleName: "role.structure.emphasis" },
    { name: "BRHCDate", roleName: "role.structure.text" },
    { name: "BrandURL", roleName: "BrandURL" },
    { name: "NoMoreTidesToday", roleName: "role.structure.text" },
    { name: "HomeMenuTrigger", roleName: "role.menu.trigger" },
    { name: "HomeMenuTriggerIcon", roleName: "role.menu.trigger.icon" },
    ],
  lineStyles: [],
};
