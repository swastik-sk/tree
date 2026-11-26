// ============================================================
// AUTOMATED TESTS (Vitest)
// ============================================================

import { describe, test, expect, beforeEach } from 'vitest';
import {
  makeNode, makeTree, serialize, deserialize, traverse,
  treesAreEqual, countNodes, cloneTree, validateTree,
  computeLayout, toAscii
} from '../engine/treeAlgorithms';
import { BinaryTree } from '../types';

// ---- Helper builders ----
function simpleTree() {
  const d = makeNode('D');
  const b = makeNode('B', null, d);
  const c = makeNode('C');
  const a = makeNode('A', b, c);
  return makeTree(a);
}

function leftOnlyTree() {
  const b = makeNode('B');
  const a = makeNode('A', b, null);
  return makeTree(a);
}

function rightOnlyTree() {
  const b = makeNode('B');
  const a = makeNode('A', null, b);
  return makeTree(a);
}

function singleNodeTree() {
  return makeTree(makeNode('ROOT'));
}

function deepLeftTree(depth: number) {
  let node = makeNode('L0');
  for (let i = 1; i < depth; i++) {
    node = makeNode(`L${i}`, node, null);
  }
  return makeTree(node);
}

function fullTree() {
  //       A
  //      / \
  //     B   C
  //    / \ / \
  //   D  E F  G
  const d = makeNode('D'); const e = makeNode('E');
  const f = makeNode('F'); const g = makeNode('G');
  const b = makeNode('B', d, e);
  const c = makeNode('C', f, g);
  const a = makeNode('A', b, c);
  return makeTree(a);
}

// ============================================================
describe('1. Empty tree', () => {
  test('serialize empty tree gives #', () => {
    const t = makeTree(null);
    const r = serialize(t);
    expect(r.success).toBe(true);
    expect(r.text).toBe('#');
    expect(r.nodeCount).toBe(0);
  });

  test('deserialize # gives empty tree', () => {
    const r = deserialize('#');
    expect(r.success).toBe(true);
    expect(r.tree?.root).toBeNull();
  });

  test('traversal of empty tree is empty', () => {
    const t = makeTree(null);
    for (const type of ['preorder', 'inorder', 'postorder', 'levelorder'] as const) {
      expect(traverse(t, type).sequence).toEqual([]);
    }
  });
});

// ============================================================
describe('2. Single-node tree', () => {
  test('serialize single node', () => {
    const t = singleNodeTree();
    const r = serialize(t);
    expect(r.text).toBe('ROOT # #');
    expect(r.nodeCount).toBe(1);
  });

  test('deserialize single node', () => {
    const r = deserialize('ROOT # #');
    expect(r.success).toBe(true);
    expect(r.tree?.root?.label).toBe('ROOT');
    expect(r.tree?.root?.left).toBeNull();
    expect(r.tree?.root?.right).toBeNull();
  });

  test('all traversals give [ROOT]', () => {
    const t = singleNodeTree();
    for (const type of ['preorder', 'inorder', 'postorder', 'levelorder'] as const) {
      expect(traverse(t, type).sequence).toEqual(['ROOT']);
    }
  });
});

// ============================================================
describe('3. Complete / full tree (7 nodes)', () => {
  test('node count', () => { expect(countNodes(fullTree().root)).toBe(7); });

  test('preorder: A B D E C F G', () => {
    expect(traverse(fullTree(), 'preorder').sequence).toEqual(['A','B','D','E','C','F','G']);
  });

  test('inorder: D B E A F C G', () => {
    expect(traverse(fullTree(), 'inorder').sequence).toEqual(['D','B','E','A','F','C','G']);
  });

  test('postorder: D E B F G C A', () => {
    expect(traverse(fullTree(), 'postorder').sequence).toEqual(['D','E','B','F','G','C','A']);
  });

  test('levelorder: A B C D E F G', () => {
    expect(traverse(fullTree(), 'levelorder').sequence).toEqual(['A','B','C','D','E','F','G']);
  });
});

// ============================================================
describe('4. Left-only child', () => {
  test('serialize preserves left-only structure', () => {
    const t = leftOnlyTree();
    const r = serialize(t);
    expect(r.text).toBe('A B # # #');
  });

  test('round-trip left-only', () => {
    const t = leftOnlyTree();
    const { text } = serialize(t);
    const restored = deserialize(text);
    expect(restored.success).toBe(true);
    expect(treesAreEqual(t.root, restored.tree!.root)).toBe(true);
  });

  test('inorder left-only: B A', () => {
    expect(traverse(leftOnlyTree(), 'inorder').sequence).toEqual(['B','A']);
  });
});

