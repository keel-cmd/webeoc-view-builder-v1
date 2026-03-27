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
import { signOut, useSession } from "next-auth/react";
import { getComponent } from "@/registry";
import type { ProjectSchema } from "@/types";
import { getViewTypeDefaults } from "@/lib/viewTypeDefaults";
import { ViewTypeSettingsModal } from "./ViewTypeSettingsModal";
import { schemaToHtml } from "@/lib/schemaToHtml";

// ─── View type definitions ────────────────────────────────────────────────────

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
  const [mode, setMode] = useState<"build" | "code">("build");
  const [saving, setSaving] = useState(false);
  const [projectId, setProjectId] = useState<string | null>(null);
  const [showLoadModal, setShowLoadModal] = useState(false);
  const [showNewViewWizard, setShowNewViewWizard] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [draggingType, setDraggingType] = useState<string | null>(null);
  const [codeCopied, setCodeCopied] = useState(false);
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
      const componentType = activeData.componentType as string;
      const parentId =
        over.id === "root-canvas" || over.id === "root-canvas-end"
          ? null
          : (overData?.parentId as string | null) ?? null;
      addNode(componentType, parentId);
    } else if (activeData?.source === "canvas") {
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

  function handleCopyCode() {
    const html = schemaToHtml(state.schema);
    navigator.clipboard.writeText(html).then(() => {
      setCodeCopied(true);
      setTimeout(() => setCodeCopied(false), 2000);
    });
  }

  // ─── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="h-screen flex flex-col bg-slate-950 text-white">
      {/* ── Top bar ── */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex-shrink-0 gap-3">
        {/* Left: brand + project name */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex items-center gap-2 shrink-0">
            <span className="font-bold text-blue-400 text-base tracking-tight">WebEOC</span>
            <span className="text-slate-600 text-xs font-medium px-1.5 py-0.5 rounded bg-slate-800">
              View Builder
            </span>
          </div>
          <span className="text-slate-700 hidden sm:block">|</span>
          <div className="flex items-center gap-2 min-w-0">
            <input
              type="text"
              value={state.schema.name}
              onChange={(e) => setProjectName(e.target.value)}
              className="bg-transparent text-white text-sm font-medium border-b border-transparent hover:border-slate-600 focus:border-blue-400 focus:outline-none px-1 min-w-0 max-w-48 truncate"
            />
            {state.isDirty && (
              <span className="text-amber-400 text-xs shrink-0 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />
                unsaved
              </span>
            )}
          </div>
        </div>

        {/* Center: mode tabs */}
        <div className="flex rounded-lg bg-slate-800 p-0.5 shrink-0">
          <button
            onClick={() => setMode("build")}
            className={`px-4 py-1.5 text-xs rounded-md transition-all font-medium ${
              mode === "build"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ✏ Build
          </button>
          <button
            onClick={() => setMode("code")}
            className={`px-4 py-1.5 text-xs rounded-md transition-all font-medium ${
              mode === "code"
                ? "bg-blue-600 text-white shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {"</>"}  Code
          </button>
        </div>

        {/* Right: actions */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => setShowNewViewWizard(true)}
            className="px-3 py-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 rounded-lg transition-colors font-semibold"
          >
            + New View
          </button>

          <div className="w-px h-5 bg-slate-700 mx-0.5" />

          <button
            onClick={() => setShowSettings(true)}
            className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
            title="View Type Settings"
          >
            ⚙
          </button>
          <button
            onClick={handleImportClick}
            className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
            title="Import JSON"
          >
            📂
          </button>
          <button
            onClick={handleExport}
            className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
            title="Export JSON"
          >
            📤
          </button>
          <button
            onClick={() => setShowLoadModal(true)}
            className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-300"
            title="Load Project"
          >
            📋
          </button>

          <div className="w-px h-5 bg-slate-700 mx-0.5" />

          <button
            onClick={handleSave}
            disabled={saving}
            className="px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-500 disabled:opacity-50 rounded-lg transition-colors font-semibold"
          >
            {saving ? "Saving…" : "Save"}
          </button>

          {session?.user && (
            <div className="flex items-center gap-2 pl-2 border-l border-slate-700 ml-0.5">
              <span className="text-xs text-slate-500 hidden md:block truncate max-w-28">
                {session.user.name ?? session.user.email}
              </span>
              <button
                onClick={() => signOut({ callbackUrl: "/login" })}
                className="px-2.5 py-1.5 text-xs bg-slate-800 hover:bg-slate-700 rounded-lg transition-colors text-slate-400"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </header>

      {/* ── Main content ── */}
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
        <CodeView schema={state.schema} onCopy={handleCopyCode} copied={codeCopied} />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleImportFile}
      />

      {showSettings && (
        <ViewTypeSettingsModal onClose={() => setShowSettings(false)} />
      )}

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

// ─── Code view ────────────────────────────────────────────────────────────────

function CodeView({
  schema,
  onCopy,
  copied,
}: {
  schema: ProjectSchema;
  onCopy: () => void;
  copied: boolean;
}) {
  const html = schemaToHtml(schema);

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-slate-950">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-slate-900 border-b border-slate-800 flex-shrink-0">
        <div className="flex items-center gap-3">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Generated HTML
          </span>
          <span className="text-xs text-slate-600">
            {schema.viewType ? `${schema.viewType} view` : "no view type"}
          </span>
        </div>
        <button
          onClick={onCopy}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
            copied
              ? "bg-emerald-600 text-white"
              : "bg-slate-800 hover:bg-slate-700 text-slate-300"
          }`}
        >
          {copied ? "✓ Copied!" : "Copy"}
        </button>
      </div>

      {/* Code area */}
      <div className="flex-1 overflow-auto">
        <pre className="p-6 text-xs leading-relaxed text-slate-300 font-mono whitespace-pre min-w-max">
          <code>{html}</code>
        </pre>
      </div>
    </div>
  );
}

// ─── Drag overlay ─────────────────────────────────────────────────────────────

function DragOverlayContent({ type }: { type: string }) {
  const def = getComponent(type);
  return (
    <div className="bg-white border-2 border-blue-400 rounded-xl px-3 py-2 text-sm shadow-xl pointer-events-none flex items-center gap-2">
      <span>{def?.icon}</span>
      <span className="font-medium text-slate-700">{def?.label ?? type}</span>
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
    <div className="fixed inset-0 bg-black/75 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl w-full max-w-lg flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-700">
          <div className="flex items-center gap-3">
            {step === 2 && (
              <button
                onClick={handleBack}
                className="text-slate-400 hover:text-white text-sm transition-colors"
              >
                ← Back
              </button>
            )}
            <h2 className="font-semibold text-white">
              {step === 1 ? "Create a New View" : "Name Your View"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-slate-300 text-lg leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2 px-6 pt-5">
          {[1, 2].map((s) => (
            <React.Fragment key={s}>
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  step >= s ? "bg-blue-600 text-white" : "bg-slate-700 text-slate-500"
                }`}
              >
                {s}
              </div>
              {s < 2 && (
                <div className={`flex-1 h-px transition-colors ${step > s ? "bg-blue-600" : "bg-slate-700"}`} />
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Body */}
        <div className="p-6">
          {step === 1 && (
            <div>
              <p className="text-slate-400 text-sm mb-5">What kind of view do you want to build?</p>
              <div className="grid grid-cols-2 gap-3">
                {VIEW_TYPES.map((vt) => (
                  <button
                    key={vt.id}
                    onClick={() => handleSelectType(vt)}
                    className="flex flex-col items-start gap-2 p-4 rounded-xl border-2 border-slate-700 hover:border-blue-500 hover:bg-slate-800 transition-all text-left group"
                  >
                    <span className="text-3xl">{vt.icon}</span>
                    <div>
                      <p className="font-semibold text-white text-sm group-hover:text-blue-300">
                        {vt.label}
                      </p>
                      <p className="text-slate-400 text-xs mt-0.5">{vt.description}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && selectedType && (
            <div>
              <p className="text-slate-400 text-sm mb-5">
                Give your{" "}
                <span className="text-white font-medium">{selectedType.label}</span> a name.
              </p>
              <label className="block text-sm text-slate-300 mb-1.5">View Name</label>
              <input
                type="text"
                value={viewName}
                onChange={(e) => handleNameChange(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                autoFocus
                placeholder={`${selectedType.namePrefix}My View`}
                className="w-full px-4 py-2.5 rounded-lg bg-slate-800 border border-slate-600 text-white placeholder-slate-500 focus:outline-none focus:border-blue-500 text-sm transition-colors"
              />
              <div className="flex justify-end mt-6">
                <button
                  onClick={handleCreate}
                  disabled={!viewName.trim()}
                  className="px-5 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  Create View →
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
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[75vh] flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-900">Load Project</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            ✕
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {loading && (
            <p className="text-sm text-gray-400 text-center py-10">Loading…</p>
          )}
          {!loading && projects.length === 0 && (
            <div className="text-center py-12">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm text-gray-400">No saved projects yet.</p>
            </div>
          )}
          {projects.map((p) => (
            <div
              key={p.id}
              className="flex items-center justify-between p-3.5 rounded-xl hover:bg-gray-50 border border-gray-100 transition-colors"
            >
              <div className="min-w-0 mr-3">
                <p className="font-medium text-gray-800 text-sm truncate">{p.name}</p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {new Date(p.updatedAt).toLocaleDateString(undefined, {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </p>
              </div>
              <button
                onClick={() => {
                  if (p.schema?.data) onLoad(p.schema.data as ProjectSchema, p.id);
                }}
                className="px-3 py-1.5 bg-blue-600 text-white text-xs rounded-lg hover:bg-blue-700 transition-colors font-medium shrink-0"
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
