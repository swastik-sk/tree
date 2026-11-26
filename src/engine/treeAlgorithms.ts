// ============================================================
// BINARY TREE CORE ALGORITHMS
// Serialization, Deserialization, Traversals, Validation
// ============================================================

import type {
  BinaryTree, TreeNode, TraversalType, TraversalResult, TraversalStep,
  SerializationResult, DeserializationResult, ValidationError
} from '../types';

const NULL_MARKER = '#';
const MAX_NODES = 2000;
const LABEL_PATTERN = /^[A-Za-z0-9_\-\.]{1,20}$/;

// ---- ID generation ----
let _idCounter = 0;
export function newId(): string {
  _idCounter++;
  return `node_${_idCounter}_${Date.now()}`;
}

// ---- Build helpers ----
export function makeNode(label: string, left: TreeNode | null = null, right: TreeNode | null = null): TreeNode {
  return { id: newId(), label, left, right, metadata: {} };
}

export function makeTree(root: TreeNode | null): BinaryTree {
  return { root, size: countNodes(root) };
}

export function countNodes(node: TreeNode | null): number {
  if (!node) return 0;
  return 1 + countNodes(node.left) + countNodes(node.right);
}

export function cloneNode(node: TreeNode | null): TreeNode | null {
  if (!node) return null;
  return {
    id: newId(),
    label: node.label,
    left: cloneNode(node.left),
    right: cloneNode(node.right),
    metadata: { ...node.metadata },
  };
}

export function cloneTree(tree: BinaryTree): BinaryTree {
  const root = cloneNode(tree.root);
  return { root, size: countNodes(root) };
}

// ---- Serialization (Preorder with null markers) ----
export function serialize(tree: BinaryTree): SerializationResult {
  if (!tree.root) {
    return { success: true, text: NULL_MARKER, nodeCount: 0 };
  }
  const tokens: string[] = [];
  let nodeCount = 0;

  function recurse(node: TreeNode | null): void {
    if (!node) {
      tokens.push(NULL_MARKER);
      return;
    }
    nodeCount++;
    if (nodeCount > MAX_NODES) throw new Error('Tree exceeds 2000-node limit');
    tokens.push(node.label);
    recurse(node.left);
    recurse(node.right);
  }

  try {
    recurse(tree.root);
    return { success: true, text: tokens.join(' '), nodeCount };
  } catch (e: unknown) {
    return { success: false, text: '', nodeCount: 0, error: (e as Error).message };
  }
}

// ---- Deserialization ----
export function deserialize(text: string): DeserializationResult {
  const raw = text.trim();
  if (!raw) {
    return { success: false, tree: null, error: 'Empty input', errorDetail: 'The archive text is empty. Nothing to restore.' };
  }

  const tokens = raw.split(/\s+/);

  // Validate tokens
  const validationError = validateTokens(tokens);
  if (validationError) {
    return {
      success: false, tree: null,
      error: validationError.message,
      errorDetail: validationError.suggestion,
    };
  }

  let index = 0;
  let nodeCount = 0;

  function recurse(): TreeNode | null {
    if (index >= tokens.length) {
      throw new Error(`MISSING_TOKEN:Token expected at position ${index + 1} but archive text ended prematurely.`);
    }
    const token = tokens[index++];
    if (token === NULL_MARKER) return null;
    nodeCount++;
    if (nodeCount > MAX_NODES) {
      throw new Error('TOO_LARGE:Tree exceeds the 2000-node limit.');
    }
    const left = recurse();
    const right = recurse();
    return makeNode(token, left, right);
  }

  try {
    const root = recurse();
    if (index !== tokens.length) {
      return {
        success: false, tree: null,
        error: 'Extra tokens detected',
        errorDetail: `The archive has ${tokens.length - index} extra token(s) after a complete tree was parsed. This may indicate a corrupted or merged archive.`,
      };
    }
    const tree = makeTree(root);
    return { success: true, tree };
  } catch (e: unknown) {
    const msg = (e as Error).message;
    if (msg.startsWith('MISSING_TOKEN:')) {
      return { success: false, tree: null, error: 'Missing token', errorDetail: msg.slice('MISSING_TOKEN:'.length) };
    }
    if (msg.startsWith('TOO_LARGE:')) {
      return { success: false, tree: null, error: 'Tree too large', errorDetail: msg.slice('TOO_LARGE:'.length) };
    }
    return { success: false, tree: null, error: 'Deserialization failed', errorDetail: msg };
  }
}

