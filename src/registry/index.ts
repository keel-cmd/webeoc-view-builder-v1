import type { ComponentDefinition } from "@/types";

// ─── Registry Map ─────────────────────────────────────────────────────────────

const registry = new Map<string, ComponentDefinition>();

export function registerComponent(def: ComponentDefinition): void {
  registry.set(def.type, def);
}

export function getComponent(type: string): ComponentDefinition | undefined {
  return registry.get(type);
}

export function getAllComponents(): ComponentDefinition[] {
  return Array.from(registry.values());
}

export function getComponentsByCategory(
  category: ComponentDefinition["category"]
): ComponentDefinition[] {
  return getAllComponents().filter((c) => c.category === category);
}

// ─── Layout Components ────────────────────────────────────────────────────────

registerComponent({
  type: "section",
  label: "Section",
  category: "layout",
  icon: "⬜",
  defaultProps: { title: "Section", padding: "16px" },
  propertyDefinitions: [
    { key: "title", label: "Title", type: "text", defaultValue: "Section" },
    { key: "padding", label: "Padding", type: "text", defaultValue: "16px" },
    { key: "backgroundColor", label: "Background Color", type: "color", defaultValue: "#ffffff" },
  ],
  acceptsChildren: true,
});

registerComponent({
  type: "row",
  label: "Row",
  category: "layout",
  icon: "↔️",
  defaultProps: { gap: "8px" },
  propertyDefinitions: [
    { key: "gap", label: "Gap", type: "text", defaultValue: "8px" },
    { key: "alignItems", label: "Align Items", type: "select", defaultValue: "stretch", options: ["flex-start", "center", "flex-end", "stretch"] },
  ],
  acceptsChildren: true,
});

registerComponent({
  type: "column",
  label: "Column",
  category: "layout",
  icon: "↕️",
  defaultProps: { flex: "1", gap: "8px" },
  propertyDefinitions: [
    { key: "flex", label: "Flex", type: "text", defaultValue: "1" },
    { key: "gap", label: "Gap", type: "text", defaultValue: "8px" },
    { key: "padding", label: "Padding", type: "text", defaultValue: "0px" },
  ],
  acceptsChildren: true,
});

registerComponent({
  type: "tabs",
  label: "Tabs",
  category: "layout",
  icon: "📑",
  defaultProps: { tabs: ["Tab 1", "Tab 2"] },
  propertyDefinitions: [
    { key: "tabs", label: "Tab Labels (comma-separated)", type: "text", defaultValue: "Tab 1,Tab 2" },
  ],
  acceptsChildren: true,
});

registerComponent({
  type: "panel",
  label: "Panel",
  category: "layout",
  icon: "🗃️",
  defaultProps: { title: "Panel", collapsible: false },
  propertyDefinitions: [
    { key: "title", label: "Title", type: "text", defaultValue: "Panel" },
    { key: "collapsible", label: "Collapsible", type: "boolean", defaultValue: false },
    { key: "borderColor", label: "Border Color", type: "color", defaultValue: "#e5e7eb" },
  ],
  acceptsChildren: true,
});

// ─── Form Components ──────────────────────────────────────────────────────────

registerComponent({
  type: "text-input",
  label: "Text Input",
  category: "form",
  icon: "🔤",
  defaultProps: { label: "Text Input", placeholder: "", required: false, helperText: "" },
  propertyDefinitions: [
    { key: "label", label: "Label", type: "text", defaultValue: "Text Input" },
    { key: "placeholder", label: "Placeholder", type: "text", defaultValue: "" },
    { key: "required", label: "Required", type: "boolean", defaultValue: false },
    { key: "helperText", label: "Helper Text", type: "text", defaultValue: "" },
    { key: "maxLength", label: "Max Length", type: "number", defaultValue: undefined },
  ],
});

registerComponent({
  type: "textarea",
  label: "Text Area",
  category: "form",
  icon: "📝",
  defaultProps: { label: "Text Area", placeholder: "", required: false, rows: 4 },
  propertyDefinitions: [
    { key: "label", label: "Label", type: "text", defaultValue: "Text Area" },
    { key: "placeholder", label: "Placeholder", type: "text", defaultValue: "" },
    { key: "required", label: "Required", type: "boolean", defaultValue: false },
    { key: "rows", label: "Rows", type: "number", defaultValue: 4 },
    { key: "helperText", label: "Helper Text", type: "text", defaultValue: "" },
  ],
});

registerComponent({
  type: "number-input",
  label: "Number",
  category: "form",
  icon: "🔢",
  defaultProps: { label: "Number", placeholder: "", required: false, min: undefined, max: undefined },
  propertyDefinitions: [
    { key: "label", label: "Label", type: "text", defaultValue: "Number" },
    { key: "placeholder", label: "Placeholder", type: "text", defaultValue: "" },
    { key: "required", label: "Required", type: "boolean", defaultValue: false },
    { key: "min", label: "Min Value", type: "number", defaultValue: undefined },
    { key: "max", label: "Max Value", type: "number", defaultValue: undefined },
  ],
});

