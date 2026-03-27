import type { ProjectSchema, SchemaNode, LinkResource, ScriptResource } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function esc(s: unknown): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

type AttrPair = { key: string; value: string };

function extraAttrsHtml(p: Record<string, unknown>): string {
  const out: string[] = [];
  ((p.customAttributes as AttrPair[]) ?? []).forEach(({ key, value }) => {
    if (key) out.push(`${esc(key)}="${esc(value)}"`);
  });
  ((p.dataAttributes as AttrPair[]) ?? []).forEach(({ key, value }) => {
    if (key) out.push(`data-${esc(key)}="${esc(value)}"`);
  });
  return out.length ? " " + out.join(" ") : "";
}

function wrapperOpen(node: SchemaNode): string {
  const p = node.props as Record<string, unknown>;
  const col = (p.col as string) ?? "col-md-12";
  const classes = `form-group bmd-form-group ${col}${p.customClasses ? " " + (p.customClasses as string) : ""}`;
  const style = p.inlineStyle ? ` style="${esc(p.inlineStyle as string)}"` : "";
  return `<div class="${classes}"${style}${extraAttrsHtml(p)}>`;
}

function req(required: boolean): string {
  return required ? ' <span class="text-danger ml-1">*</span>' : "";
}

// ─── Node → HTML ──────────────────────────────────────────────────────────────