function validateTokens(tokens: string[]): ValidationError | null {
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (t === NULL_MARKER) continue;
    if (!LABEL_PATTERN.test(t)) {
      return {
        type: 'invalid_label',
        message: `Invalid label "${t}" at position ${i + 1}`,
        suggestion: `Node labels must be 1–20 alphanumeric characters, underscores, hyphens or dots. "${t}" does not match this format.`,
        position: i,
      };
    }
  }
  // Check structural validity by counting: each non-null needs 2 children slots
  let required = 1;
  for (let i = 0; i < tokens.length; i++) {
    if (required === 0) {
      return {
        type: 'extra_token',
        message: `Extra token "${tokens[i]}" at position ${i + 1}`,
        suggestion: 'The archive contains more tokens than a valid tree requires. Remove excess tokens or check for a merged archive.',
        position: i,
      };
    }
    if (tokens[i] === NULL_MARKER) {
      required--;
    } else {
      required += 1; // adds 2 children slots, removes 1 current = net +1
    }
  }
  if (required !== 0) {
    return {
      type: 'missing_token',
      message: `Archive is incomplete: ${required} token(s) missing`,
      suggestion: 'The archive text ends before all branches are described. Each node needs both a left and right child entry (use # for absent children).',
    };
  }
  return null;
}

// ---- Traversals ----
export function traverse(tree: BinaryTree, type: TraversalType): TraversalResult {
  const sequence: string[] = [];
  const steps: TraversalStep[] = [];

  function addStep(node: TreeNode) {
    steps.push({ nodeId: node.id, label: node.label, stepIndex: steps.length, traversalType: type });
    sequence.push(node.label);
  }

  function preorder(node: TreeNode | null) {
    if (!node) return;
    addStep(node);
    preorder(node.left);
    preorder(node.right);
  }

  function inorder(node: TreeNode | null) {
    if (!node) return;
    inorder(node.left);
    addStep(node);
    inorder(node.right);
  }

  function postorder(node: TreeNode | null) {
    if (!node) return;
    postorder(node.left);
    postorder(node.right);
    addStep(node);
  }

  function levelorder(root: TreeNode | null) {
    if (!root) return;
    const queue: TreeNode[] = [root];
    while (queue.length > 0) {
      const node = queue.shift()!;
      addStep(node);
      if (node.left) queue.push(node.left);
      if (node.right) queue.push(node.right);
    }
  }

  switch (type) {
    case 'preorder': preorder(tree.root); break;
    case 'inorder': inorder(tree.root); break;
    case 'postorder': postorder(tree.root); break;
    case 'levelorder': levelorder(tree.root); break;
  }

  return { sequence, steps };
}

// ---- Structural equality (not just traversal comparison) ----
export function treesAreEqual(a: TreeNode | null, b: TreeNode | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return a.label === b.label && treesAreEqual(a.left, b.left) && treesAreEqual(a.right, b.right);
}

// ---- Find node by ID ----
export function findNode(root: TreeNode | null, id: string): TreeNode | null {
  if (!root) return null;
  if (root.id === id) return root;
  return findNode(root.left, id) || findNode(root.right, id);
}