registerComponent({
  type: "dropdown",
  label: "Dropdown",
  category: "form",
  icon: "📋",
  defaultProps: { label: "Dropdown", required: false, options: ["Option 1", "Option 2"], helperText: "" },
  propertyDefinitions: [
    { key: "label", label: "Label", type: "text", defaultValue: "Dropdown" },
    { key: "required", label: "Required", type: "boolean", defaultValue: false },
    { key: "options", label: "Options (comma-separated)", type: "text", defaultValue: "Option 1,Option 2" },
    { key: "helperText", label: "Helper Text", type: "text", defaultValue: "" },
  ],
});

registerComponent({
  type: "checkbox",
  label: "Checkbox",
  category: "form",
  icon: "☑️",
  defaultProps: { label: "Checkbox", required: false, helperText: "" },
  propertyDefinitions: [
    { key: "label", label: "Label", type: "text", defaultValue: "Checkbox" },
    { key: "required", label: "Required", type: "boolean", defaultValue: false },
    { key: "helperText", label: "Helper Text", type: "text", defaultValue: "" },
  ],
});

registerComponent({
  type: "radio",
  label: "Radio",
  category: "form",
  icon: "🔘",
  defaultProps: { label: "Radio Group", required: false, options: ["Option 1", "Option 2"] },
  propertyDefinitions: [
    { key: "label", label: "Label", type: "text", defaultValue: "Radio Group" },
    { key: "required", label: "Required", type: "boolean", defaultValue: false },
    { key: "options", label: "Options (comma-separated)", type: "text", defaultValue: "Option 1,Option 2" },
  ],
});

registerComponent({
  type: "date-input",
  label: "Date",
  category: "form",
  icon: "📅",
  defaultProps: { label: "Date", required: false },
  propertyDefinitions: [
    { key: "label", label: "Label", type: "text", defaultValue: "Date" },
    { key: "required", label: "Required", type: "boolean", defaultValue: false },
    { key: "helperText", label: "Helper Text", type: "text", defaultValue: "" },
  ],
});

registerComponent({
  type: "email-input",
  label: "Email",
  category: "form",
  icon: "📧",
  defaultProps: { label: "Email", placeholder: "", required: false },
  propertyDefinitions: [
    { key: "label", label: "Label", type: "text", defaultValue: "Email" },
    { key: "placeholder", label: "Placeholder", type: "text", defaultValue: "" },
    { key: "required", label: "Required", type: "boolean", defaultValue: false },
  ],
});

registerComponent({
  type: "phone-input",
  label: "Phone",
  category: "form",
  icon: "📱",
  defaultProps: { label: "Phone", placeholder: "", required: false },
  propertyDefinitions: [
    { key: "label", label: "Label", type: "text", defaultValue: "Phone" },
    { key: "placeholder", label: "Placeholder", type: "text", defaultValue: "" },
    { key: "required", label: "Required", type: "boolean", defaultValue: false },
  ],
});

registerComponent({
  type: "file-upload",
  label: "File Upload",
  category: "form",
  icon: "📎",
  defaultProps: { label: "File Upload", required: false, accept: "*", multiple: false },
  propertyDefinitions: [
    { key: "label", label: "Label", type: "text", defaultValue: "File Upload" },
    { key: "required", label: "Required", type: "boolean", defaultValue: false },
    { key: "accept", label: "Accept", type: "text", defaultValue: "*" },
    { key: "multiple", label: "Multiple Files", type: "boolean", defaultValue: false },
  ],
});

// ─── Display Components ───────────────────────────────────────────────────────

registerComponent({
  type: "label",
  label: "Label",
  category: "display",
  icon: "🏷️",
  defaultProps: { text: "Label text", fontSize: "14px", fontWeight: "normal", color: "#000000" },
  propertyDefinitions: [
    { key: "text", label: "Text", type: "text", defaultValue: "Label text" },
    { key: "fontSize", label: "Font Size", type: "text", defaultValue: "14px" },
    { key: "fontWeight", label: "Font Weight", type: "select", defaultValue: "normal", options: ["normal", "medium", "semibold", "bold"] },
    { key: "color", label: "Color", type: "color", defaultValue: "#000000" },
  ],
});

registerComponent({
  type: "button",
  label: "Button",
  category: "display",
  icon: "🔲",
  defaultProps: { text: "Button", variant: "primary", size: "md" },
  propertyDefinitions: [
    { key: "text", label: "Button Text", type: "text", defaultValue: "Button" },
    { key: "variant", label: "Variant", type: "select", defaultValue: "primary", options: ["primary", "secondary", "danger", "ghost"] },
    { key: "size", label: "Size", type: "select", defaultValue: "md", options: ["sm", "md", "lg"] },
  ],
});

registerComponent({
  type: "image",
  label: "Image",
  category: "display",
  icon: "🖼️",
  defaultProps: { src: "", alt: "Image", width: "100%", height: "auto" },
  propertyDefinitions: [
    { key: "src", label: "Image URL", type: "text", defaultValue: "" },
    { key: "alt", label: "Alt Text", type: "text", defaultValue: "Image" },
    { key: "width", label: "Width", type: "text", defaultValue: "100%" },
    { key: "height", label: "Height", type: "text", defaultValue: "auto" },
  ],
});
