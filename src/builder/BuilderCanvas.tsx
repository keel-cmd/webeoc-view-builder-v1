"use client";

import React from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import type { SchemaNode } from "@/types";
import { getComponent } from "@/registry";
import { useBuilder } from "./BuilderContext";

// ─── Canvas root ─────────────────────────────────────────────────────────────

export function BuilderCanvas() {
  const { state, selectNode } = useBuilder();
  const viewType = state.schema.viewType;

  if (viewType === "input") {
    return <InputViewCanvas />;
  }

  return <PlainCanvas />;
}

// ─── Plain canvas (no view type / legacy) ────────────────────────────────────

function PlainCanvas() {
  const { state, selectNode } = useBuilder();
  const { setNodeRef, isOver } = useDroppable({ id: "root-canvas" });

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-full p-6 overflow-y-auto transition-colors ${
        isOver ? "bg-blue-50" : "bg-gray-100"
      }`}
      onClick={() => selectNode(null)}
    >
      {state.schema.rootNodes.length === 0 && (
        <div
          className={`border-2 border-dashed rounded-xl flex items-center justify-center h-64 text-gray-400 transition-colors ${
            isOver ? "border-blue-400 text-blue-400" : "border-gray-300"
          }`}
        >
          <div className="text-center">
            <div className="text-4xl mb-2">⊕</div>
            <p className="text-sm">Drag components here to start building</p>
          </div>
        </div>
      )}
      <div className="space-y-2">
        {state.schema.rootNodes.map((node, idx) => (
          <CanvasNode key={node.id} node={node} parentId={null} index={idx} />
        ))}
      </div>
      {state.schema.rootNodes.length > 0 && <RootDropZone />}
    </div>
  );
}

// ─── Input view canvas (WebEOC chrome wrapper) ────────────────────────────────

function InputViewCanvas() {
  const { state, selectNode } = useBuilder();
  const { setNodeRef, isOver } = useDroppable({ id: "root-canvas" });
  const viewName = state.schema.name;

  return (
    <div
      className="flex-1 overflow-y-auto bg-gray-200 py-4 px-4"
      onClick={() => selectNode(null)}
    >
      <div className="max-w-4xl mx-auto">
        {/* Navbar chrome */}
        <nav className="bg-gray-800 text-white rounded-t-lg px-4 py-3 flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-gray-600 flex items-center justify-center text-xs text-gray-300 shrink-0">
            Logo
          </div>
          <div>
            <div className="text-sm font-semibold leading-tight">Add/Edit Record</div>
            <div className="text-xs text-gray-400 leading-tight">{viewName}</div>
          </div>
        </nav>

        {/* Form body */}
        <div className="bg-white border border-gray-300 border-t-0 rounded-b-lg">
          {/* Droppable form-section */}
          <div
            ref={setNodeRef}
            className={`p-4 min-h-48 transition-colors rounded-b-lg ${
              isOver ? "bg-blue-50" : ""
            }`}
          >
            {state.schema.rootNodes.length === 0 ? (
              <div
                className={`border-2 border-dashed rounded-xl flex items-center justify-center h-40 text-gray-400 transition-colors ${
                  isOver ? "border-blue-400 text-blue-400" : "border-gray-300"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-1">⊕</div>
                  <p className="text-sm">Drag fields into the form section</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {state.schema.rootNodes.map((node, idx) => (
                  <CanvasNode key={node.id} node={node} parentId={null} index={idx} />
                ))}
                <RootDropZone />
              </div>
            )}
          </div>

          {/* Footer chrome */}
          <div className="flex justify-end items-center gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
            <button className="px-4 py-1.5 text-sm border border-blue-600 text-blue-600 rounded cursor-default">
              Cancel
            </button>
            <button className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded cursor-default">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Root drop zone ──────────────────────────────────────────────────────────

function RootDropZone() {
  const { isOver, setNodeRef } = useDroppable({ id: "root-canvas-end" });
  return (
    <div
      ref={setNodeRef}
      className={`mt-2 h-8 rounded border-2 border-dashed transition-colors ${
        isOver ? "border-blue-400 bg-blue-50" : "border-transparent"
      }`}
    />
  );
}

// ─── Canvas node ─────────────────────────────────────────────────────────────

interface CanvasNodeProps {
  node: SchemaNode;
  parentId: string | null;
  index: number;
}

