"use client";

import React, { useState, useEffect } from "react";
import { v4 as uuidv4 } from "uuid";
import type { LinkResource, ScriptResource, ViewTypeDefaults } from "@/types";
import { getViewTypeDefaults, saveViewTypeDefaults, resetViewTypeDefaults } from "@/lib/viewTypeDefaults";

// ─── View type tabs config (mirrors BuilderShell VIEW_TYPES) ─────────────────

const TABS = [
  { id: "input", label: "Input View" },
];

// ─── Modal ───────────────────────────────────────────────────────────────────

export function ViewTypeSettingsModal({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState(TABS[0].id);
  const [defaults, setDefaults] = useState<ViewTypeDefaults>({ links: [], scripts: [] });
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    setDefaults(getViewTypeDefaults(activeTab));
    setDirty(false);
  }, [activeTab]);

  function update(next: ViewTypeDefaults) {
    setDefaults(next);
    setDirty(true);
  }

  function handleSave() {
    saveViewTypeDefaults(activeTab, defaults);
    setDirty(false);
  }

  function handleReset() {
    if (!confirm("Reset to built-in defaults for this view type?")) return;
    resetViewTypeDefaults(activeTab);
    setDefaults(getViewTypeDefaults(activeTab));
    setDirty(false);
  }

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 flex-shrink-0">
          <h2 className="font-semibold text-white text-lg">View Type Settings</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 text-xl leading-none">✕</button>
        </div>

        {/* Tab bar */}
        <div className="flex gap-1 px-6 pt-4 flex-shrink-0">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-4 py-1.5 rounded-t-lg text-sm font-medium transition-colors ${
                activeTab === t.id
                  ? "bg-gray-800 text-white border border-b-0 border-gray-700"
                  : "text-gray-400 hover:text-gray-200"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto bg-gray-800 border border-gray-700 mx-6 rounded-b-lg rounded-tr-lg p-5 space-y-6">
          <LinkSection
            links={defaults.links}
            onChange={(links) => update({ ...defaults, links })}
          />
          <ScriptSection
            scripts={defaults.scripts}
            onChange={(scripts) => update({ ...defaults, scripts })}
          />
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-gray-700 flex-shrink-0">
          <button
            onClick={handleReset}
            className="text-xs text-gray-500 hover:text-red-400 transition-colors"
          >
            Reset to defaults
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm text-gray-300 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!dirty}
              className="px-4 py-1.5 text-sm bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-lg font-medium transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Link section ─────────────────────────────────────────────────────────────

