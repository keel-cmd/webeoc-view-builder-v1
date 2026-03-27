"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { getComponentsByCategory } from "@/registry";
import type { ComponentDefinition } from "@/types";

const CATEGORIES: Array<{ key: ComponentDefinition["category"]; label: string; color: string }> = [
  { key: "layout", label: "Layout", color: "text-violet-400" },
  { key: "form", label: "Form Fields", color: "text-blue-400" },
  { key: "display", label: "Display", color: "text-emerald-400" },
];

export function ComponentSidebar() {
  return (
    <aside className="w-52 flex-shrink-0 bg-slate-900 border-r border-slate-800 overflow-y-auto flex flex-col">
      <div className="px-4 py-3 border-b border-slate-800 flex-shrink-0">
        <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
          Components
        </h2>
      </div>
      <div className="p-3 space-y-5 flex-1">
        {CATEGORIES.map(({ key, label, color }) => {
          const components = getComponentsByCategory(key);
          return (
            <div key={key}>
              <p className={`text-xs font-semibold uppercase tracking-widest px-1 mb-2 ${color}`}>
                {label}
              </p>
              <div className="space-y-1">
                {components.map((comp) => (
                  <DraggablePill key={comp.type} comp={comp} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </aside>
  );
}

function DraggablePill({ comp }: { comp: ComponentDefinition }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `sidebar-${comp.type}`,
    data: { source: "sidebar", componentType: comp.type },
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      className={`flex items-center gap-2 px-3 py-2 rounded-lg cursor-grab active:cursor-grabbing text-sm
        bg-slate-800 border border-slate-700
        hover:border-blue-500 hover:bg-slate-750 hover:text-white
        text-slate-300 transition-all select-none
        ${isDragging ? "opacity-40 scale-95" : ""}`}
    >
      <span className="text-base leading-none">{comp.icon}</span>
      <span className="text-xs font-medium">{comp.label}</span>
    </div>
  );
}
