"use client";

import React, { useEffect } from "react";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import type { SchemaNode } from "@/types";
import { getComponent } from "@/registry";
import { useBuilder } from "./BuilderContext";
import { NodeRenderer } from "@/renderer/SchemaRenderer";

// ─── CSS injection (Bootstrap + Poppins + personality) ────────────────────────
// Injected once when the canvas first mounts so the live preview matches the
// actual WebEOC output without polluting the module scope.

const CANVAS_LINKS = [
  "https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap",
  "https://maxcdn.bootstrapcdn.com/bootstrap/4.6.2/css/bootstrap.min.css",
];

const CANVAS_STYLE = `
  .webeoc-canvas-body, .webeoc-canvas-body * { font-family: 'Poppins', sans-serif; box-sizing: border-box; }
  .webeoc-canvas-body .form-section { border: none; border-radius: 10px; overflow: hidden; box-shadow: 0 2px 10px rgba(0,0,0,0.06); }
  .webeoc-canvas-body .form-section .card-header { background: linear-gradient(135deg,#f8f9ff 0%,#f0f4ff 100%); border-bottom: 2px solid #e8edff; padding: 12px 18px; }
  .webeoc-canvas-body .form-section .section-title { font-weight: 600; font-size: 13px; color: #3b4a6b; letter-spacing: 0.3px; }
  .webeoc-canvas-body .form-section .card-body { padding: 18px; background: #fff; }
  .webeoc-canvas-body .bmd-form-group label { font-size: 11px; font-weight: 500; color: #6b7a9d; letter-spacing: 0.4px; text-transform: uppercase; margin-bottom: 2px; }
  .webeoc-canvas-body .bmd-form-group .form-control { border: none; border-bottom: 1.5px solid #c8d0e0; border-radius: 0; padding: 5px 0; background: transparent; font-size: 13px; color: #2d3a56; }
  .webeoc-canvas-body .bmd-form-group .form-control:focus { border-bottom-color: #5b7fff; box-shadow: none; outline: none; }
  .webeoc-canvas-body .bmd-form-group select.form-control { cursor: pointer; }
  .webeoc-canvas-body .custom-control-label { font-size: 13px; color: #3b4a6b; }
  .webeoc-canvas-body .card { border-radius: 10px; }
  .webeoc-canvas-body .btn-link { color: #5b7fff; }
  .webeoc-canvas-body .fa-chevron-up:before { content: '▲'; font-style: normal; font-size: 9px; }
  .webeoc-canvas-body .fa-chevron-down:before { content: '▼'; font-style: normal; font-size: 9px; }
`;

function useCanvasCss() {
  useEffect(() => {
    CANVAS_LINKS.forEach((href) => {
      if (document.querySelector(`link[data-canvas-css][href="${href}"]`)) return;
      const el = document.createElement("link");
      el.rel = "stylesheet";
      el.href = href;
      el.setAttribute("data-canvas-css", "1");
      document.head.appendChild(el);
    });
    if (!document.querySelector("style[data-canvas-personality]")) {
      const el = document.createElement("style");
      el.setAttribute("data-canvas-personality", "1");
      el.textContent = CANVAS_STYLE;
      document.head.appendChild(el);
    }
  }, []);
}

// ─── Canvas root ─────────────────────────────────────────────────────────────

export function BuilderCanvas() {
  const { state } = useBuilder();
  const viewType = state.schema.viewType;

  if (viewType === "input") {
    return <InputViewCanvas />;
  }

  return <PlainCanvas />;
}

// ─── Plain canvas ────────────────────────────────────────────────────────────