function LinkSection({
  links,
  onChange,
}: {
  links: LinkResource[];
  onChange: (links: LinkResource[]) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  function addLink() {
    const id = uuidv4();
    onChange([...links, { id, sourceType: "boardresource", source: "", rel: "stylesheet" }]);
    setEditing(id);
  }

  function updateLink(id: string, patch: Partial<LinkResource>) {
    onChange(links.map((l) => (l.id === id ? { ...l, ...patch } : l)));
  }

  function deleteLink(id: string) {
    onChange(links.filter((l) => l.id !== id));
    if (editing === id) setEditing(null);
  }

  function moveLink(id: string, dir: -1 | 1) {
    const idx = links.findIndex((l) => l.id === id);
    if (idx < 0) return;
    const next = [...links];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200">
          &lt;link&gt; elements
          <span className="ml-2 text-xs font-normal text-gray-500">added after base template links</span>
        </h3>
        <button
          onClick={addLink}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
        >
          + Add Link
        </button>
      </div>

      {links.length === 0 && (
        <p className="text-xs text-gray-500 italic">No custom links configured.</p>
      )}

      <div className="space-y-2">
        {links.map((link, idx) => (
          <div key={link.id} className="bg-gray-700 rounded-lg overflow-hidden">
            {/* Summary row */}
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-650"
              onClick={() => setEditing(editing === link.id ? null : link.id)}
            >
              <span className="text-xs bg-blue-900 text-blue-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                {link.sourceType}
              </span>
              <span className="text-xs text-gray-200 truncate flex-1 font-mono">
                {link.source || <span className="text-gray-500 italic">empty</span>}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                <button onClick={(e) => { e.stopPropagation(); moveLink(link.id, -1); }} disabled={idx === 0} className="text-gray-500 hover:text-gray-300 disabled:opacity-20 text-xs px-1">↑</button>
                <button onClick={(e) => { e.stopPropagation(); moveLink(link.id, 1); }} disabled={idx === links.length - 1} className="text-gray-500 hover:text-gray-300 disabled:opacity-20 text-xs px-1">↓</button>
                <button onClick={(e) => { e.stopPropagation(); deleteLink(link.id); }} className="text-gray-500 hover:text-red-400 text-xs px-1 ml-1">✕</button>
              </div>
            </div>

            {/* Edit form */}
            {editing === link.id && (
              <div className="border-t border-gray-600 p-3 grid grid-cols-2 gap-3">
                <FieldRow label="Source type">
                  <select
                    value={link.sourceType}
                    onChange={(e) => updateLink(link.id, { sourceType: e.target.value as "boardresource" | "href" })}
                    className="input-field"
                  >
                    <option value="boardresource">boardresource</option>
                    <option value="href">href (URL)</option>
                  </select>
                </FieldRow>
                <FieldRow label={link.sourceType === "boardresource" ? "boardresource" : "href"}>
                  <input
                    type="text"
                    value={link.source}
                    onChange={(e) => updateLink(link.id, { source: e.target.value })}
                    className="input-field"
                    placeholder={link.sourceType === "boardresource" ? "pcem-input.css" : "https://..."}
                  />
                </FieldRow>
                <FieldRow label="rel">
                  <input
                    type="text"
                    value={link.rel ?? "stylesheet"}
                    onChange={(e) => updateLink(link.id, { rel: e.target.value })}
                    className="input-field"
                  />
                </FieldRow>
                <FieldRow label="type (optional)">
                  <input
                    type="text"
                    value={link.type ?? ""}
                    onChange={(e) => updateLink(link.id, { type: e.target.value || undefined })}
                    className="input-field"
                    placeholder="text/css"
                  />
                </FieldRow>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Script section ───────────────────────────────────────────────────────────

function ScriptSection({
  scripts,
  onChange,
}: {
  scripts: ScriptResource[];
  onChange: (scripts: ScriptResource[]) => void;
}) {
  const [editing, setEditing] = useState<string | null>(null);

  function addScript() {
    const id = uuidv4();
    onChange([...scripts, { id, sourceType: "src", source: "" }]);
    setEditing(id);
  }

  function updateScript(id: string, patch: Partial<ScriptResource>) {
    onChange(scripts.map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }

  function deleteScript(id: string) {
    onChange(scripts.filter((s) => s.id !== id));
    if (editing === id) setEditing(null);
  }

  function moveScript(id: string, dir: -1 | 1) {
    const idx = scripts.findIndex((s) => s.id === id);
    if (idx < 0) return;
    const next = [...scripts];
    const swap = idx + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap], next[idx]];
    onChange(next);
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200">
          &lt;script&gt; elements
          <span className="ml-2 text-xs font-normal text-gray-500">added after base template scripts</span>
        </h3>
        <button
          onClick={addScript}
          className="px-3 py-1 text-xs bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors"
        >
          + Add Script
        </button>
      </div>

      {scripts.length === 0 && (
        <p className="text-xs text-gray-500 italic">No custom scripts configured.</p>
      )}

      <div className="space-y-2">
        {scripts.map((script, idx) => (
          <div key={script.id} className="bg-gray-700 rounded-lg overflow-hidden">
            {/* Summary row */}
            <div
              className="flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-gray-650"
              onClick={() => setEditing(editing === script.id ? null : script.id)}
            >
              <span className="text-xs bg-purple-900 text-purple-300 px-1.5 py-0.5 rounded font-mono shrink-0">
                {script.sourceType}
              </span>
              <span className="text-xs text-gray-200 truncate flex-1 font-mono">
                {script.source || <span className="text-gray-500 italic">empty</span>}
              </span>
              <div className="flex items-center gap-1 shrink-0">
                {script.async && <span className="text-xs text-yellow-500" title="async">async</span>}
                {script.defer && <span className="text-xs text-yellow-500" title="defer">defer</span>}
                {script.dstGlobal && <span className="text-xs text-orange-400" title="data-dst-global">dst</span>}
                <button onClick={(e) => { e.stopPropagation(); moveScript(script.id, -1); }} disabled={idx === 0} className="text-gray-500 hover:text-gray-300 disabled:opacity-20 text-xs px-1">↑</button>
                <button onClick={(e) => { e.stopPropagation(); moveScript(script.id, 1); }} disabled={idx === scripts.length - 1} className="text-gray-500 hover:text-gray-300 disabled:opacity-20 text-xs px-1">↓</button>
                <button onClick={(e) => { e.stopPropagation(); deleteScript(script.id); }} className="text-gray-500 hover:text-red-400 text-xs px-1 ml-1">✕</button>
              </div>
            </div>

            {/* Edit form */}
            {editing === script.id && (
              <div className="border-t border-gray-600 p-3 grid grid-cols-2 gap-3">
                <FieldRow label="Source type">
                  <select
                    value={script.sourceType}
                    onChange={(e) => updateScript(script.id, { sourceType: e.target.value as "boardresource" | "src" })}
                    className="input-field"
                  >
                    <option value="src">src (URL)</option>
                    <option value="boardresource">boardresource</option>
                  </select>
                </FieldRow>
                <FieldRow label={script.sourceType === "boardresource" ? "boardresource" : "src"}>
                  <input
                    type="text"
                    value={script.source}
                    onChange={(e) => updateScript(script.id, { source: e.target.value })}
                    className="input-field"
                    placeholder={script.sourceType === "boardresource" ? "pcem-utils.js" : "https://..."}
                  />
                </FieldRow>
                <FieldRow label="type (optional)">
                  <input
                    type="text"
                    value={script.type ?? ""}
                    onChange={(e) => updateScript(script.id, { type: e.target.value || undefined })}
                    className="input-field"
                    placeholder="text/javascript"
                  />
                </FieldRow>
                <FieldRow label="crossorigin (optional)">
                  <input
                    type="text"
                    value={script.crossorigin ?? ""}
                    onChange={(e) => updateScript(script.id, { crossorigin: e.target.value || undefined })}
                    className="input-field"
                    placeholder="anonymous"
                  />
                </FieldRow>
                <FieldRow label="integrity (optional)" className="col-span-2">
                  <input
                    type="text"
                    value={script.integrity ?? ""}
                    onChange={(e) => updateScript(script.id, { integrity: e.target.value || undefined })}
                    className="input-field"
                    placeholder="sha384-..."
                  />
                </FieldRow>
                <FieldRow label="referrerpolicy (optional)">
                  <input
                    type="text"
                    value={script.referrerpolicy ?? ""}
                    onChange={(e) => updateScript(script.id, { referrerpolicy: e.target.value || undefined })}
                    className="input-field"
                    placeholder="no-referrer"
                  />
                </FieldRow>
                <FieldRow label="Flags">
                  <div className="flex gap-3 items-center h-full">
                    <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                      <input type="checkbox" checked={script.async ?? false} onChange={(e) => updateScript(script.id, { async: e.target.checked || undefined })} />
                      async
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                      <input type="checkbox" checked={script.defer ?? false} onChange={(e) => updateScript(script.id, { defer: e.target.checked || undefined })} />
                      defer
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-300 cursor-pointer">
                      <input type="checkbox" checked={script.dstGlobal ?? false} onChange={(e) => updateScript(script.id, { dstGlobal: e.target.checked || undefined })} />
                      data-dst-global
                    </label>
                  </div>
                </FieldRow>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Shared helpers ───────────────────────────────────────────────────────────

function FieldRow({
  label,
  children,
  className,
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="block text-xs text-gray-400 mb-1">{label}</label>
      {children}
    </div>
  );
}
