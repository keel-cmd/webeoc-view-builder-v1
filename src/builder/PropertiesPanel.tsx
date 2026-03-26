"use client";

import React from "react";
import { useBuilder } from "./BuilderContext";
import { getComponent } from "@/registry";
import type { PropertyDefinition } from "@/types";

export function PropertiesPanel() {
  const { selectedNode, updateProps, deleteNode } = useBuilder();

  if (!selectedNode) {
    return (
      <aside className="w-64 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Properties
          </h2>
        </div>
        <div className="p-4 text-sm text-gray-400 text-center mt-8">
          <div className="text-2xl mb-2">🎯</div>
          Select a component to edit its properties
        </div>
      </aside>
    );
  }

  const def = getComponent(selectedNode.type);

  return (
    <aside className="w-64 flex-shrink-0 bg-white border-l border-gray-200 overflow-y-auto">
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
            Properties
          </h2>
          <p className="text-sm font-medium text-gray-800 mt-0.5">
            {def?.icon} {def?.label ?? selectedNode.type}
          </p>
        </div>
        <button
          onClick={() => deleteNode(selectedNode.id)}
          className="text-gray-400 hover:text-red-500 transition-colors text-xs"
          title="Delete component"
        >
          🗑️
        </button>
      </div>

      <div className="p-4 space-y-4">
        {def?.propertyDefinitions.map((propDef) => (
          <PropertyField
            key={propDef.key}
            propDef={propDef}
            value={selectedNode.props[propDef.key]}
            onChange={(val) => updateProps(selectedNode.id, { [propDef.key]: val })}
          />
        ))}

        {!def && (
          <p className="text-xs text-gray-400">No properties available for this component type.</p>
        )}
      </div>

      {/* Node ID (debug) */}
      <div className="px-4 pb-4">
        <p className="text-xs text-gray-300 font-mono truncate">id: {selectedNode.id}</p>
      </div>
    </aside>
  );
}

// ─── Individual property field ────────────────────────────────────────────────

interface PropertyFieldProps {
  propDef: PropertyDefinition;
  value: unknown;
  onChange: (value: unknown) => void;
}

function PropertyField({ propDef, value, onChange }: PropertyFieldProps) {
  const displayValue = value !== undefined ? value : propDef.defaultValue;

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {propDef.label}
      </label>
      {renderInput(propDef, displayValue, onChange)}
    </div>
  );
}

function renderInput(
  propDef: PropertyDefinition,
  value: unknown,
  onChange: (v: unknown) => void
) {
  switch (propDef.type) {
    case "text":
    case "textarea":
      return propDef.type === "textarea" ? (
        <textarea
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          rows={3}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      ) : (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={propDef.placeholder}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      );

    case "number":
      return (
        <input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) =>
            onChange(e.target.value === "" ? undefined : Number(e.target.value))
          }
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      );

    case "boolean":
      return (
        <label className="flex items-center gap-2 cursor-pointer">
          <div
            onClick={() => onChange(!value)}
            className={`relative w-9 h-5 rounded-full transition-colors ${
              value ? "bg-blue-500" : "bg-gray-300"
            }`}
          >
            <div
              className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                value ? "translate-x-4" : "translate-x-0.5"
              }`}
            />
          </div>
          <span className="text-sm text-gray-600">{value ? "Yes" : "No"}</span>
        </label>
      );

    case "select":
      return (
        <select
          value={(value as string) ?? propDef.defaultValue as string}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          {propDef.options?.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
      );

    case "color":
      return (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={(value as string) ?? "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="w-8 h-8 rounded cursor-pointer border border-gray-300"
          />
          <input
            type="text"
            value={(value as string) ?? "#000000"}
            onChange={(e) => onChange(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
          />
        </div>
      );

    default:
      return (
        <input
          type="text"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value)}
          className="w-full border border-gray-300 rounded px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
      );
  }
}