function nodeToHtml(node: SchemaNode, depth = 0): string {
  const pad = "  ".repeat(depth);
  const p = node.props as Record<string, unknown>;
  const children = () =>
    (node.children ?? []).map((c) => nodeToHtml(c, depth + 1)).join("\n");

  switch (node.type) {
    // ── Layout ──────────────────────────────────────────────────────────────

    case "section": {
      const title = (p.title as string) ?? "Section";
      return [
        `${pad}<div class="card form-section mb-3">`,
        `${pad}  <div class="card-header d-flex justify-content-between align-items-center">`,
        `${pad}    <h6 class="mb-0 section-title">${esc(title)}</h6>`,
        p.collapsible !== false
          ? `${pad}    <button type="button" class="btn btn-link btn-sm p-0"><i class="fa fa-chevron-up"></i></button>`
          : "",
        `${pad}  </div>`,
        `${pad}  <div class="card-body">`,
        `${pad}    <div class="form-row">`,
        children(),
        `${pad}    </div>`,
        `${pad}  </div>`,
        `${pad}</div>`,
      ]
        .filter((l) => l !== "")
        .join("\n");
    }

    case "row": {
      return [`${pad}<div class="form-row mb-2">`, children(), `${pad}</div>`].join("\n");
    }

    case "column": {
      const flex = (p.flex as string) ?? "1";
      const gap = (p.gap as string) ?? "8px";
      const padding = (p.padding as string) ?? "0px";
      return [
        `${pad}<div style="display:flex;flex-direction:column;flex:${esc(flex)};gap:${esc(gap)};padding:${esc(padding)}">`,
        children(),
        `${pad}</div>`,
      ].join("\n");
    }

    case "tabs": {
      const tabs = Array.isArray(p.tabs) ? (p.tabs as string[]) : String(p.tabs ?? "Tab 1").split(",");
      const tabHeaders = tabs
        .map((t, i) =>
          [
            `${pad}      <li class="nav-item">`,
            `${pad}        <button class="nav-link${i === 0 ? " active" : ""}" type="button">${esc(t.trim())}</button>`,
            `${pad}      </li>`,
          ].join("\n")
        )
        .join("\n");
      return [
        `${pad}<div class="card mb-3">`,
        `${pad}  <div class="card-header">`,
        `${pad}    <ul class="nav nav-tabs card-header-tabs">`,
        tabHeaders,
        `${pad}    </ul>`,
        `${pad}  </div>`,
        `${pad}  <div class="card-body">`,
        children(),
        `${pad}  </div>`,
        `${pad}</div>`,
      ].join("\n");
    }

    case "panel": {
      const title = (p.title as string) ?? "Panel";
      const borderColor = (p.borderColor as string) ?? "#e5e7eb";
      return [
        `${pad}<div class="card mb-3" style="border-color:${esc(borderColor)}">`,
        `${pad}  <div class="card-header d-flex justify-content-between align-items-center">`,
        `${pad}    <h6 class="mb-0">${esc(title)}</h6>`,
        p.collapsible ? `${pad}    <button type="button" class="btn btn-link btn-sm p-0">▲</button>` : "",
        `${pad}  </div>`,
        `${pad}  <div class="card-body">`,
        children(),
        `${pad}  </div>`,
        `${pad}</div>`,
      ]
        .filter((l) => l !== "")
        .join("\n");
    }

    // ── Form ────────────────────────────────────────────────────────────────

    case "text-input": {
      const label = (p.label as string) ?? "Text Input";
      const placeholder = esc((p.placeholder as string) ?? "");
      const maxLen = p.maxLength ? ` maxlength="${p.maxLength}"` : "";
      return [
        `${pad}${wrapperOpen(node)}`,
        `${pad}  <label for="${node.id}">${esc(label)}${req(Boolean(p.required))}</label>`,
        `${pad}  <input id="${node.id}" name="${node.id}" type="text" class="form-control" placeholder="${placeholder}"${maxLen} />`,
        p.helperText ? `${pad}  <small class="form-text text-muted">${esc(p.helperText as string)}</small>` : "",
        `${pad}</div>`,
      ]
        .filter((l) => l !== "")
        .join("\n");
    }

    case "textarea": {
      const label = (p.label as string) ?? "Text Area";
      const placeholder = esc((p.placeholder as string) ?? "");
      const rows = (p.rows as number) ?? 4;
      return [
        `${pad}${wrapperOpen(node)}`,
        `${pad}  <label for="${node.id}">${esc(label)}${req(Boolean(p.required))}</label>`,
        `${pad}  <textarea id="${node.id}" name="${node.id}" class="form-control" placeholder="${placeholder}" rows="${rows}"></textarea>`,
        p.helperText ? `${pad}  <small class="form-text text-muted">${esc(p.helperText as string)}</small>` : "",
        `${pad}</div>`,
      ]
        .filter((l) => l !== "")
        .join("\n");
    }

    case "number-input": {
      const label = (p.label as string) ?? "Number";
      const placeholder = esc((p.placeholder as string) ?? "");
      const min = p.min !== undefined ? ` min="${p.min}"` : "";
      const max = p.max !== undefined ? ` max="${p.max}"` : "";
      return [
        `${pad}${wrapperOpen(node)}`,
        `${pad}  <label for="${node.id}">${esc(label)}${req(Boolean(p.required))}</label>`,
        `${pad}  <input id="${node.id}" name="${node.id}" type="number" class="form-control" placeholder="${placeholder}"${min}${max} />`,
        `${pad}</div>`,
      ].join("\n");
    }

    case "dropdown": {
      const label = (p.label as string) ?? "Dropdown";
      const options = Array.isArray(p.options)
        ? (p.options as string[])
        : String(p.options ?? "").split(",");
      const optLines = options
        .map((o) => `${pad}    <option value="${esc(o.trim())}">${esc(o.trim())}</option>`)
        .join("\n");
      return [
        `${pad}${wrapperOpen(node)}`,
        `${pad}  <label for="${node.id}">${esc(label)}${req(Boolean(p.required))}</label>`,
        `${pad}  <select id="${node.id}" name="${node.id}" class="form-control">`,
        `${pad}    <option value="">Select…</option>`,
        optLines,
        `${pad}  </select>`,
        p.helperText ? `${pad}  <small class="form-text text-muted">${esc(p.helperText as string)}</small>` : "",
        `${pad}</div>`,
      ]
        .filter((l) => l !== "")
        .join("\n");
    }

    case "checkbox": {
      const label = (p.label as string) ?? "Checkbox";
      return [
        `${pad}${wrapperOpen(node)}`,
        `${pad}  <div class="custom-control custom-checkbox">`,
        `${pad}    <input type="checkbox" class="custom-control-input" id="${node.id}" name="${node.id}" />`,
        `${pad}    <label class="custom-control-label" for="${node.id}">${esc(label)}${req(Boolean(p.required))}</label>`,
        `${pad}  </div>`,
        p.helperText ? `${pad}  <small class="form-text text-muted">${esc(p.helperText as string)}</small>` : "",
        `${pad}</div>`,
      ]
        .filter((l) => l !== "")
        .join("\n");
    }

    case "radio": {
      const label = (p.label as string) ?? "Radio Group";
      const options = Array.isArray(p.options)
        ? (p.options as string[])
        : String(p.options ?? "").split(",");
      const optLines = options
        .map((o) =>
          [
            `${pad}  <div class="custom-control custom-radio">`,
            `${pad}    <input type="radio" class="custom-control-input" id="${node.id}-${esc(o.trim())}" name="${node.id}" value="${esc(o.trim())}" />`,
            `${pad}    <label class="custom-control-label" for="${node.id}-${esc(o.trim())}">${esc(o.trim())}</label>`,
            `${pad}  </div>`,
          ].join("\n")
        )
        .join("\n");
      return [
        `${pad}${wrapperOpen(node)}`,
        `${pad}  <label>${esc(label)}${req(Boolean(p.required))}</label>`,
        optLines,
        `${pad}</div>`,
      ].join("\n");
    }

    case "date-input": {
      const label = (p.label as string) ?? "Date";
      return [
        `${pad}${wrapperOpen(node)}`,
        `${pad}  <label for="${node.id}">${esc(label)}${req(Boolean(p.required))}</label>`,
        `${pad}  <input id="${node.id}" name="${node.id}" type="date" class="form-control" />`,
        p.helperText ? `${pad}  <small class="form-text text-muted">${esc(p.helperText as string)}</small>` : "",
        `${pad}</div>`,
      ]
        .filter((l) => l !== "")
        .join("\n");
    }

    case "email-input": {
      const label = (p.label as string) ?? "Email";
      const placeholder = esc((p.placeholder as string) ?? "");
      return [
        `${pad}${wrapperOpen(node)}`,
        `${pad}  <label for="${node.id}">${esc(label)}${req(Boolean(p.required))}</label>`,
        `${pad}  <input id="${node.id}" name="${node.id}" type="email" class="form-control" placeholder="${placeholder}" />`,
        `${pad}</div>`,
      ].join("\n");
    }

    case "phone-input": {
      const label = (p.label as string) ?? "Phone";
      const placeholder = esc((p.placeholder as string) ?? "");
      return [
        `${pad}${wrapperOpen(node)}`,
        `${pad}  <label for="${node.id}">${esc(label)}${req(Boolean(p.required))}</label>`,
        `${pad}  <input id="${node.id}" name="${node.id}" type="tel" class="form-control" placeholder="${placeholder}" />`,
        `${pad}</div>`,
      ].join("\n");
    }

    case "file-upload": {
      const label = (p.label as string) ?? "File Upload";
      const accept = esc((p.accept as string) ?? "*");
      const multiple = Boolean(p.multiple) ? " multiple" : "";
      return [
        `${pad}${wrapperOpen(node)}`,
        `${pad}  <label for="${node.id}">${esc(label)}${req(Boolean(p.required))}</label>`,
        `${pad}  <input id="${node.id}" name="${node.id}" type="file" class="form-control" accept="${accept}"${multiple} />`,
        `${pad}</div>`,
      ].join("\n");
    }

    // ── Display ─────────────────────────────────────────────────────────────

    case "label": {
      const fontSize = esc((p.fontSize as string) ?? "14px");
      const fontWeight = esc((p.fontWeight as string) ?? "normal");
      const color = esc((p.color as string) ?? "#000000");
      return `${pad}<p style="font-size:${fontSize};font-weight:${fontWeight};color:${color};margin-bottom:4px">${esc(p.text as string)}</p>`;
    }

    case "button": {
      const variantMap: Record<string, string> = {
        primary: "btn-primary",
        secondary: "btn-secondary",
        danger: "btn-danger",
        ghost: "btn-outline-primary",
      };
      const sizeMap: Record<string, string> = { sm: "btn-sm", md: "", lg: "btn-lg" };
      const variant = (p.variant as string) ?? "primary";
      const size = (p.size as string) ?? "md";
      const cls = `btn ${variantMap[variant] ?? "btn-primary"} ${sizeMap[size] ?? ""}`.trim();
      return `${pad}<button type="button" class="${cls}">${esc(p.text as string ?? "Button")}</button>`;
    }

    case "image": {
      const src = esc((p.src as string) ?? "");
      const alt = esc((p.alt as string) ?? "");
      const width = esc((p.width as string) ?? "100%");
      const height = esc((p.height as string) ?? "auto");
      return `${pad}<img src="${src}" alt="${alt}" style="width:${width};height:${height}" class="rounded" />`;
    }

    default:
      return `${pad}<!-- unknown component: ${node.type} -->`;
  }
}

