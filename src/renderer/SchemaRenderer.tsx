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
      return (
        <section
          style={{
            padding: (p.padding as string) ?? "16px",
            backgroundColor: (p.backgroundColor as string) ?? "#ffffff",
            marginBottom: "16px",
            borderRadius: "6px",
          }}
        >
          {Boolean(p.title) && (
            <h3 className="text-lg font-semibold mb-3 text-gray-800">
              {p.title as string}
            </h3>
          )}
          {node.children?.map((child) => (
            <NodeRenderer key={child.id} node={child} />
          ))}
        </section>
      );

    case "row":
      return (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            gap: (p.gap as string) ?? "8px",
            alignItems: (p.alignItems as string) ?? "stretch",
            marginBottom: "8px",
          }}
        >
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

    case "text-input":
      return (
        <FormField label={p.label as string} required={p.required as boolean} helperText={p.helperText as string}>
          <input
            type="text"
            placeholder={(p.placeholder as string) ?? ""}
            maxLength={p.maxLength as number | undefined}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      );

    case "textarea":
      return (
        <FormField label={p.label as string} required={p.required as boolean} helperText={p.helperText as string}>
          <textarea
            placeholder={(p.placeholder as string) ?? ""}
            rows={(p.rows as number) ?? 4}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      );

    case "number-input":
      return (
        <FormField label={p.label as string} required={p.required as boolean}>
          <input
            type="number"
            placeholder={(p.placeholder as string) ?? ""}
            min={p.min as number | undefined}
            max={p.max as number | undefined}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      );

    case "dropdown":
      return (
        <FormField label={p.label as string} required={p.required as boolean} helperText={p.helperText as string}>
          <select className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
            <option value="">Select…</option>
            {(Array.isArray(p.options) ? p.options : String(p.options ?? "").split(","))
              .map((opt: string) => (
                <option key={opt} value={opt.trim()}>
                  {opt.trim()}
                </option>
              ))}
          </select>
        </FormField>
      );

    case "checkbox":
      return (
        <FormField helperText={p.helperText as string}>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" className="w-4 h-4 rounded" />
            <span>
              {p.label as string}
              {Boolean(p.required) && <span className="text-red-500 ml-1">*</span>}
            </span>
          </label>
        </FormField>
      );

    case "radio":
      return (
        <FormField label={p.label as string} required={p.required as boolean}>
          <div className="space-y-1">
            {(Array.isArray(p.options) ? p.options : String(p.options ?? "").split(","))
              .map((opt: string) => (
                <label key={opt} className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name={node.id} value={opt.trim()} className="w-4 h-4" />
                  <span>{opt.trim()}</span>
                </label>
              ))}
          </div>
        </FormField>
      );

    case "date-input":
      return (
        <FormField label={p.label as string} required={p.required as boolean} helperText={p.helperText as string}>
          <input
            type="date"
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      );

    case "email-input":
      return (
        <FormField label={p.label as string} required={p.required as boolean}>
          <input
            type="email"
            placeholder={(p.placeholder as string) ?? ""}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      );

    case "phone-input":
      return (
        <FormField label={p.label as string} required={p.required as boolean}>
          <input
            type="tel"
            placeholder={(p.placeholder as string) ?? ""}
            className="w-full border border-gray-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </FormField>
      );

    case "file-upload":
      return (
        <FormField label={p.label as string} required={p.required as boolean}>
          <input
            type="file"
            accept={(p.accept as string) ?? "*"}
            multiple={(p.multiple as boolean) ?? false}
            className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
        </FormField>
      );

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

function FormField({
  label,
  required,
  helperText,
  children,
}: {
  label?: string;
  required?: boolean;
  helperText?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-4">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {helperText && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
    </div>
  );
}

function TabsRenderer({ node }: { node: SchemaNode }) {
  const p = node.props as Record<string, unknown>;
  const tabs = Array.isArray(p.tabs) ? p.tabs : String(p.tabs ?? "Tab 1").split(",");
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-4">
      <div className="flex border-b border-gray-200 bg-gray-50">
        {tabs.map((tab: string, i: number) => (
          <button
            key={i}
            onClick={() => setActiveTab(i)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === i
                ? "bg-white border-b-2 border-blue-500 text-blue-600"
                : "text-gray-600 hover:text-gray-800"
            }`}
          >
            {tab.trim()}
          </button>
        ))}
      </div>
      <div className="p-4">
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
      className="border rounded-lg mb-4 overflow-hidden"
      style={{ borderColor: (p.borderColor as string) ?? "#e5e7eb" }}
    >
      <div
        className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b"
        style={{ borderColor: (p.borderColor as string) ?? "#e5e7eb" }}
      >
        <h4 className="font-medium text-gray-800 text-sm">{(p.title as string) ?? "Panel"}</h4>
        {Boolean(p.collapsible) && (
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="text-gray-400 hover:text-gray-600 text-xs"
          >
            {collapsed ? "▼" : "▲"}
          </button>
        )}
      </div>
      {!collapsed && (
        <div className="p-4">
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
    primary: "bg-blue-600 text-white hover:bg-blue-700",
    secondary: "bg-gray-200 text-gray-800 hover:bg-gray-300",
    danger: "bg-red-600 text-white hover:bg-red-700",
    ghost: "bg-transparent text-blue-600 border border-blue-600 hover:bg-blue-50",
  };
  const sizeClasses: Record<string, string> = {
    sm: "px-3 py-1 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };
  const variant = (p.variant as string) ?? "primary";
  const size = (p.size as string) ?? "md";

  return (
    <button
      className={`rounded font-medium transition-colors ${variantClasses[variant] ?? variantClasses.primary} ${sizeClasses[size] ?? sizeClasses.md}`}
    >
      {(p.text as string) ?? "Button"}
    </button>
  );
}