// ---- Find parent of a node ----
export function findParent(root: TreeNode | null, childId: string): { node: TreeNode; side: 'left' | 'right' } | null {
  if (!root) return null;
  if (root.left?.id === childId) return { node: root, side: 'left' };
  if (root.right?.id === childId) return { node: root, side: 'right' };
  return findParent(root.left, childId) || findParent(root.right, childId);
}

// ---- Get all nodes as flat array ----
export function getAllNodes(root: TreeNode | null): TreeNode[] {
  if (!root) return [];
  return [root, ...getAllNodes(root.left), ...getAllNodes(root.right)];
}

// ---- Validate tree integrity (no cycles, single root) ----
export function validateTree(root: TreeNode | null): { valid: boolean; error?: string } {
  const seen = new Set<string>();
  function check(node: TreeNode | null): boolean {
    if (!node) return true;
    if (seen.has(node.id)) return false;
    seen.add(node.id);
    return check(node.left) && check(node.right);
  }
  if (!check(root)) return { valid: false, error: 'Cycle detected in tree structure' };
  return { valid: true };
}

// ---- ASCII tree representation ----
export function toAscii(node: TreeNode | null, prefix = '', isLeft = true): string {
  if (!node) return '';
  let result = '';
  if (node.right) {
    result += toAscii(node.right, prefix + (isLeft ? '│   ' : '    '), false);
  }
  result += prefix + (isLeft ? '└── ' : '┌── ') + node.label + '\n';
  if (node.left) {
    result += toAscii(node.left, prefix + (isLeft ? '    ' : '│   '), true);
  }
  return result;
}

// ---- Generate damaged archive text for testing ----
export function damageArchive(text: string, damageType: 'missing_null' | 'extra_token' | 'invalid_label' | 'truncate'): string {
  const tokens = text.split(' ');
  switch (damageType) {
    case 'missing_null': {
      const idx = tokens.findIndex(t => t === NULL_MARKER);
      if (idx >= 0) tokens.splice(idx, 1);
      break;
    }
    case 'extra_token': {
      tokens.splice(Math.floor(tokens.length / 2), 0, 'GHOST');
      break;
    }
    case 'invalid_label': {
      const idx = tokens.findIndex(t => t !== NULL_MARKER);
      if (idx >= 0) tokens[idx] = '!@@INVALID@@!';
      break;
    }
    case 'truncate': {
      tokens.splice(Math.floor(tokens.length * 0.6));
      break;
    }
  }
  return tokens.join(' ');
}

// ---- Compute layout positions for SVG rendering ----
interface LayoutNode { id: string; label: string; x: number; y: number; left: string | null; right: string | null; }
export function computeLayout(root: TreeNode | null, width = 800): LayoutNode[] {
  const nodes: LayoutNode[] = [];
  if (!root) return nodes;

  const LEVEL_HEIGHT = 90;
  const MIN_HSEP = 50;

  // Compute subtree widths
  const widths = new Map<string, number>();
  function getWidth(node: TreeNode | null): number {
    if (!node) return 0;
    const lw = getWidth(node.left);
    const rw = getWidth(node.right);
    const w = Math.max(MIN_HSEP * 2, lw + rw + MIN_HSEP);
    widths.set(node.id, w);
    return w;
  }
  getWidth(root);

  function assign(node: TreeNode | null, cx: number, cy: number): void {
    if (!node) return;
    const lw = widths.get(node.left?.id ?? '') ?? 0;
    const rw = widths.get(node.right?.id ?? '') ?? 0;
    const lx = cx - (lw / 2 + MIN_HSEP / 2);
    const rx = cx + (rw / 2 + MIN_HSEP / 2);

    nodes.push({
      id: node.id,
      label: node.label,
      x: cx,
      y: cy,
      left: node.left?.id ?? null,
      right: node.right?.id ?? null,
    });

    assign(node.left, lx, cy + LEVEL_HEIGHT);
    assign(node.right, rx, cy + LEVEL_HEIGHT);
  }

  assign(root, width / 2, 50);
  return nodes;
}
