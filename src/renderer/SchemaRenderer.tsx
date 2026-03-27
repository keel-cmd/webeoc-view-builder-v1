"use client";

import React, { useState } from "react";
import type { SchemaNode } from "@/types";

// ─── Renderer Entry ───────────────────────────────────────────────────────────

interface RendererProps {
  nodes: SchemaNode[];
}

export function SchemaRenderer({ nodes }: RendererProps) {
  return (
    <div className="schema-renderer">
      {nodes.map((node) => (
        <NodeRenderer key={node.id} node={node} />
      ))}
    </div>
  );
}

// ─── Single Node ──────────────────────────────────────────────────────────────

export function NodeRenderer({ node }: { node: SchemaNode }) {
  const p = node.props as Record<string, unknown>;

  switch (node.type) {
    // ── Layout ────────────────────────────────────────────────────────────────

    case "section":
      return <SectionRenderer node={node} />;

    case "row":
      return (
        <div className="form-row mb-2">
          {node.children?.map((child) => (
            <NodeRenderer key={child.id} node={child} />
          ))}
        </div>
      );

    case "column":
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: (p.flex as string) ?? "1",
            gap: (p.gap as string) ?? "8px",
            padding: (p.padding as string) ?? "0px",
          }}
        >
          {node.children?.map((child) => (
            <NodeRenderer key={child.id} node={child} />
          ))}
        </div>
      );

    case "tabs":
      return <TabsRenderer node={node} />;

    case "panel":
      return <PanelRenderer node={node} />;

    // ── Form ──────────────────────────────────────────────────────────────────

    case "text-input": {
      const col = (p.col as string) ?? "col-6";
      const label = (p.label as string) ?? "Text Input";
      const required = Boolean(p.required);
      return (
        <div className={`form-group bmd-form-group ${col}`}>
          <label htmlFor={node.id} className="">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
          <input
            id={node.id}
            name={node.id}
            type="text"
            className="form-control"
            placeholder={(p.placeholder as string) ?? ""}
            maxLength={p.maxLength as number | undefined}
          />
          {Boolean(p.helperText) && <small className="form-text text-muted">{p.helperText as string}</small>}
        </div>
      );
    }

    case "textarea": {
      const col = (p.col as string) ?? "col-6";
      const label = (p.label as string) ?? "Text Area";
      const required = Boolean(p.required);
      return (
        <div className={`form-group bmd-form-group ${col}`}>
          <label htmlFor={node.id} className="">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
          <textarea
            id={node.id}
            name={node.id}
            className="form-control"
            placeholder={(p.placeholder as string) ?? ""}
            rows={(p.rows as number) ?? 4}
          />
          {Boolean(p.helperText) && <small className="form-text text-muted">{p.helperText as string}</small>}
        </div>
      );
    }

    case "number-input": {
      const col = (p.col as string) ?? "col-6";
      const label = (p.label as string) ?? "Number";
      const required = Boolean(p.required);
      return (
        <div className={`form-group bmd-form-group ${col}`}>
          <label htmlFor={node.id} className="">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
          <input
            id={node.id}
            name={node.id}
            type="number"
            className="form-control"
            placeholder={(p.placeholder as string) ?? ""}
            min={p.min as number | undefined}
            max={p.max as number | undefined}
          />
        </div>
      );
    }

    case "dropdown": {
      const col = (p.col as string) ?? "col-6";
      const label = (p.label as string) ?? "Dropdown";
      const required = Boolean(p.required);
      return (
        <div className={`form-group bmd-form-group ${col}`}>
          <label htmlFor={node.id} className="">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
          <select id={node.id} name={node.id} className="form-control">
            <option value="">Select…</option>
            {(Array.isArray(p.options) ? p.options : String(p.options ?? "").split(","))
              .map((opt: string) => (
                <option key={opt} value={opt.trim()}>
                  {opt.trim()}
                </option>
              ))}
          </select>
          {Boolean(p.helperText) && <small className="form-text text-muted">{p.helperText as string}</small>}
        </div>
      );
    }

    case "checkbox": {
      const col = (p.col as string) ?? "col-6";
      const label = (p.label as string) ?? "Checkbox";
      const required = Boolean(p.required);
      return (
        <div className={`form-group bmd-form-group ${col}`}>
          <div className="custom-control custom-checkbox">
            <input
              type="checkbox"
              className="custom-control-input"
              id={node.id}
              name={node.id}
            />
            <label className="custom-control-label" htmlFor={node.id}>
              {label}
              {required && <span className="text-danger ml-1">*</span>}
            </label>
          </div>
          {Boolean(p.helperText) && <small className="form-text text-muted">{p.helperText as string}</small>}
        </div>
      );
    }

    case "radio": {
      const col = (p.col as string) ?? "col-6";
      const label = (p.label as string) ?? "Radio Group";
      const required = Boolean(p.required);
      const options = Array.isArray(p.options)
        ? p.options
        : String(p.options ?? "").split(",");
      return (
        <div className={`form-group bmd-form-group ${col}`}>
          <label className="">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
          {options.map((opt: string) => (
            <div key={opt} className="custom-control custom-radio">
              <input
                type="radio"
                className="custom-control-input"
                id={`${node.id}-${opt.trim()}`}
                name={node.id}
                value={opt.trim()}
              />
              <label
                className="custom-control-label"
                htmlFor={`${node.id}-${opt.trim()}`}
              >
                {opt.trim()}
              </label>
            </div>
          ))}
        </div>
      );
    }

    case "date-input": {
      const col = (p.col as string) ?? "col-6";
      const label = (p.label as string) ?? "Date";
      const required = Boolean(p.required);
      return (
        <div className={`form-group bmd-form-group ${col}`}>
          <label htmlFor={node.id} className="">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
          <input
            id={node.id}
            name={node.id}
            type="date"
            className="form-control"
          />
          {Boolean(p.helperText) && <small className="form-text text-muted">{p.helperText as string}</small>}
        </div>
      );
    }

    case "email-input": {
      const col = (p.col as string) ?? "col-6";
      const label = (p.label as string) ?? "Email";
      const required = Boolean(p.required);
      return (
        <div className={`form-group bmd-form-group ${col}`}>
          <label htmlFor={node.id} className="">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
          <input
            id={node.id}
            name={node.id}
            type="email"
            className="form-control"
            placeholder={(p.placeholder as string) ?? ""}
          />
        </div>
      );
    }

    case "phone-input": {
      const col = (p.col as string) ?? "col-6";
      const label = (p.label as string) ?? "Phone";
      const required = Boolean(p.required);
      return (
        <div className={`form-group bmd-form-group ${col}`}>
          <label htmlFor={node.id} className="">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
          <input
            id={node.id}
            name={node.id}
            type="tel"
            className="form-control"
            placeholder={(p.placeholder as string) ?? ""}
          />
        </div>
      );
    }

    case "file-upload": {
      const col = (p.col as string) ?? "col-6";
      const label = (p.label as string) ?? "File Upload";
      const required = Boolean(p.required);
      return (
        <div className={`form-group bmd-form-group ${col}`}>
          <label htmlFor={node.id} className="">
            {label}
            {required && <span className="text-danger ml-1">*</span>}
          </label>
          <input
            id={node.id}
            name={node.id}
            type="file"
            className="form-control"
            accept={(p.accept as string) ?? "*"}
            multiple={(p.multiple as boolean) ?? false}
          />
        </div>
      );
    }

    // ── Display ───────────────────────────────────────────────────────────────

    case "label":
      return (
        <p
          style={{
            fontSize: (p.fontSize as string) ?? "14px",
            fontWeight: (p.fontWeight as string) ?? "normal",
            color: (p.color as string) ?? "#000000",
            marginBottom: "4px",
          }}
        >
          {(p.text as string) ?? ""}
        </p>
      );

    case "button":
      return <ButtonRenderer p={p} />;

    case "image":
      return Boolean(p.src) ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={p.src as string}
          alt={(p.alt as string) ?? ""}
          style={{ width: (p.width as string) ?? "100%", height: (p.height as string) ?? "auto" }}
          className="rounded"
        />
      ) : (
        <div
          style={{ width: (p.width as string) ?? "100%", height: "120px" }}
          className="bg-gray-100 border-2 border-dashed border-gray-300 rounded flex items-center justify-center text-gray-400 text-sm"
        >
          Image placeholder
        </div>
      );

    default:
      return (
        <div className="border border-dashed border-gray-300 rounded p-2 text-sm text-gray-400">
          Unknown component: {node.type}
        </div>
      );
  }
}