// ============================================================
describe('5. Right-only child', () => {
  test('serialize preserves right-only: A # B # #', () => {
    expect(serialize(rightOnlyTree()).text).toBe('A # B # #');
  });

  test('round-trip right-only', () => {
    const t = rightOnlyTree();
    const rt = deserialize(serialize(t).text);
    expect(treesAreEqual(t.root, rt.tree!.root)).toBe(true);
  });

  test('left-only vs right-only are distinct', () => {
    const lo = serialize(leftOnlyTree()).text;
    const ro = serialize(rightOnlyTree()).text;
    expect(lo).not.toBe(ro);
  });
});

// ============================================================
describe('6. Deep unbalanced tree', () => {
  test('10-level left spine round-trip', () => {
    const t = deepLeftTree(10);
    const { text } = serialize(t);
    const rt = deserialize(text);
    expect(rt.success).toBe(true);
    expect(treesAreEqual(t.root, rt.tree!.root)).toBe(true);
  });
});

// ============================================================
describe('7. Multiple absent branches', () => {
  test('serialize tree with right-then-left children', () => {
    // A(null, B(C, null))
    const c = makeNode('C');
    const b = makeNode('B', c, null);
    const a = makeNode('A', null, b);
    const t = makeTree(a);
    expect(serialize(t).text).toBe('A # B C # # #');
  });

  test('round-trip complex absent branches', () => {
    const c = makeNode('C');
    const b = makeNode('B', c, null);
    const a = makeNode('A', null, b);
    const t = makeTree(a);
    const rt = deserialize(serialize(t).text);
    expect(treesAreEqual(t.root, rt.tree!.root)).toBe(true);
  });
});

// ============================================================
describe('8. 2000-node limit', () => {
  function buildChain(n: number) {
    let node = makeNode('N0');
    const root = node;
    for (let i = 1; i < n; i++) {
      const next = makeNode(`N${i}`);
      node.left = next;
      node = next;
    }
    return makeTree(root);
  }

  test('2000-node tree serializes successfully', () => {
    const t = buildChain(2000);
    const r = serialize(t);
    expect(r.success).toBe(true);
    expect(r.nodeCount).toBe(2000);
  });

  test('2001-node tree fails serialization', () => {
    const t = buildChain(2001);
    const r = serialize(t);
    expect(r.success).toBe(false);
  });
});

// ============================================================
describe('9. Serialization', () => {
  test('preorder text matches manual computation', () => {
    const t = simpleTree(); // A(B(null,D),C) => A B # D # # C # #
    expect(serialize(t).text).toBe('A B # D # # C # #');
  });

  test('deterministic: same tree same text', () => {
    const t1 = simpleTree();
    const t2 = simpleTree();
    expect(serialize(t1).text).toBe(serialize(t2).text);
  });
});

// ============================================================
describe('10. Deserialization', () => {
  test('restores node labels', () => {
    const r = deserialize('X Y # # Z # #');
    expect(r.tree?.root?.label).toBe('X');
    expect(r.tree?.root?.left?.label).toBe('Y');
    expect(r.tree?.root?.right?.label).toBe('Z');
  });

  test('restores null positions correctly', () => {
    const r = deserialize('A # B # #'); // right-only
    expect(r.tree?.root?.left).toBeNull();
    expect(r.tree?.root?.right?.label).toBe('B');
  });
});

// ============================================================
describe('11. Round-trip restoration', () => {
  test('full tree round-trip', () => {
    const original = fullTree();
    const { text } = serialize(original);
    const restored = deserialize(text);
    expect(restored.success).toBe(true);
    expect(treesAreEqual(original.root, restored.tree!.root)).toBe(true);
  });

  test('memory-clear round-trip: original destroyed', () => {
    const original = fullTree();
    const { text } = serialize(original);
    // Simulate memory clear by not using original anymore
    let cleared: BinaryTree = makeTree(null); // = "original cleared"
    expect(cleared.root).toBeNull();
    // Restore from text alone
    const restored = deserialize(text);
    expect(restored.success).toBe(true);
    expect(treesAreEqual(fullTree().root, restored.tree!.root)).toBe(true);
  });
});