function CanvasNode({ node, parentId, index }: CanvasNodeProps) {
  const { selectNode, deleteNode, state } = useBuilder();
  const isSelected = state.selectedNodeId === node.id;
  const def = getComponent(node.type);
  const p = node.props as Record<string, unknown>;

  const { setNodeRef: setDragRef, attributes, listeners, isDragging } = useDraggable({
    id: `canvas-${node.id}`,
    data: { source: "canvas", nodeId: node.id, parentId, index },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${node.id}`,
    data: { parentId: node.id },
    disabled: !def?.acceptsChildren,
  });

  const setRef = (el: HTMLDivElement | null) => {
    setDragRef(el);
    if (def?.acceptsChildren) setDropRef(el);
  };

  return (
    <div
      ref={setRef}
      className={`relative group rounded-lg border-2 transition-all ${
        isDragging ? "opacity-40 scale-95" : ""
      } ${
        isSelected
          ? "border-blue-500 bg-white shadow-md"
          : "border-transparent hover:border-blue-200 bg-white shadow-sm"
      } ${isOver ? "border-blue-400 bg-blue-50" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        selectNode(node.id);
      }}
    >
      {/* Drag handle + label bar */}
      <div
        className={`flex items-center justify-between px-2 py-1 rounded-t text-xs font-medium ${
          isSelected ? "bg-blue-500 text-white" : "bg-gray-100 text-gray-500 group-hover:bg-gray-200"
        }`}
      >
        <div className="flex items-center gap-1">
          <span
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing px-1"
            title="Drag"
          >
            ⠿
          </span>
          <span>{def?.icon} {def?.label ?? node.type}</span>
          {Boolean(p.label) && <span className="opacity-70">— {String(p.label)}</span>}
          {Boolean(p.title) && !p.label && <span className="opacity-70">— {String(p.title)}</span>}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(node.id);
          }}
          className="opacity-60 hover:opacity-100 hover:text-red-500 transition-colors ml-2"
          title="Delete"
        >
          ✕
        </button>
      </div>

      {/* Component preview */}
      <div className="p-3">
        <ComponentPreview node={node} />
      </div>

      {/* Drop zone for children */}
      {def?.acceptsChildren && (
        <div
          className={`mx-3 mb-3 min-h-12 rounded border-2 border-dashed transition-colors ${
            isOver ? "border-blue-400 bg-blue-50" : "border-gray-200"
          }`}
        >
          {node.children && node.children.length > 0 ? (
            <div className="p-2 space-y-2">
              {node.children.map((child, idx) => (
                <CanvasNode key={child.id} node={child} parentId={node.id} index={idx} />
              ))}
            </div>
          ) : (
            <div className="h-12 flex items-center justify-center text-xs text-gray-300">
              Drop here
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Compact Component Preview ────────────────────────────────────────────────

function ComponentPreview({ node }: { node: SchemaNode }) {
  const p = node.props as Record<string, unknown>;

  switch (node.type) {
    case "text-input":
    case "email-input":
    case "phone-input":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {(p.label as string) ?? "Input"}
            {Boolean(p.required) && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <div className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-400 bg-gray-50">
            {(p.placeholder as string) || "Text input…"}
          </div>
        </div>
      );

    case "textarea":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {(p.label as string) ?? "Text Area"}
            {Boolean(p.required) && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <div className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-400 bg-gray-50 h-12">
            {(p.placeholder as string) || "Text area…"}
          </div>
        </div>
      );

    case "number-input":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {(p.label as string) ?? "Number"}
            {Boolean(p.required) && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <div className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-400 bg-gray-50">
            0
          </div>
        </div>
      );

    case "date-input":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {(p.label as string) ?? "Date"}
            {Boolean(p.required) && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <div className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-400 bg-gray-50">
            MM/DD/YYYY
          </div>
        </div>
      );

    case "dropdown":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {(p.label as string) ?? "Dropdown"}
            {Boolean(p.required) && <span className="text-red-500 ml-0.5">*</span>}
          </label>
          <div className="border border-gray-300 rounded px-2 py-1 text-xs text-gray-400 bg-gray-50 flex justify-between">
            <span>Select…</span><span>▼</span>
          </div>
        </div>
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-2 text-xs text-gray-600">
          <div className="w-3 h-3 border border-gray-300 rounded bg-gray-50" />
          {(p.label as string) ?? "Checkbox"}
        </label>
      );

    case "radio":
      return (
        <div>
          <p className="text-xs font-medium text-gray-600 mb-1">{(p.label as string) ?? "Radio"}</p>
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <div className="w-3 h-3 rounded-full border border-gray-300" />
            Option 1
          </div>
        </div>
      );

    case "file-upload":
      return (
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            {(p.label as string) ?? "File Upload"}
          </label>
          <div className="border border-dashed border-gray-300 rounded px-2 py-2 text-xs text-gray-400 text-center">
            📎 Choose file…
          </div>
        </div>
      );

    case "label":
      return (
        <p
          style={{
            fontSize: "13px",
            fontWeight: (p.fontWeight as string) ?? "normal",
            color: (p.color as string) ?? "#374151",
          }}
        >
          {(p.text as string) || "Label text"}
        </p>
      );

    case "button":
      return (
        <div>
          <span className="inline-block bg-blue-600 text-white text-xs px-3 py-1 rounded">
            {(p.text as string) ?? "Button"}
          </span>
        </div>
      );

    case "image":
      return (
        <div className="border border-dashed border-gray-200 rounded bg-gray-50 h-12 flex items-center justify-center text-gray-300 text-xs">
          🖼️ {p.src ? "Image" : "Image placeholder"}
        </div>
      );

    case "section":
      return (
        <div className="text-xs text-gray-500">
          📦 Section: <strong>{(p.title as string) ?? ""}</strong>
        </div>
      );

    case "row":
      return <div className="text-xs text-gray-500">↔️ Row (flex horizontal)</div>;

    case "column":
      return <div className="text-xs text-gray-500">↕️ Column (flex vertical)</div>;

    case "tabs":
      return (
        <div className="text-xs text-gray-500">
          📑 Tabs:{" "}
          {(Array.isArray(p.tabs) ? p.tabs : String(p.tabs ?? "").split(",")).join(", ")}
        </div>
      );

    case "panel":
      return (
        <div className="text-xs text-gray-500">
          🗃️ Panel: <strong>{(p.title as string) ?? ""}</strong>
        </div>
      );

    default:
      return (
        <div className="text-xs text-gray-400 italic">{node.type}</div>
      );
  }
}
