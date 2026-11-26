// ============================================================
// TRAVERSAL LABORATORY
// ============================================================

import React, { useEffect, useRef } from 'react';
import { useGameStore } from '../store/gameStore';
import { TreeCanvas } from './TreeCanvas';
import type { TraversalType } from '../types';

const TRAVERSAL_INFO: Record<TraversalType, { name: string; formula: string; description: string; color: string }> = {
  preorder: { name: 'Preorder', formula: 'Root → Left → Right', description: 'Visit root first, then recurse left, then right. Used in serialization.', color: '#c9a84c' },
  inorder: { name: 'Inorder', formula: 'Left → Root → Right', description: 'Recurse left, visit root, recurse right. Gives sorted order in a BST.', color: '#4a7c59' },
  postorder: { name: 'Postorder', formula: 'Left → Right → Root', description: 'Recurse left, recurse right, then visit root. Used for deletion and evaluation.', color: '#b05c40' },
  levelorder: { name: 'Level Order', formula: 'Level by Level (BFS)', description: 'Visit all nodes at each depth before going deeper. Breadth-first.', color: '#3a7a7a' },
};

export const TraversalLab: React.FC = () => {
  const {
    workingTree, traversalType, traversalSteps, traversalIndex,
    traversalPlaying, setTraversalType, startTraversal, stepTraversal,
    resetTraversal, toggleTraversalPlay,
  } = useGameStore();

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (traversalPlaying) {
      intervalRef.current = setInterval(() => {
        const { traversalIndex: idx, traversalSteps: steps } = useGameStore.getState();
        if (idx >= steps.length - 1) {
          useGameStore.getState().toggleTraversalPlay();
        } else {
          stepTraversal();
        }
      }, 700);
    } else {
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [traversalPlaying, stepTraversal]);

  const visitedIds = new Set(traversalSteps.slice(0, traversalIndex).map(s => s.nodeId));
  const activeId = traversalIndex >= 0 && traversalIndex < traversalSteps.length
    ? traversalSteps[traversalIndex].nodeId : null;

  const info = TRAVERSAL_INFO[traversalType];
  const sequence = traversalSteps.map(s => s.label);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Traversal selector */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {(Object.keys(TRAVERSAL_INFO) as TraversalType[]).map(type => (
          <button
            key={type}
            onClick={() => { setTraversalType(type); resetTraversal(); }}
            className={`btn ${traversalType === type ? 'btn-primary' : 'btn-secondary'}`}
            style={{ borderColor: TRAVERSAL_INFO[type].color, color: traversalType === type ? undefined : TRAVERSAL_INFO[type].color }}
          >
            {TRAVERSAL_INFO[type].name}
          </button>
        ))}
      </div>

      {/* Info card */}
      <div className="card" style={{ borderLeft: `4px solid ${info.color}` }}>
        <div className="card-body" style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, color: info.color }}>{info.name}</div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 12, color: '#5a4e3c', marginTop: 2 }}>{info.formula}</div>
            <div style={{ fontSize: 12, color: '#8a7a68', marginTop: 4 }}>{info.description}</div>
          </div>
        </div>
      </div>

      {/* Tree with traversal highlighting */}
      <TreeCanvas
        tree={workingTree}
        traversalActiveId={activeId}
        visitedIds={visitedIds}
        height={320}
      />

      {/* Traversal sequence */}
      {traversalSteps.length > 0 && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Traversal Sequence</span>
            <span style={{ fontSize: 12, color: '#8a7a68' }}>
              Step {Math.max(traversalIndex, 0) + 1} / {traversalSteps.length}
            </span>
          </div>
          <div className="card-body">
            <div className="traversal-seq">
              {sequence.map((label, i) => (
                <span
                  key={i}
                  className={`traversal-token ${i === traversalIndex ? 'active' : i < traversalIndex ? 'visited' : ''}`}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={startTraversal} disabled={!workingTree.root}>
          ▶ Start
        </button>
        <button className="btn btn-secondary" onClick={toggleTraversalPlay} disabled={traversalSteps.length === 0}>
          {traversalPlaying ? '⏸ Pause' : '⏯ Play'}
        </button>
        <button className="btn btn-secondary" onClick={stepTraversal} disabled={traversalIndex >= traversalSteps.length - 1 || traversalIndex < 0}>
          ⏭ Next Step
        </button>
        <button className="btn btn-secondary" onClick={resetTraversal} disabled={traversalSteps.length === 0}>
          ⏮ Reset
        </button>
        {traversalSteps.length > 0 && (
          <div style={{ marginLeft: 8, fontSize: 12, color: '#8a7a68' }}>
            Total nodes: <strong>{traversalSteps.length}</strong>
          </div>
        )}
      </div>

      {/* Stats */}
      {!workingTree.root && (
        <div style={{ textAlign: 'center', padding: 32, color: '#8a7a68' }}>
          <div style={{ fontSize: 36, marginBottom: 8 }}>🔬</div>
          <p>Load a tree in Tree Restoration to see traversal here.</p>
        </div>
      )}
    </div>
  );
};