function PlainCanvas() {
  const { state, selectNode } = useBuilder();
  const { setNodeRef, isOver } = useDroppable({ id: "root-canvas" });
  useCanvasCss();

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 min-h-full p-6 overflow-y-auto transition-colors webeoc-canvas-body ${
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
  useCanvasCss();

  return (
    <div
      className="flex-1 overflow-y-auto bg-slate-200 py-6 px-4"
      onClick={() => selectNode(null)}
    >
      <div className="max-w-4xl mx-auto">
        {/* Navbar chrome */}
        <nav className="bg-slate-800 text-white rounded-t-xl px-5 py-3 flex items-center gap-3 shadow-lg">
          <div className="w-9 h-9 rounded-lg bg-slate-600 flex items-center justify-center text-xs text-slate-300 shrink-0 font-semibold">
            W
          </div>
          <div>
            <div className="text-xs font-semibold leading-tight text-slate-200">Add / Edit Record</div>
            <div className="text-xs text-slate-400 leading-tight mt-0.5">{viewName}</div>
          </div>
        </nav>

        {/* Form body */}
        <div className="bg-white border border-slate-300 border-t-0 rounded-b-xl shadow-lg">
          {/* Droppable form-section */}
          <div
            ref={setNodeRef}
            className={`p-5 min-h-52 transition-colors webeoc-canvas-body ${
              isOver ? "bg-blue-50/60" : ""
            }`}
          >
            {state.schema.rootNodes.length === 0 ? (
              <div
                className={`border-2 border-dashed rounded-xl flex items-center justify-center h-44 transition-colors ${
                  isOver ? "border-blue-400 bg-blue-50 text-blue-500" : "border-slate-300 text-slate-400"
                }`}
              >
                <div className="text-center">
                  <div className="text-3xl mb-2">⊕</div>
                  <p className="text-sm font-medium">Drag fields into the form</p>
                  <p className="text-xs mt-1 opacity-60">Sections, form fields, and display elements</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {state.schema.rootNodes.map((node, idx) => (
                  <CanvasNode key={node.id} node={node} parentId={null} index={idx} />
                ))}
                <RootDropZone />
              </div>
            )}
          </div>

          {/* Footer chrome */}
          <div className="flex justify-end items-center gap-2 px-5 py-3 border-t border-slate-200 bg-slate-50 rounded-b-xl">
            <button
              type="button"
              className="px-4 py-1.5 text-sm border border-blue-600 text-blue-600 rounded-lg cursor-default hover:bg-blue-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded-lg cursor-default hover:bg-blue-700 transition-colors"
            >
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
      className={`mt-2 h-8 rounded-lg border-2 border-dashed transition-colors ${
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
  const isContainer = Boolean(def?.acceptsChildren);

  const {
    setNodeRef: setDragRef,
    attributes,
    listeners,
    isDragging,
  } = useDraggable({
    id: `canvas-${node.id}`,
    data: { source: "canvas", nodeId: node.id, parentId, index },
  });

  const { setNodeRef: setDropRef, isOver } = useDroppable({
    id: `drop-${node.id}`,
    data: { parentId: node.id },
    disabled: !isContainer,
  });

  const setRef = (el: HTMLDivElement | null) => {
    setDragRef(el);
    if (isContainer) setDropRef(el);
  };

  const nodeName = String(p.label ?? p.title ?? def?.label ?? node.type);

  return (
    <div
      ref={setRef}
      className={`relative group rounded-xl border-2 transition-all ${
        isDragging ? "opacity-40 scale-[0.98]" : ""
      } ${
        isSelected
          ? "border-blue-500 shadow-lg shadow-blue-100"
          : "border-transparent hover:border-blue-300"
      } ${isOver ? "border-blue-400" : ""}`}
      onClick={(e) => {
        e.stopPropagation();
        selectNode(node.id);
      }}
    >
      {/* Floating toolbar — appears on hover/selection */}
      <div
        className={`flex items-center justify-between px-2 py-1 rounded-t-xl text-xs font-medium transition-all ${
          isSelected
            ? "bg-blue-500 text-white"
            : "bg-white/90 text-slate-500 opacity-0 group-hover:opacity-100 border-b border-slate-100"
        }`}
      >
        <div className="flex items-center gap-1.5 min-w-0">
          <span
            {...listeners}
            {...attributes}
            className="cursor-grab active:cursor-grabbing shrink-0 text-base leading-none"
            title="Drag to reorder"
          >
            ⠿
          </span>
          <span className="shrink-0">{def?.icon}</span>
          <span className="truncate opacity-80">{nodeName}</span>
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            deleteNode(node.id);
          }}
          className={`shrink-0 ml-2 px-1 rounded hover:text-red-500 transition-colors ${
            isSelected ? "text-blue-100 hover:text-red-200" : "text-slate-400"
          }`}
          title="Delete"
        >
          ✕
        </button>
      </div>

      {/* Component content */}
      {isContainer ? (
        // Containers: show their visual shell; children go in the drop zone below
        <ContainerShell node={node} isOver={isOver} />
      ) : (
        // Leaf nodes: render actual Bootstrap bmd component (pointer-events disabled so
        // clicks propagate to the selection handler above)
        <div className="pointer-events-none px-3 pb-3 pt-1">
          <NodeRenderer node={node} />
        </div>
      )}

      {/* Drop zone for container children */}
      {isContainer && (
        <div
          className={`mx-3 mb-3 rounded-lg border-2 border-dashed transition-colors min-h-12 ${
            isOver ? "border-blue-400 bg-blue-50/60" : "border-slate-200"
          }`}
        >
          {node.children && node.children.length > 0 ? (
            <div className="p-2 space-y-2">
              {node.children.map((child, idx) => (
                <CanvasNode key={child.id} node={child} parentId={node.id} index={idx} />
              ))}
            </div>
          ) : (
            <div
              className={`h-12 flex items-center justify-center text-xs transition-colors ${
                isOver ? "text-blue-400" : "text-slate-300"
              }`}
            >
              Drop components here
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Container shell ─────────────────────────────────────────────────────────
// Shows the container's "header" visually so the canvas looks like the real
// output, while children are separately rendered via recursive CanvasNode calls.

function ContainerShell({ node, isOver }: { node: SchemaNode; isOver: boolean }) {
  const p = node.props as Record<string, unknown>;

  switch (node.type) {
    case "section": {
      const title = (p.title as string) ?? "Section";
      return (
        <div className="mx-3 mt-1 mb-2 rounded-lg overflow-hidden border border-indigo-100">
          <div className="px-4 py-2 flex items-center justify-between bg-gradient-to-r from-slate-50 to-indigo-50 border-b border-indigo-100">
            <span className="text-xs font-semibold text-slate-700 tracking-wide">{title}</span>
            {p.collapsible !== false && (
              <span className="text-slate-400 text-xs">▲</span>
            )}
          </div>
        </div>
      );
    }

    case "panel": {
      const title = (p.title as string) ?? "Panel";
      const borderColor = (p.borderColor as string) ?? "#e5e7eb";
      return (
        <div
          className="mx-3 mt-1 mb-2 rounded-lg overflow-hidden border"
          style={{ borderColor }}
        >
          <div className="px-4 py-2 flex items-center justify-between bg-slate-50 border-b border-slate-200">
            <span className="text-xs font-semibold text-slate-700">{title}</span>
            {Boolean(p.collapsible) && <span className="text-slate-400 text-xs">▲</span>}
          </div>
        </div>
      );
    }

    case "tabs": {
      const tabs = Array.isArray(p.tabs)
        ? (p.tabs as string[])
        : String(p.tabs ?? "Tab 1").split(",");
      return (
        <div className="mx-3 mt-1 mb-2">
          <div className="flex gap-1 border-b border-slate-200 pb-0">
            {tabs.map((tab, i) => (
              <div
                key={i}
                className={`px-3 py-1.5 text-xs rounded-t-md border border-b-0 cursor-default ${
                  i === 0
                    ? "bg-white border-slate-200 text-blue-600 font-medium"
                    : "bg-slate-100 border-transparent text-slate-500"
                }`}
              >
                {tab.trim()}
              </div>
            ))}
          </div>
        </div>
      );
    }

    case "row": {
      return (
        <div className="mx-3 mt-1 mb-1">
          <span className="text-xs text-slate-400 font-medium">↔ Row</span>
        </div>
      );
    }

    case "column": {
      return (
        <div className="mx-3 mt-1 mb-1">
          <span className="text-xs text-slate-400 font-medium">↕ Column</span>
        </div>
      );
    }

    default:
      return null;
  }
}
