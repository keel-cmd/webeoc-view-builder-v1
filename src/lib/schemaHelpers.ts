import { v4 as uuidv4 } from "uuid";
import type { SchemaNode } from "@/types";
import { getComponent } from "@/registry";

// ─── Node CRUD helpers ────────────────────────────────────────────────────────

export function createNode(type: string, overrideProps?: Record<string, unknown>): SchemaNode {
  const def = getComponent(type);
  return {
    id: uuidv4(),
    type,
    props: { ...(def?.defaultProps ?? {}), ...(overrideProps ?? {}) },
    children: def?.acceptsChildren ? [] : undefined,
  };
}

/** Deep-clone a list of nodes */
export function cloneNodes(nodes: SchemaNode[]): SchemaNode[] {
  return JSON.parse(JSON.stringify(nodes)) as SchemaNode[];
}

/** Find a node by ID (deep) */
export function findNode(nodes: SchemaNode[], id: string): SchemaNode | null {
  for (const node of nodes) {
    if (node.id === id) return node;
    if (node.children) {
      const found = findNode(node.children, id);
      if (found) return found;
    }
  }
  return null;
}

/** Update a node's props by ID (returns new root array) */
export function updateNodeProps(
  nodes: SchemaNode[],
  id: string,
  props: Record<string, unknown>
): SchemaNode[] {
  return nodes.map((node) => {
    if (node.id === id) {
      return { ...node, props: { ...node.props, ...props } };
    }
    if (node.children) {
      return { ...node, children: updateNodeProps(node.children, id, props) };
    }
    return node;
  });
}

/** Delete a node by ID (returns new root array) */
export function deleteNode(nodes: SchemaNode[], id: string): SchemaNode[] {
  return nodes
    .filter((node) => node.id !== id)
    .map((node) =>
      node.children
        ? { ...node, children: deleteNode(node.children, id) }
        : node
    );
}

/** Add a node to a parent's children (or root if parentId is null) */
export function addNodeToParent(
  nodes: SchemaNode[],
  newNode: SchemaNode,
  parentId: string | null,
  index?: number
): SchemaNode[] {
  if (parentId === null) {
    const clone = [...nodes];
    if (index !== undefined) {
      clone.splice(index, 0, newNode);
    } else {
      clone.push(newNode);
    }
    return clone;
  }
  return nodes.map((node) => {
    if (node.id === parentId && node.children) {
      const clone = [...node.children];
      if (index !== undefined) {
        clone.splice(index, 0, newNode);
      } else {
        clone.push(newNode);
      }
      return { ...node, children: clone };
    }
    if (node.children) {
      return { ...node, children: addNodeToParent(node.children, newNode, parentId, index) };
    }
    return node;
  });
}

/** Move a node from its current parent to a new parent at a given index */
export function moveNode(
  nodes: SchemaNode[],
  nodeId: string,
  newParentId: string | null,
  newIndex: number
): SchemaNode[] {
  const node = findNode(nodes, nodeId);
  if (!node) return nodes;
  const without = deleteNode(nodes, nodeId);
  return addNodeToParent(without, node, newParentId, newIndex);
}
