// ============================================================
// INTERACTIVE SVG BINARY TREE CANVAS
// ============================================================

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { computeLayout, findNode, getAllNodes } from '../engine/treeAlgorithms';
import type { BinaryTree, TreeNode } from '../types';
import { useGameStore } from '../store/gameStore';

interface Props {
  tree: BinaryTree;
  onNodeClick?: (nodeId: string) => void;
  onNodeDoubleClick?: (nodeId: string) => void;
  highlightedNodeIds?: Set<string>;
  traversalActiveId?: string | null;
  visitedIds?: Set<string>;
  readOnly?: boolean;
  height?: number;
}

interface LayoutNodeExt {
  id: string; label: string; x: number; y: number;
  left: string | null; right: string | null;
}

const NODE_R = 26;
const SVG_W = 900;

function getNodeClass(node: LayoutNodeExt, selectedId: string | null, traversalActiveId: string | null | undefined, visitedIds: Set<string>, highlightedIds: Set<string>): string {
  if (node.id === traversalActiveId) return 'node-traversal-active';
  if (visitedIds.has(node.id)) return 'node-visited';
  if (node.id === selectedId) return 'node-selected';
  if (highlightedIds.has(node.id)) return 'node-highlighted';
  const isLeaf = !node.left && !node.right;
  return isLeaf ? 'node-leaf' : 'node-internal';
}

