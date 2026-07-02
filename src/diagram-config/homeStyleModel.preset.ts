/**
 * Baked-in style roles and scene-leaf bindings for the Home tide diagram (`loadStyleModel`).
 * Open this preset to adjust colors and bindings; validation lives in diagram-generation.
 */

import type { NameRoleBinding, SemanticRole, StyleModelSpec } from "./styleModel.types";

/** Max dial-interior location lines (200-char cap ÷ 21-char segments). */
const LOCATION_LABEL_LINE_BINDING_COUNT = 10;

/**
 * Curiosity tunnel: per-letter colours for **Menu** (home dial) and **Entertainment** (home flyout).
 * Index cycles with `letterIndex % length`. Roles/bindings below wire the dial side into SVG render.
 *
 * Named colours (CSS extended set) so hues are easy to read and swap when tuning.
 */
export const homeCuriosityTunnelPalette = [
  "bisque",
  "dodgerblue",
  "red",
  "yellow",
] as const;

export function curiosityTunnelColorAt(index: number): string {
  const palette = homeCuriosityTunnelPalette;
  const i = ((index % palette.length) + palette.length) % palette.length;
  return palette[i]!;
}

function homeCuriosityTunnelRoles(): readonly SemanticRole[] {
  return homeCuriosityTunnelPalette.map((color, i) => ({
    name: `role.curiosity.tunnel.${i}`,
    colors: { color },
  }));
}

function homeCuriosityTunnelMenuGlyphBindings(): readonly NameRoleBinding[] {
  return Array.from({ length: homeCuriosityTunnelPalette.length }, (_, i) => ({
    name: `HomeMenuTrigger.G${i}`,
    roleName: `role.curiosity.tunnel.${i}`,
  }));
}

export const homeStyleModel: StyleModelSpec = {
  roles: [
    ...homeCuriosityTunnelRoles(),
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
      name: "role.location.label",
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
      name: "role.location.share",
      colors: { color: "#888", strokeWidth: 1.75 },
    },
    {
      name: "role.location.change",
      colors: { color: "#AAA", strokeWidth: 1.75 },
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
      name: "BrandQR",
      colors: { fillColor: "#666" },
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
      name: "role.instrument.fullscreen.icon",
      colors: { color: "#777", strokeWidth: 1.5 },
    },
    {
      name: "role.instrument.keepAwake.label",
      colors: { color: "#555" },
    },
    {
      name: "role.instrument.keepAwake.checkbox",
      colors: { color: "#555", strokeWidth: 1.00 },
    },
    {
      name: "role.instrument.keepAwake.checkmark",
      colors: { color: "#aaa", strokeWidth: 1.00 },
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
    { name: "LocationLabel.TidesFor", roleName: "role.tide.primary" },
    { name: "TimeDeltaLocation", roleName: "role.text.primary" },
    { name: "TimeDeltaPhase", roleName: "role.tide.primary" },
    { name: "TimeDeltaNext", roleName: "role.tide.secondary" },
    { name: "TimeDeltaNextTime", roleName: "role.tide.secondary" },
    { name: "TimePointerFilled", roleName: "role.tide.primary" },
    { name: "TimePointerOutline", roleName: "role.tide.outline" },
    { name: "TickLabel", roleName: "role.structure.emphasis" },
    { name: "MainLabel", roleName: "role.tide.primary" },
    { name: "BossCircle", roleName: "role.hand.bossCircle" },
    { name: "Arm", roleName: "role.hand.arm" },
    { name: "Hand.TimeReadout", roleName: "role.structure.emphasis" },
    { name: "Hand.TimeReadoutNowTag", roleName: "role.structure.text" },
    { name: "CentreFrame", roleName: "role.surface.centre-frame" },
    ...Array.from({ length: LOCATION_LABEL_LINE_BINDING_COUNT }, (_, i) => ({
      name: `LocationLabel.Line${i}`,
      roleName: "role.location.label",
    })),
    { name: "BRHCDate", roleName: "role.structure.text" },
    { name: "BrandQRPlate", roleName: "role.menu.trigger" },
    { name: "BrandQR", roleName: "BrandQR" },
    { name: "NoMoreTidesToday", roleName: "role.structure.text" },
    ...homeCuriosityTunnelMenuGlyphBindings(),
    { name: "FullScreenIcon.HitFrame", roleName: "role.menu.trigger" },
    { name: "FullScreenIcon.Off", roleName: "role.instrument.fullscreen.icon" },
    { name: "FullScreenIcon.On", roleName: "role.instrument.fullscreen.icon" },
    { name: "KeepAwakeIcon.Label", roleName: "role.instrument.keepAwake.label" },
    { name: "KeepAwakeIcon.Off.Checkbox", roleName: "role.instrument.keepAwake.checkbox" },
    { name: "KeepAwakeIcon.On.Checkbox", roleName: "role.instrument.keepAwake.checkbox" },
    { name: "KeepAwakeIcon.On.Checkmark", roleName: "role.instrument.keepAwake.checkmark" },
    { name: "HomeLocationPanelPlate", roleName: "role.menu.trigger" },
    { name: "HomeLocationPanelLabel", roleName: "role.structure.text" },
    { name: "HomeShareTrigger", roleName: "role.location.share" },
    { name: "HomeLocationPanelSeparator", roleName: "role.structure.text" },
    { name: "HomeLocationTrigger", roleName: "role.location.change" },
  ],
  lineStyles: [],
};
