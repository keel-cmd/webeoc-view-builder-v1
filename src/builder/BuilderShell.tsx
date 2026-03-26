"use client";

import React, { useState, useRef } from "react";
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { BuilderProvider, useBuilder } from "./BuilderContext";
import { ComponentSidebar } from "./ComponentSidebar";
import { BuilderCanvas } from "./BuilderCanvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { SchemaRenderer } from "@/renderer/SchemaRenderer";
import { getComponent } from "@/registry";
import type { ProjectSchema } from "@/types";

// ─── Shell ────────────────────────────────────────────────────────────────────

export function BuilderShell() {
  return (
    <BuilderProvider>
      <BuilderInner />
    </BuilderProvider>
  );
}

// ─── Inner (has access to context) ───────────────────────────────────────────

function BuilderInner() {
  const { state, addNode, moveNode, setSchema, setProjectName, markSaved } = useBuilder();
  const [mode, setMode] = useState<"build" | "preview">("build");
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [draggingType, setDraggingType] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  );

  // ─── DnD handlers ──────────────────────────────────────────────────────────

  function handleDragStart(event: DragStartEvent) {
    const data = event.active.data.current as Record<string, unknown> | undefined;
    if (data?.source === "sidebar") {
      setDraggingType(data.componentType as string);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    setDraggingType(null);
    const { active, over } = event;
    if (!over) return;

    const activeData = active.data.current as Record<string, unknown> | undefined;
    const overData = over.data.current as Record<string, unknown> | undefined;

    if (activeData?.source === "sidebar") {
      // Dropping from sidebar onto canvas
      const componentType = activeData.componentType as string;
      const parentId =
        over.id === "root-canvas" || over.id === "root-canvas-end"
          ? null
          : (overData?.parentId as string | null) ?? null;
      addNode(componentType, parentId);
    } else if (activeData?.source === "canvas") {
      // Reordering canvas nodes
      const nodeId = activeData.nodeId as string;
      const newParentId =
        over.id === "root-canvas" || over.id === "root-canvas-end"
          ? null
          : (overData?.parentId as string | null) ?? null;
      moveNode(nodeId, newParentId, 9999);
    }
  }

  // ─── Save / Load / Export / Import ────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    try {
      const schemaPayload = state.schema;
      if (projectId) {
        await fetch(`/api/projects/${projectId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: state.schema.name, schema: schemaPayload }),
        });
      } else {
        const res = await fetch("/api/projects", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: state.schema.name, schema: schemaPayload }),
        });
        if (res.ok) {
          const data = (await res.json()) as { id: string };
          setProjectId(data.id);
        }
      }
      markSaved();
    } catch (e) {
      console.error("Save failed", e);
      alert("Save failed. Make sure your database is configured.");
    } finally {
      setSaving(false);
    }
  }

  function handleExport() {
    const json = JSON.stringify(state.schema, null, 2);
    const blob = new Blob([json], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.schema.name.replace(/\s+/g, "_")}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  function handleImportFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const schema = JSON.parse(ev.target?.result as string) as ProjectSchema;
        setSchema(schema);
        setProjectId(null);
      } catch {
        alert("Invalid JSON schema file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-gray-900 text-white">
      {/* Top bar */}
      <header className="flex items-center justify-between px-4 py-2 bg-gray-800 border-b border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="font-bold text-blue-400 text-lg">⚡ WebEOC</span>
          <span className="text-gray-400 text-sm">View Builder</span>
          <span className="text-gray-600">|</span>
          <input
            type="text"
            value={state.schema.name}
            onChange={(e) => setProjectName(e.target.value)}
            className="bg-transparent text-white text-sm font-medium border-b border-transparent hover:border-gray-500 focus:border-blue-400 focus:outline-none px-1 min-w-40"
          />
          {state.isDirty && <span className="text-yellow-400 text-xs">● unsaved</span>}
        </div>

        <div className="flex items-center gap-2">
          {/* Mode toggle */}
          <div className="flex rounded-lg bg-gray-700 p-0.5">
            <button
              onClick={() => setMode("build")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                mode === "build" ? "bg-gray-500 text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              ✏️ Build
            </button>
            <button
              onClick={() => setMode("preview")}
              className={`px-3 py-1 text-xs rounded-md transition-colors ${
                mode === "preview" ? "bg-gray-500 text-white" : "text-gray-400 hover:text-gray-200"
              }`}
            >
              👁️ Preview
            </button>
          </div>

          <button
            onClick={handleImportClick}
            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            📂 Import
          </button>
          <button
            onClick={handleExport}
            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            📤 Export
          </button>
          <button
            onClick={() => setShowLoadModal(true)}
            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            📋 Projects
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors font-medium"
          >
            {saving ? "Saving…" : "💾 Save"}
          </button>
        </div>
      </header>

      {/* Main content */}
      {mode === "build" ? (
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
        >
          <div className="flex flex-1 overflow-hidden">
            <ComponentSidebar />
            <BuilderCanvas />
            <PropertiesPanel />
          </div>
          <DragOverlay>
            {draggingType && <DragOverlayContent type={draggingType} />}
          </DragOverlay>
        </DndContext>
      ) : (
        <div className="flex-1 overflow-y-auto bg-white">
          <div className="max-w-4xl mx-auto p-8">
            <div className="mb-6 pb-4 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">{state.schema.name}</h1>
              {state.schema.description && (
                <p className="text-gray-500 mt-1">{state.schema.description}</p>
              )}
            </div>
            <SchemaRenderer nodes={state.schema.rootNodes} />
            {state.schema.rootNodes.length === 0 && (
              <div className="text-center text-gray-400 py-16">
                <div className="text-4xl mb-2">📋</div>
                <p>No components added yet. Switch to Build mode to add components.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />

      {/* Load projects modal */}
      {showLoadModal && (
        <LoadProjectsModal
          onClose={() => setShowLoadModal(false)}
          onLoad={(schema, id) => {
            setSchema(schema);
            setProjectId(id);
            setShowLoadModal(false);
          }}
        />
      )}
    </div>
  );
}

// ─── Drag overlay ─────────────────────────────────────────────────────────────

function DragOverlayContent({ type }: { type: string }) {
  const def = getComponent(type);
  return (
    <div className="bg-white border-2 border-blue-400 rounded-lg px-3 py-2 text-sm shadow-lg pointer-events-none">
      {def?.icon} {def?.label ?? type}
    </div>
  );
}

// ─── Load projects modal ──────────────────────────────────────────────────────

interface Project {
  id: string;
  name: string;
  description?: string;
  updatedAt: string;
  schema?: { data: ProjectSchema };
}

function LoadProjectsModal({
  onClose,
  onLoad,
}: {
  onClose: () => void;
  onLoad: (schema: ProjectSchema, id: string) => void;
}) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/projects")
      .then((r) => r.json())
      .then((data: Project[]) => setProjects(data))
      .catch(() => setProjects([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold text-gray-900">Load Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">
          {loading && <p className="text-sm text-gray-400 text-center py-8">Loading…</p>}
          {!loading && projects.length === 0 && (
            <p className="text-sm text-gray-400 text-center py-8">
              No saved projects yet. Save your current project first.
            </p>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 border border-gray-200 mb-2"
            >
              <div>
                <p className="font-medium text-gray-800 text-sm">{p.name}</p>
                <p className="text-xs text-gray-400">
                  {new Date(p.updatedAt).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => {
                  if (p.schema?.data) {
                    onLoad(p.schema.data as ProjectSchema, p.id);
                  }
                }}
                className="px-3 py-1 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700"
              >
                Load
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
