/**
 * Baked-in style roles and scene-leaf bindings for the Home tide diagram (`loadStyleModel`).
 * Open this file to adjust colours and bindings; validation lives in diagram-generation.
 */

export type RoleColorProps = {
  readonly color?: string;
  readonly strokeColor?: string;
  readonly fillColor?: string;
};

export type SemanticRole = {
  readonly name: string;
  readonly colors: RoleColorProps;
};

export type NameRoleBinding = {
  readonly name: string;
  readonly roleName: string;
};

/** Domain tokens asserted in diagram-generation (`lineStyleRendering.mjs`). */
export type LineStyleToken = 'solid' | 'dashed';

export type NameLineStyleBinding = {
  readonly name: string;
  readonly lineStyle: LineStyleToken;
};

export type StyleModelSpec = {
  readonly roles: readonly SemanticRole[];
  readonly bindings: readonly NameRoleBinding[];
  readonly lineStyles?: readonly NameLineStyleBinding[];
};

export const homeTideStyleModel: StyleModelSpec = {
  roles: [
    {
      name: 'role.tide.primary',
      colors: { color: '#bf94e4' }, // bright lavender
    },
    {
      name: 'role.now.live',
      colors: { color: '#0FFF50' }, // bright neon green
    },
    {
      name: 'role.structure.band',
      colors: { color: '#222' },
    },
    {
      name: 'role.structure.mid',
      colors: { color: '#444' },
    },
    {
      name: 'role.structure.text',
      colors: { color: '#666' },
    },
    {
      name: 'role.structure.ref',
      colors: { color: '#888' },
    },
    {
      name: 'role.structure.emphasis',
      colors: { color: '#AAA' },
    },
    {
      name: 'role.surface.centre-frame',
      colors: { strokeColor: '#555', fillColor: '#222' },
    },
    {
      name: 'role.text.primary',
      colors: { color: 'white' },
    },
  ],
  bindings: [
    { name: 'AnnularBand', roleName: 'role.structure.band' },
    { name: 'InsideTrack', roleName: 'role.structure.mid' },
    { name: 'RefArc', roleName: 'role.structure.ref' },
    { name: 'TickMark', roleName: 'role.structure.ref' },
    { name: 'HeightLabel', roleName: 'role.tide.primary' },
    { name: 'TimeDeltaLocation', roleName: 'role.text.primary' },
    { name: 'TimeDeltaPhase', roleName: 'role.tide.primary' },
    { name: 'TimeDeltaNext', roleName: 'role.tide.primary' },
    { name: 'NextPointer', roleName: 'role.tide.primary' },
    { name: 'WaitArc', roleName: 'role.now.live' },
    { name: 'TimePointer', roleName: 'role.tide.primary' },
    { name: 'TimeLabel', roleName: 'role.structure.emphasis' },
    { name: 'TickLabel', roleName: 'role.structure.emphasis' },
    { name: 'CentreFrame', roleName: 'role.surface.centre-frame' },
    { name: 'TimeNowDate', roleName: 'role.structure.emphasis' },
    { name: 'TimeNowLabelHms', roleName: 'role.structure.emphasis' },
    { name: 'TimeNowLabelSecondsColon', roleName: 'role.now.live' },
    { name: 'TimeNowLabelSeconds', roleName: 'role.now.live' },
    { name: 'NoMoreTidesToday', roleName: 'role.structure.text' },
    { name: 'NowTriangle', roleName: 'role.now.live' },
    { name: 'NowRadialLine', roleName: 'role.now.live' },
    { name: 'NowLabel', roleName: 'role.now.live' },
  ],
  lineStyles: [{ name: 'NowRadialLine', lineStyle: 'dashed' }],
};