// ─── Link / Script tag builders ───────────────────────────────────────────────

function linkTagHtml(link: LinkResource): string {
  const src =
    link.sourceType === "boardresource"
      ? `<boardresource>${esc(link.source)}</boardresource>`
      : `href="${esc(link.source)}"`;
  const rel = link.rel ? ` rel="${esc(link.rel)}"` : "";
  const type = link.type ? ` type="${esc(link.type)}"` : "";
  const media = link.media ? ` media="${esc(link.media)}"` : "";

  if (link.sourceType === "boardresource") {
    return `<link ${src}${rel}${type}${media} />`;
  }
  return `<link ${src}${rel}${type}${media} />`;
}

function scriptTagHtml(script: ScriptResource): string {
  const src =
    script.sourceType === "boardresource"
      ? `<boardresource>${esc(script.source)}</boardresource>`
      : `src="${esc(script.source)}"`;
  const type = script.type ? ` type="${esc(script.type)}"` : "";
  const integrity = script.integrity ? ` integrity="${esc(script.integrity)}"` : "";
  const crossorigin = script.crossorigin ? ` crossorigin="${esc(script.crossorigin)}"` : "";
  const referrer = script.referrerpolicy ? ` referrerpolicy="${esc(script.referrerpolicy)}"` : "";
  const asyncAttr = script.async ? " async" : "";
  const deferAttr = script.defer ? " defer" : "";

  return `<script ${src}${type}${integrity}${crossorigin}${referrer}${asyncAttr}${deferAttr}></script>`;
}

