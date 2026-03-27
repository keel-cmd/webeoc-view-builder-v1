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
import { v4 as uuidv4 } from "uuid";
import { BuilderProvider, useBuilder } from "./BuilderContext";
import { ComponentSidebar } from "./ComponentSidebar";
import { BuilderCanvas } from "./BuilderCanvas";
import { PropertiesPanel } from "./PropertiesPanel";
import { SchemaRenderer } from "@/renderer/SchemaRenderer";
import { signOut, useSession } from "next-auth/react";
import { getComponent } from "@/registry";
import type { ProjectSchema } from "@/types";
import { getViewTypeDefaults } from "@/lib/viewTypeDefaults";
import { ViewTypeSettingsModal } from "./ViewTypeSettingsModal";

// ─── View type definitions (add more here as needed) ─────────────────────────

interface ViewTypeDefinition {
  id: string;
  label: string;
  description: string;
  icon: string;
  namePrefix: string;
}

const VIEW_TYPES: ViewTypeDefinition[] = [
  {
    id: "input",
    label: "Input View",
    description: "Collect data through form fields",
    icon: "📝",
    namePrefix: "Input-",
  },
];

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
  const { data: session } = useSession();
  const { state, addNode, moveNode, setSchema, setProjectName, markSaved } = useBuilder();
  const [mode, setMode] = useState<"build" | "preview">("build");
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showNewViewWizard, setShowNewViewWizard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
          <button
            onClick={() => setShowNewViewWizard(true)}
            className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 rounded-lg transition-colors font-medium"
          >
            + New View
          </button>
          <button
            onClick={() => setShowSettings(true)}
            className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
            title="View Type Settings"
          >
            ⚙ Settings
          </button>

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

          {session?.user && (
            <div className="flex items-center gap-2 ml-2 pl-2 border-l border-gray-700">
              <span className="text-xs text-gray-400 hidden sm:block">
                {session.user.name ?? session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
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
        <div className="flex-1 overflow-y-auto bg-gray-100">
          {state.schema.viewType === "input" ? (
            <InputViewChrome viewName={state.schema.name}>
              <SchemaRenderer nodes={state.schema.rootNodes} />
              {state.schema.rootNodes.length === 0 && (
                <p className="text-sm text-gray-400 italic">No fields added yet. Switch to Build mode.</p>
              )}
            </InputViewChrome>
          ) : (
            <div className="max-w-4xl mx-auto p-8 bg-white">
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
          )}
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

      {/* View type settings */}
      {showSettings && (
        <ViewTypeSettingsModal onClose={() => setShowSettings(false)} />
      )}

      {/* New view wizard */}
      {showNewViewWizard && (
        <NewViewWizardModal
          onClose={() => setShowNewViewWizard(false)}
          onCreate={(name, viewType) => {
            const { links, scripts } = getViewTypeDefaults(viewType);
            setSchema({ id: uuidv4(), name, description: "", viewType, links, scripts, rootNodes: [] });
            setProjectId(null);
            setMode("build");
            setShowNewViewWizard(false);
          }}
        />
      )}

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

// ─── WebEOC Input View chrome ─────────────────────────────────────────────────
// Renders the fixed navbar, form container, and footer that surround the
// droppable form-section in both canvas and preview modes.

function InputViewChrome({
  viewName,
  children,
}: {
  viewName: string;
  children: React.ReactNode;
}) {
  return (
    <>
      {/* Bootstrap CSS + Poppins for preview */}
      {/* eslint-disable-next-line @next/next/no-page-custom-font */}
      <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap" />
      <link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/4.6.2/css/bootstrap.min.css" />
      <style>{`
        .form-section-preview, .form-section-preview * { font-family: 'Poppins', sans-serif; }
        .form-section { border: none; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 12px rgba(0,0,0,0.07); }
        .form-section .card-header { background: linear-gradient(135deg, #f8f9ff 0%, #f0f4ff 100%); border-bottom: 2px solid #e8edff; padding: 14px 20px; }
        .form-section .section-title { font-family: 'Poppins', sans-serif; font-weight: 600; font-size: 14px; color: #3b4a6b; letter-spacing: 0.3px; }
        .form-section .card-body { padding: 20px; background: #fff; }
        .bmd-form-group label { font-family: 'Poppins', sans-serif; font-size: 12px; font-weight: 500; color: #6b7a9d; letter-spacing: 0.4px; text-transform: uppercase; margin-bottom: 2px; }
        .bmd-form-group .form-control { font-family: 'Poppins', sans-serif; border: none; border-bottom: 1.5px solid #c8d0e0; border-radius: 0; padding: 6px 0; background: transparent; font-size: 14px; color: #2d3a56; transition: border-color 0.2s; }
        .bmd-form-group .form-control:focus { border-bottom-color: #5b7fff; box-shadow: none; outline: none; background: transparent; }
        .bmd-form-group select.form-control { cursor: pointer; }
        .custom-control-label { font-family: 'Poppins', sans-serif; font-size: 13px; color: #3b4a6b; }
        .btn-link { color: #5b7fff; }
        .btn-link:hover { color: #3a5be0; }
        .fa-chevron-up:before { content: '▲'; font-style: normal; font-size: 10px; }
        .fa-chevron-down:before { content: '▼'; font-style: normal; font-size: 10px; }
      `}</style>
      <div className="min-h-full py-4 px-4 bg-gray-100 form-section-preview">
        <div className="max-w-4xl mx-auto">
          {/* Navbar */}
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
            {/* Form section — this is where dropped components live */}
            <div className="p-4">
              <div className="form-section-preview">
                {children}
              </div>
            </div>

            {/* Footer */}
            <div className="flex justify-end items-center gap-2 px-4 py-3 border-t border-gray-200 bg-gray-50 rounded-b-lg">
              <button className="px-4 py-1.5 text-sm border border-blue-600 text-blue-600 rounded hover:bg-blue-50">
                Cancel
              </button>
              <button className="px-4 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700">
                Submit
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
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

// ─── New view wizard modal ────────────────────────────────────────────────────

function NewViewWizardModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (name: string, viewType: string) => void;
}) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedType, setSelectedType] = useState<ViewTypeDefinition | null>(null);
  const [viewName, setViewName] = useState("");
  const [nameOverridden, setNameOverridden] = useState(false);

  function handleSelectType(vt: ViewTypeDefinition) {
    setSelectedType(vt);
    if (!nameOverridden) setViewName(vt.namePrefix);
    setStep(2);
  }

  function handleNameChange(val: string) {
    setViewName(val);
    setNameOverridden(true);
  }

  function handleBack() {
    setStep(1);
    setSelectedType(null);
    setNameOverridden(false);
  }

  function handleCreate() {
    if (viewName.trim() && selectedType) onCreate(viewName.trim(), selectedType.id);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-2xl flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="text-gray-400 hover:text-white text-sm"
              >
                ← Back
              </button>
            )}
            <h2 className="font-semibold text-white text-lg">
              {step === 1 ? "Create a New View" : "Name Your View"}
            </h2>
          </div>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 pt-4">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  step >= s ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-400"
                }`}
              >
                {s}
              </div>
              {s < 2 && <div className={`flex-1 h-px ${step > s ? "bg-blue-600" : "bg-gray-700"}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 1 && (
            <div>
              <p className="text-gray-400 text-sm mb-5">What kind of view do you want to build?</p>
              <div className="grid grid-cols-2 gap-3">
                {VIEW_TYPES.map((vt) => (
                  <button
                    key={vt.id}
                    onClick={() => handleSelectType(vt)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-gray-700 hover:border-blue-500 hover:bg-gray-800 transition-all text-left group"
                  >
                    <span className="text-3xl">{vt.icon}</span>
                    <div>
                      <p className="font-semibold text-white text-sm group-hover:text-blue-300">
                        {vt.label}
                      </p>
                      <p className="text-gray-400 text-xs mt-0.5">{vt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedType && (
            <div>
              <p className="text-gray-400 text-sm mb-5">
                Give your <span className="text-white font-medium">{selectedType.label}</span> a name.
                It defaults to the <span className="font-mono text-blue-300">{selectedType.namePrefix}</span> prefix
                but you can change it to anything.
              </p>
              <label className="block text-sm text-gray-300 mb-1.5">View Name</label>
              <input
                type="text"
                value={viewName}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
                placeholder={`${selectedType.namePrefix}My View`}
                className="w-full px-4 py-2.5 rounded-lg bg-gray-800 border border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 text-sm"
              />
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCreate}
                  disabled={!viewName.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                >
                  Create View
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
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
