export type RoleColorProps = {
  readonly color?: string;
  readonly strokeColor?: string;
  readonly fillColor?: string;
  readonly strokeWidth?: number;
  readonly opacity?: number;
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
export type LineStyleToken = "solid" | "dashed";

export type NameLineStyleBinding = {
  readonly name: string;
  readonly lineStyle: LineStyleToken;
};

export type StyleModelSpec = {
  readonly roles: readonly SemanticRole[];
  readonly bindings: readonly NameRoleBinding[];
  readonly lineStyles?: readonly NameLineStyleBinding[];
};