// ─── Main export ──────────────────────────────────────────────────────────────

export function schemaToHtml(schema: ProjectSchema): string {
  const links = schema.links ?? [];
  const scripts = schema.scripts ?? [];
  const nodes = schema.rootNodes ?? [];

  const linkLines = links.map((l) => linkTagHtml(l)).join("\n");
  const formHtml = nodes.map((n) => nodeToHtml(n, 2)).join("\n\n");
  const scriptLines = scripts.map((s) => scriptTagHtml(s)).join("\n");

  const parts: string[] = [];

  // Links
  if (linkLines) {
    parts.push(`<!-- ─── Stylesheets ───────────────────────────────── -->\n${linkLines}`);
  }

  // Form body
  parts.push(
    [
      `<!-- ─── View Body ────────────────────────────────── -->`,
      `<applytheme/>`,
      `<insertfields>`,
      `  <form class="container-fluid py-3" novalidate>`,
      formHtml || `    <!-- No components added yet -->`,
      `  </form>`,
      `</insertfields>`,
      `<updatefields>`,
      `  <!-- updatefields content mirrors insertfields -->`,
      `</updatefields>`,
    ].join("\n")
  );

  // Scripts
  if (scriptLines) {
    parts.push(`<!-- ─── Scripts ──────────────────────────────────── -->\n${scriptLines}`);
  }

  return parts.join("\n\n");
}