export const TreeCanvas: React.FC<Props> = ({
  tree, onNodeClick, onNodeDoubleClick,
  highlightedNodeIds = new Set(),
  traversalActiveId = null,
  visitedIds = new Set(),
  readOnly = false,
  height = 420,
}) => {
  const selectedNodeId = useGameStore(s => s.selectedNodeId);
  const setSelectedNode = useGameStore(s => s.setSelectedNode);
  const [transform, setTransform] = useState({ x: 0, y: 0, scale: 1 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ mx: 0, my: 0, ox: 0, oy: 0 });
  const svgRef = useRef<SVGSVGElement>(null);

  const layout = computeLayout(tree.root, SVG_W);
  const nodeMap = new Map<string, LayoutNodeExt>();
  for (const n of layout) nodeMap.set(n.id, n);

  // Fit to screen when tree changes
  useEffect(() => {
    if (layout.length === 0) { setTransform({ x: 0, y: 0, scale: 1 }); return; }
    const xs = layout.map(n => n.x);
    const ys = layout.map(n => n.y);
    const minX = Math.min(...xs) - NODE_R * 2;
    const maxX = Math.max(...xs) + NODE_R * 2;
    const minY = Math.min(...ys) - NODE_R * 2;
    const maxY = Math.max(...ys) + NODE_R * 2;
    const tw = maxX - minX || 100;
    const th = maxY - minY || 100;
    const scale = Math.min(SVG_W / tw, height / th, 1.4) * 0.88;
    setTransform({ x: (SVG_W - tw * scale) / 2 - minX * scale, y: 20, scale });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tree.root?.id, layout.length]);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    setTransform(t => {
      const delta = e.deltaY > 0 ? 0.9 : 1.1;
      return { ...t, scale: Math.max(0.2, Math.min(3, t.scale * delta)) };
    });
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as SVGElement).tagName === 'rect') {
      setDragging(true);
      setDragStart({ mx: e.clientX, my: e.clientY, ox: transform.x, oy: transform.y });
    }
  }, [transform]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragging) return;
    setTransform(t => ({
      ...t,
      x: dragStart.ox + (e.clientX - dragStart.mx),
      y: dragStart.oy + (e.clientY - dragStart.my),
    }));
  }, [dragging, dragStart]);

  const handleMouseUp = useCallback(() => setDragging(false), []);

  const handleNodeClick = (nodeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(nodeId === selectedNodeId ? null : nodeId);
    onNodeClick?.(nodeId);
  };

  const handleBgClick = () => {
    setSelectedNode(null);
  };

  const fitToScreen = () => {
    if (layout.length === 0) return;
    const xs = layout.map(n => n.x);
    const ys = layout.map(n => n.y);
    const minX = Math.min(...xs) - NODE_R * 2;
    const maxX = Math.max(...xs) + NODE_R * 2;
    const minY = Math.min(...ys) - NODE_R * 2;
    const maxY = Math.max(...ys) + NODE_R * 2;
    const tw = maxX - minX || 100;
    const th = maxY - minY || 100;
    const scale = Math.min(SVG_W / tw, height / th, 1.4) * 0.88;
    setTransform({ x: (SVG_W - tw * scale) / 2 - minX * scale, y: 20, scale });
  };

  const nodeColorMap: Record<string, { fill: string; stroke: string; text: string }> = {
    'node-selected': { fill: '#c9a84c', stroke: '#8a6a1a', text: '#2c2416' },
    'node-traversal-active': { fill: '#d4634a', stroke: '#8a2a1a', text: 'white' },
    'node-visited': { fill: '#4a7c59', stroke: '#2a5a39', text: 'white' },
    'node-highlighted': { fill: '#3a7a7a', stroke: '#1a5a5a', text: 'white' },
    'node-leaf': { fill: '#faf7f2', stroke: '#c8b89a', text: '#2c2416' },
    'node-internal': { fill: '#ede8df', stroke: '#b8a07a', text: '#2c2416' },
  };

  if (tree.root === null) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height, background: '#f7f3ed', border: '1px solid #ddd5c6', borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
        <span style={{ fontSize: 48, opacity: 0.3 }}>🌳</span>
        <p style={{ color: '#8a7a68', fontSize: 13 }}>Empty tree — add a root node to begin</p>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', height, background: '#f7f3ed', border: '1px solid #ddd5c6', borderRadius: 8, overflow: 'hidden' }}>
      {/* Controls */}
      <div style={{ position: 'absolute', top: 10, right: 10, display: 'flex', gap: 6, zIndex: 10 }}>
        {[
          { label: '−', action: () => setTransform(t => ({ ...t, scale: Math.max(0.2, t.scale * 0.85) })) },
          { label: '⊡', action: fitToScreen },
          { label: '+', action: () => setTransform(t => ({ ...t, scale: Math.min(3, t.scale * 1.15) })) },
        ].map(({ label, action }) => (
          <button key={label} onClick={action} style={{
            width: 28, height: 28, background: 'white', border: '1px solid #ddd5c6',
            borderRadius: 4, fontSize: label === '⊡' ? 14 : 16, fontWeight: 700,
            color: '#5a4e3c', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}>{label}</button>
        ))}
      </div>

      {/* Node count */}
      <div style={{ position: 'absolute', top: 10, left: 10, background: 'white', border: '1px solid #ddd5c6', borderRadius: 4, padding: '3px 10px', fontSize: 11, color: '#5a4e3c' }}>
        {layout.length} node{layout.length !== 1 ? 's' : ''}
      </div>

      <svg
        ref={svgRef}
        width="100%"
        height={height}
        viewBox={`0 0 ${SVG_W} ${height}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleBgClick}
        style={{ cursor: dragging ? 'grabbing' : 'grab', userSelect: 'none' }}
      >
        {/* Background grid */}
        <defs>
          <pattern id="grid" width="30" height="30" patternUnits="userSpaceOnUse">
            <path d="M 30 0 L 0 0 0 30" fill="none" stroke="#e8e0d4" strokeWidth="0.5" />
          </pattern>
          <filter id="shadow-node">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.15" />
          </filter>
          <marker id="arrowhead" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="#b8a07a" />
          </marker>
          <marker id="arrowhead-left" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="#6aab7a" />
          </marker>
          <marker id="arrowhead-right" markerWidth="8" markerHeight="8" refX="6" refY="3" orient="auto">
            <path d="M 0 0 L 6 3 L 0 6 Z" fill="#7aaabb" />
          </marker>
        </defs>
        <rect width={SVG_W} height={height} fill="url(#grid)" />

        <g transform={`translate(${transform.x}, ${transform.y}) scale(${transform.scale})`}>
          {/* Edges */}
          {layout.map(node => {
            const lines = [];
            if (node.left) {
              const child = nodeMap.get(node.left);
              if (child) {
                const angle = Math.atan2(child.y - node.y, child.x - node.x);
                const sx = node.x + Math.cos(angle) * NODE_R;
                const sy = node.y + Math.sin(angle) * NODE_R;
                const ex = child.x - Math.cos(angle) * (NODE_R + 3);
                const ey = child.y - Math.sin(angle) * (NODE_R + 3);
                lines.push(
                  <g key={`left-${node.id}`}>
                    <line x1={sx} y1={sy} x2={ex} y2={ey}
                      stroke="#6aab7a" strokeWidth={2} markerEnd="url(#arrowhead-left)" strokeDasharray="" />
                    <text x={(node.x + child.x) / 2 - 8} y={(node.y + child.y) / 2}
                      fontSize={9} fill="#4a7c59" fontFamily="Inter" fontWeight="600">L</text>
                  </g>
                );
              }
            }
            if (node.right) {
              const child = nodeMap.get(node.right);
              if (child) {
                const angle = Math.atan2(child.y - node.y, child.x - node.x);
                const sx = node.x + Math.cos(angle) * NODE_R;
                const sy = node.y + Math.sin(angle) * NODE_R;
                const ex = child.x - Math.cos(angle) * (NODE_R + 3);
                const ey = child.y - Math.sin(angle) * (NODE_R + 3);
                lines.push(
                  <g key={`right-${node.id}`}>
                    <line x1={sx} y1={sy} x2={ex} y2={ey}
                      stroke="#7aaabb" strokeWidth={2} markerEnd="url(#arrowhead-right)" strokeDasharray="" />
                    <text x={(node.x + child.x) / 2 + 4} y={(node.y + child.y) / 2}
                      fontSize={9} fill="#3a7a7a" fontFamily="Inter" fontWeight="600">R</text>
                  </g>
                );
              }
            }
            // Absent branch indicators (dashed)
            if (!node.left && !node.right && layout.length > 1) {
              // leaf node — no dashes needed
            } else if (!node.left && node !== layout[0]) {
              // Show dashed left indicator
              lines.push(
                <line key={`absent-left-${node.id}`}
                  x1={node.x - NODE_R} y1={node.y}
                  x2={node.x - NODE_R - 20} y2={node.y + 30}
                  stroke="#ddd5c6" strokeWidth={1.5} strokeDasharray="4,4" />
              );
            }
            if (!node.right && node !== layout[0]) {
              lines.push(
                <line key={`absent-right-${node.id}`}
                  x1={node.x + NODE_R} y1={node.y}
                  x2={node.x + NODE_R + 20} y2={node.y + 30}
                  stroke="#ddd5c6" strokeWidth={1.5} strokeDasharray="4,4" />
              );
            }
            return lines;
          })}

          {/* Nodes */}
          {layout.map(node => {
            const cls = getNodeClass(node, selectedNodeId, traversalActiveId, visitedIds, highlightedNodeIds);
            const colors = nodeColorMap[cls] || nodeColorMap['node-internal'];
            const isRoot = node.id === layout[0]?.id;
            const isLeaf = !node.left && !node.right;
            return (
              <g
                key={node.id}
                transform={`translate(${node.x}, ${node.y})`}
                onClick={(e) => handleNodeClick(node.id, e)}
                onDoubleClick={(e) => { e.stopPropagation(); onNodeDoubleClick?.(node.id); }}
                style={{ cursor: 'pointer' }}
                filter="url(#shadow-node)"
              >
                {/* Root crown */}
                {isRoot && (
                  <text y={-NODE_R - 8} textAnchor="middle" fontSize={12} style={{ userSelect: 'none' }}>👑</text>
                )}
                {/* Node circle */}
                <circle
                  r={NODE_R}
                  fill={colors.fill}
                  stroke={colors.stroke}
                  strokeWidth={cls === 'node-selected' || cls === 'node-traversal-active' ? 2.5 : 1.5}
                  style={{ transition: 'fill 0.2s, stroke 0.2s' }}
                />
                {/* Leaf indicator */}
                {isLeaf && !isRoot && (
                  <circle r={4} cy={NODE_R - 4} fill="#c8b89a" opacity={0.6} />
                )}
                {/* Label */}
                <text
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize={node.label.length > 6 ? 9 : 11}
                  fontFamily="'JetBrains Mono', monospace"
                  fontWeight="600"
                  fill={colors.text}
                  style={{ userSelect: 'none' }}
                >
                  {node.label.length > 8 ? node.label.slice(0, 7) + '…' : node.label}
                </text>
              </g>
            );
          })}
        </g>
      </svg>
    </div>
  );
};

// ============================================================
// ASCII TREE VIEW
// ============================================================
import { toAscii } from '../engine/treeAlgorithms';

export const AsciiTreeView: React.FC<{ tree: BinaryTree }> = ({ tree }) => {
  const ascii = tree.root ? toAscii(tree.root) : '(empty tree)';
  return (
    <pre style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: 12,
      lineHeight: 1.6,
      color: '#5a4e3c',
      background: '#f7f3ed',
      border: '1px solid #ddd5c6',
      borderRadius: 6,
      padding: '12px 16px',
      overflow: 'auto',
      maxHeight: 200,
      whiteSpace: 'pre',
    }}>
      {ascii}
    </pre>
  );
};

// ============================================================
// NODE BUILDER TOOLBAR
// ============================================================
interface NodeBuilderProps {
  onAddNode: (label: string, parentId?: string, side?: 'left' | 'right') => void;
  onRemoveNode: (nodeId: string) => void;
  onDisconnect: (nodeId: string) => void;
  onReset: () => void;
  selectedNodeId: string | null;
  tree: BinaryTree;
}

export const NodeBuilderToolbar: React.FC<NodeBuilderProps> = ({
  onAddNode, onRemoveNode, onDisconnect, onReset, selectedNodeId, tree,
}) => {
  const [label, setLabel] = useState('');
  const [side, setSide] = useState<'left' | 'right'>('left');
  const selectedNode = selectedNodeId ? findNode(tree.root, selectedNodeId) : null;

  const handleAdd = () => {
    const trimmed = label.trim().replace(/\s+/g, '_');
    if (!trimmed) return;
    if (!tree.root) {
      onAddNode(trimmed);
    } else {
      onAddNode(trimmed, selectedNodeId || undefined, side);
    }
    setLabel('');
  };

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, padding: '10px 0', alignItems: 'center' }}>
      <input
        type="text"
        value={label}
        onChange={e => setLabel(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && handleAdd()}
        placeholder={tree.root ? "Node label (e.g. Alice)" : "Root label (e.g. Arthur)"}
        style={{
          padding: '6px 10px', border: '1px solid #c8b89a', borderRadius: 4,
          fontFamily: "'JetBrains Mono', monospace", fontSize: 12, background: '#faf7f2',
          color: '#2c2416', outline: 'none', flex: 1, minWidth: 120,
        }}
        maxLength={20}
      />
      {tree.root && (
        <select
          value={side}
          onChange={e => setSide(e.target.value as 'left' | 'right')}
          style={{ padding: '6px 8px', border: '1px solid #c8b89a', borderRadius: 4, fontSize: 12, background: '#faf7f2', color: '#2c2416' }}
        >
          <option value="left">← Left</option>
          <option value="right">Right →</option>
        </select>
      )}
      <button
        onClick={handleAdd}
        className="btn btn-primary btn-sm"
        disabled={!label.trim()}
        title={tree.root ? "Add as child of selected node" : "Add as root"}
      >
        {tree.root ? '+ Child' : '+ Root'}
      </button>
      {selectedNodeId && (
        <>
          <button onClick={() => onDisconnect(selectedNodeId)} className="btn btn-secondary btn-sm" title="Disconnect from parent">
            ✂ Detach
          </button>
          <button onClick={() => onRemoveNode(selectedNodeId)} className="btn btn-danger btn-sm" title="Delete this node and its subtree">
            🗑 Delete
          </button>
        </>
      )}
      <button onClick={onReset} className="btn btn-secondary btn-sm" title="Reset entire tree">
        ↺ Reset
      </button>
    </div>
  );
};