// ============================================================
describe('12-14. Traversal verification', () => {
  test('preorder of simpleTree: A B D C', () => {
    expect(traverse(simpleTree(), 'preorder').sequence).toEqual(['A','B','D','C']);
  });
  test('inorder of simpleTree: B D A C', () => {
    expect(traverse(simpleTree(), 'inorder').sequence).toEqual(['B','D','A','C']);
  });
  test('postorder of simpleTree: D B C A', () => {
    expect(traverse(simpleTree(), 'postorder').sequence).toEqual(['D','B','C','A']);
  });
  test('round-trip preserves all three traversals', () => {
    const t = simpleTree();
    const rt = deserialize(serialize(t).text).tree!;
    for (const type of ['preorder', 'inorder', 'postorder'] as const) {
      expect(traverse(rt, type).sequence).toEqual(traverse(t, type).sequence);
    }
  });
});

// ============================================================
describe('15. Invalid token detection', () => {
  test('invalid label character rejected', () => {
    const r = deserialize('A !INVALID! # #');
    expect(r.success).toBe(false);
    expect(r.error).toContain('Invalid label');
  });

  test('empty label rejected', () => {
    const r = deserialize('A  B # #'); // double space → empty token
    // double space splits into ['A','','B','#','#'], '' is invalid
    expect(r.success).toBe(false);
  });
});

// ============================================================
describe('16. Missing token detection', () => {
  test('truncated archive rejected', () => {
    const r = deserialize('A B # #'); // should be 'A B # # ...'
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/missing|incomplete/i);
  });

  test('single token non-null: needs 2 children', () => {
    const r = deserialize('A');
    expect(r.success).toBe(false);
  });
});

// ============================================================
describe('17. Extra token detection', () => {
  test('extra token at end rejected', () => {
    const r = deserialize('A # # EXTRA');
    expect(r.success).toBe(false);
    expect(r.error).toMatch(/extra/i);
  });

  test('extra token in middle rejected', () => {
    const r = deserialize('A B # # EXTRA C # #');
    expect(r.success).toBe(false);
  });
});

// ============================================================
describe('18. Truncated export', () => {
  test('half-way truncated archive', () => {
    const t = fullTree();
    const { text } = serialize(t);
    const tokens = text.split(' ');
    const half = tokens.slice(0, Math.floor(tokens.length / 2)).join(' ');
    const r = deserialize(half);
    expect(r.success).toBe(false);
  });
});

// ============================================================
describe('19. Structural comparison', () => {
  test('same tree = equal', () => {
    expect(treesAreEqual(fullTree().root, fullTree().root)).toBe(true);
  });

  test('mirrored tree ≠ original', () => {
    // Mirror left↔right
    const t = fullTree();
    const { text } = serialize(t);
    // Manually swap: A C B ... would change structure
    const t2 = deserialize('A C # # B # #').tree!;
    expect(treesAreEqual(t.root, t2.root)).toBe(false);
  });
});

// ============================================================
describe('20. Cyclic tree rejection', () => {
  test('direct cycle detected', () => {
    const a = makeNode('A');
    a.left = a; // cycle!
    expect(validateTree(a).valid).toBe(false);
  });
});

// ============================================================
describe('21. Invalid parent relationships', () => {
  test('node with two parents: validateTree false', () => {
    const c = makeNode('C');
    const b = makeNode('B', c, null);
    const a = makeNode('A', b, c); // c appears twice
    // This creates a "DAG" not a tree
    // validateTree detects this via seen set
    expect(validateTree(a).valid).toBe(false);
  });
});

// ============================================================
describe('Fundamental Test: Original → Serialize → Delete → Deserialize → Verify', () => {
  test('complete pipeline with structural and traversal verification', () => {
    // Build original
    const original = fullTree();
    const preOriginal = traverse(original, 'preorder').sequence;
    const inOriginal = traverse(original, 'inorder').sequence;
    const postOriginal = traverse(original, 'postorder').sequence;

    // Serialize
    const { text, success } = serialize(original);
    expect(success).toBe(true);

    // "Delete" original — in real code, we don't use `original` after this
    // We only use `text`
    const restored = deserialize(text);
    expect(restored.success).toBe(true);

    const rt = restored.tree!;
    // Structural comparison
    expect(treesAreEqual(original.root, rt.root)).toBe(true);

    // Traversal comparisons
    expect(traverse(rt, 'preorder').sequence).toEqual(preOriginal);
    expect(traverse(rt, 'inorder').sequence).toEqual(inOriginal);
    expect(traverse(rt, 'postorder').sequence).toEqual(postOriginal);
  });
});
