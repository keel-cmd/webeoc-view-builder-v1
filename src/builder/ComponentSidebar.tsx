"use client";

import React from "react";
import { useDraggable } from "@dnd-kit/core";
import { getComponentsByCategory } from "@/registry";
import type { ComponentDefinition } from "@/types";

const CATEGORIES: Array<{ key: ComponentDefinition["category"]; label: string }> = [
  { key: "layout", label: "Layout" },
  { key: "form", label: "Form" },
  { key: "display", label: "Display" },
];

export function ComponentSidebar() {
  return (
    <aside className="w-56 flex-shrink-0 bg-gray-50 border-r border-gray-200 overflow-y-auto">
      <div className="p-3 border-b border-gray-200">
        <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
          Components
        </h2>
      </div>
      <div className="p-2 space-y-4">
        {CATEGORIES.map(({ key, label }) => {
          const components = getComponentsByCategory(key);
          return (
            <div key={key}>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide px-2 mb-1">
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
      className={`flex items-center gap-2 px-3 py-2 rounded cursor-grab active:cursor-grabbing text-sm bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 transition-colors select-none ${
        isDragging ? "opacity-40" : ""
      }`}
    >
      <span>{comp.icon}</span>
      <span className="text-gray-700">{comp.label}</span>
    </div>
  );
}
