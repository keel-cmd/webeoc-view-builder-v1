// ─── Component Property Definitions ─────────────────────────────────────────

export type PropertyType =
  | "text"
  | "textarea"
  | "number"
  | "boolean"
  | "select"
  | "color"
  | "options"; // for dropdown/radio/checkbox options list

export interface PropertyDefinition {
  key: string;
  label: string;
  type: PropertyType;
  defaultValue?: unknown;
  options?: string[]; // for 'select' type
  placeholder?: string;
}

// ─── Schema Nodes ─────────────────────────────────────────────────────────────

export interface SchemaNode {
  id: string;
  type: string; // matches ComponentDefinition.type
  props: Record<string, unknown>;
  children?: SchemaNode[];
}

// ─── Component Registry ───────────────────────────────────────────────────────

export interface ComponentDefinition {
  type: string;
  label: string;
  category: "layout" | "form" | "display";
  icon: string; // emoji or Heroicon name
  defaultProps: Record<string, unknown>;
  propertyDefinitions: PropertyDefinition[];
  acceptsChildren?: boolean;
}

// ─── Project / Persistence ────────────────────────────────────────────────────

export interface ProjectSchema {
  id?: string;
  name: string;
  description?: string;
  viewType?: string;
  rootNodes: SchemaNode[];
  createdAt?: string;
  updatedAt?: string;
}

// ─── Builder State ────────────────────────────────────────────────────────────

export interface BuilderState {
  schema: ProjectSchema;
  selectedNodeId: string | null;
  isDirty: boolean;
}
