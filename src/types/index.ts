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

// ─── Resource entries (links / scripts appended after base template) ──────────

export interface LinkResource {
  id: string;
  sourceType: "boardresource" | "href";
  source: string;    // boardresource filename or full URL
  rel?: string;      // defaults to "stylesheet"
  type?: string;     // e.g. "text/css"
  media?: string;
}

export interface ScriptResource {
  id: string;
  sourceType: "boardresource" | "src";
  source: string;    // boardresource filename or full URL
  type?: string;     // e.g. "text/javascript"
  integrity?: string;
  crossorigin?: string;
  referrerpolicy?: string;
  async?: boolean;
  defer?: boolean;
  dstGlobal?: boolean;  // data-dst-global="true"
}

export interface ViewTypeDefaults {
  links: LinkResource[];
  scripts: ScriptResource[];
}

// ─── Project / Persistence ────────────────────────────────────────────────────

export interface ProjectSchema {
  id?: string;
  name: string;
  description?: string;
  viewType?: string;
  links?: LinkResource[];
  scripts?: ScriptResource[];
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
