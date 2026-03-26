"use client";

import React, { createContext, useContext, useReducer, useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import type { BuilderState, ProjectSchema, SchemaNode } from "@/types";
import {
  createNode,
  updateNodeProps,
  deleteNode,
  addNodeToParent,
  moveNode,
} from "@/lib/schemaHelpers";

// ─── Actions ──────────────────────────────────────────────────────────────────

type Action =
  | { type: "SELECT_NODE"; id: string | null }
  | { type: "ADD_NODE"; componentType: string; parentId: string | null; index?: number }
  | { type: "UPDATE_NODE_PROPS"; id: string; props: Record<string, unknown> }
  | { type: "DELETE_NODE"; id: string }
  | { type: "MOVE_NODE"; nodeId: string; newParentId: string | null; newIndex: number }
  | { type: "SET_SCHEMA"; schema: ProjectSchema }
  | { type: "SET_PROJECT_NAME"; name: string }
  | { type: "MARK_SAVED" };

// ─── Reducer ──────────────────────────────────────────────────────────────────

function builderReducer(state: BuilderState, action: Action): BuilderState {
  switch (action.type) {
    case "SELECT_NODE":
      return { ...state, selectedNodeId: action.id };

    case "ADD_NODE": {
      const newNode = createNode(action.componentType);
      const newRootNodes = addNodeToParent(
        state.schema.rootNodes,
        newNode,
        action.parentId,
        action.index
      );
      return {
        ...state,
        schema: { ...state.schema, rootNodes: newRootNodes },
        selectedNodeId: newNode.id,
        isDirty: true,
      };
    }

    case "UPDATE_NODE_PROPS": {
      const newRootNodes = updateNodeProps(
        state.schema.rootNodes,
        action.id,
        action.props
      );
      return {
        ...state,
        schema: { ...state.schema, rootNodes: newRootNodes },
        isDirty: true,
      };
    }

    case "DELETE_NODE": {
      const newRootNodes = deleteNode(state.schema.rootNodes, action.id);
      return {
        ...state,
        schema: { ...state.schema, rootNodes: newRootNodes },
        selectedNodeId:
          state.selectedNodeId === action.id ? null : state.selectedNodeId,
        isDirty: true,
      };
    }

    case "MOVE_NODE": {
      const newRootNodes = moveNode(
        state.schema.rootNodes,
        action.nodeId,
        action.newParentId,
        action.newIndex
      );
      return {
        ...state,
        schema: { ...state.schema, rootNodes: newRootNodes },
        isDirty: true,
      };
    }

    case "SET_SCHEMA":
      return {
        ...state,
        schema: action.schema,
        selectedNodeId: null,
        isDirty: false,
      };

    case "SET_PROJECT_NAME":
      return {
        ...state,
        schema: { ...state.schema, name: action.name },
        isDirty: true,
      };

    case "MARK_SAVED":
      return { ...state, isDirty: false };

    default:
      return state;
  }
}

// ─── Initial State ────────────────────────────────────────────────────────────

function createInitialState(): BuilderState {
  return {
    schema: {
      id: uuidv4(),
      name: "Untitled Project",
      description: "",
      rootNodes: [],
    },
    selectedNodeId: null,
    isDirty: false,
  };
}

// ─── Context ──────────────────────────────────────────────────────────────────

interface BuilderContextValue {
  state: BuilderState;
  dispatch: React.Dispatch<Action>;
  // Convenience helpers
  selectNode: (id: string | null) => void;
  addNode: (componentType: string, parentId: string | null, index?: number) => void;
  updateProps: (id: string, props: Record<string, unknown>) => void;
  deleteNode: (id: string) => void;
  moveNode: (nodeId: string, newParentId: string | null, newIndex: number) => void;
  setSchema: (schema: ProjectSchema) => void;
  setProjectName: (name: string) => void;
  markSaved: () => void;
  selectedNode: SchemaNode | null;
}

const BuilderContext = createContext<BuilderContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

import { findNode } from "@/lib/schemaHelpers";

export function BuilderProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(builderReducer, undefined, createInitialState);

  const selectNode = useCallback((id: string | null) => dispatch({ type: "SELECT_NODE", id }), []);
  const addNode = useCallback(
    (componentType: string, parentId: string | null, index?: number) =>
      dispatch({ type: "ADD_NODE", componentType, parentId, index }),
    []
  );
  const updateProps = useCallback(
    (id: string, props: Record<string, unknown>) =>
      dispatch({ type: "UPDATE_NODE_PROPS", id, props }),
    []
  );
  const deleteNodeCb = useCallback(
    (id: string) => dispatch({ type: "DELETE_NODE", id }),
    []
  );
  const moveNodeCb = useCallback(
    (nodeId: string, newParentId: string | null, newIndex: number) =>
      dispatch({ type: "MOVE_NODE", nodeId, newParentId, newIndex }),
    []
  );
  const setSchema = useCallback(
    (schema: ProjectSchema) => dispatch({ type: "SET_SCHEMA", schema }),
    []
  );
  const setProjectName = useCallback(
    (name: string) => dispatch({ type: "SET_PROJECT_NAME", name }),
    []
  );
  const markSaved = useCallback(() => dispatch({ type: "MARK_SAVED" }), []);

  const selectedNode = state.selectedNodeId
    ? findNode(state.schema.rootNodes, state.selectedNodeId)
    : null;

  return (
    <BuilderContext.Provider
      value={{
        state,
        dispatch,
        selectNode,
        addNode,
        updateProps,
        deleteNode: deleteNodeCb,
        moveNode: moveNodeCb,
        setSchema,
        setProjectName,
        markSaved,
        selectedNode,
      }}
    >
      {children}
    </BuilderContext.Provider>
  );
}

export function useBuilder(): BuilderContextValue {
  const ctx = useContext(BuilderContext);
  if (!ctx) throw new Error("useBuilder must be used within BuilderProvider");
  return ctx;
}