// ─── Sub-renderers ────────────────────────────────────────────────────────────

function SectionRenderer({ node }: { node: SchemaNode }) {
  const p = node.props as Record<string, unknown>;
  const title = (p.title as string) ?? "Section";
  const collapsible = p.collapsible !== false;
  const [collapsed, setCollapsed] = useState(Boolean(p.defaultCollapsed));

  function toggle() {
    if (collapsible) setCollapsed((c) => !c);
  }

  return (
    <div className="card form-section mb-3">
      <div
        className="card-header d-flex justify-content-between align-items-center"
        onClick={toggle}
        style={{ cursor: collapsible ? "pointer" : "default" }}
      >
        <h6 className="mb-0 section-title">{title}</h6>
        {collapsible && (
          <button
            type="button"
            className="btn btn-link btn-sm p-0"
            onClick={(e) => {
              e.stopPropagation();
              toggle();
            }}
          >
            <i className={`fa fa-chevron-${collapsed ? "down" : "up"}`}></i>
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="card-body">
          <div className="form-row">
            {node.children?.map((child) => (
              <NodeRenderer key={child.id} node={child} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function TabsRenderer({ node }: { node: SchemaNode }) {
  const p = node.props as Record<string, unknown>;
  const tabs = Array.isArray(p.tabs) ? p.tabs : String(p.tabs ?? "Tab 1").split(",");
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="card mb-3">
      <div className="card-header">
        <ul className="nav nav-tabs card-header-tabs">
          {tabs.map((tab: string, i: number) => (
            <li key={i} className="nav-item">
              <button
                className={`nav-link${activeTab === i ? " active" : ""}`}
                onClick={() => setActiveTab(i)}
                type="button"
              >
                {tab.trim()}
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="card-body">
        {node.children
          ?.filter((_, i) => i === activeTab)
          .map((child) => (
            <NodeRenderer key={child.id} node={child} />
          ))}
      </div>
    </div>
  );
}

function PanelRenderer({ node }: { node: SchemaNode }) {
  const p = node.props as Record<string, unknown>;
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="card mb-3"
      style={{ borderColor: (p.borderColor as string) ?? "#e5e7eb" }}
    >
      <div className="card-header d-flex justify-content-between align-items-center">
        <h6 className="mb-0">{(p.title as string) ?? "Panel"}</h6>
        {Boolean(p.collapsible) && (
          <button
            type="button"
            className="btn btn-link btn-sm p-0"
            onClick={() => setCollapsed((c) => !c)}
          >
            {collapsed ? "▼" : "▲"}
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="card-body">
          {node.children?.map((child) => (
            <NodeRenderer key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
}

function ButtonRenderer({ p }: { p: Record<string, unknown> }) {
  const variantClasses: Record<string, string> = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    danger: "btn-danger",
    ghost: "btn-outline-primary",
  };
  const sizeClasses: Record<string, string> = {
    sm: "btn-sm",
    md: "",
    lg: "btn-lg",
  };
  const variant = (p.variant as string) ?? "primary";
  const size = (p.size as string) ?? "md";

  return (
    <button
      type="button"
      className={`btn ${variantClasses[variant] ?? variantClasses.primary} ${sizeClasses[size] ?? ""}`.trim()}
    >
      {(p.text as string) ?? "Button"}
    </button>
  );
}
