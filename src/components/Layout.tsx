// ============================================================
// SIDEBAR COMPONENT
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';
import type { GameScreen, BinaryTree } from '../types';

interface NavItem {
  id: GameScreen;
  icon: string;
  label: string;
  section?: string;
}

const NAV_ITEMS: NavItem[] = [
  { id: 'dashboard', icon: '🏛', label: 'Dashboard', section: 'Main' },
  { id: 'mission_archive', icon: '📜', label: 'Mission Archive', section: 'Main' },
  { id: 'tree_restoration', icon: '🌳', label: 'Tree Restoration', section: 'Lab' },
  { id: 'archive_terminal', icon: '💾', label: 'Archive Terminal', section: 'Lab' },
  { id: 'traversal_lab', icon: '🔬', label: 'Traversal Lab', section: 'Lab' },
  { id: 'challenge_mode', icon: '⚔', label: 'Challenge Mode', section: 'Modes' },
  { id: 'achievements', icon: '🏆', label: 'Achievements', section: 'Profile' },
  { id: 'settings', icon: '⚙', label: 'Settings', section: 'Profile' },
];

export const Sidebar: React.FC = () => {
  const { screen, setScreen, player } = useGameStore();

  const sections = [...new Set(NAV_ITEMS.map(i => i.section).filter(Boolean))];
  const xpToNext = 200 - (player.totalXP % 200);
  const xpProgress = ((player.totalXP % 200) / 200) * 100;

  return (
    <aside className="sidebar">
      {/* Logo */}
      <div className="sidebar-logo">
        <div className="sidebar-logo-icon">🏛</div>
        <div className="sidebar-logo-title">The Museum's<br/>Family Archives</div>
      </div>

      {/* Nav */}
      <nav className="sidebar-nav">
        {sections.map(section => (
          <div key={section}>
            <div className="sidebar-section-label">{section}</div>
            {NAV_ITEMS.filter(i => i.section === section).map(item => (
              <button
                key={item.id}
                className={`sidebar-item ${screen === item.id ? 'active' : ''}`}
                onClick={() => setScreen(item.id)}
              >
                <span className="sidebar-item-icon">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>
        ))}
      </nav>

      {/* Player XP */}
      <div className="xp-section">
        <div className="xp-label">Archivist Progress</div>
        <div className="xp-row">
          <span>Level {player.level}</span>
          <span style={{ color: '#c9a84c' }}>{player.totalXP} XP</span>
        </div>
        <div className="xp-bar">
          <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
        </div>
        <div style={{ fontSize: 10, color: '#6b5c44', marginTop: 4 }}>{xpToNext} XP to next level</div>
        <div className="rank-display" style={{ marginTop: 10 }}>
          <span>🎖</span>
          <span>{player.rank}</span>
        </div>
      </div>
    </aside>
  );
};

// ============================================================
// RIGHT PANEL
// ============================================================

import { findNode, findParent, countNodes } from '../engine/treeAlgorithms';

export const RightPanel: React.FC<{ tree: BinaryTree }> = ({ tree }) => {
  const { selectedNodeId, setSelectedNode, currentMission, showHints, useHint, missions } = useGameStore();
  const node = selectedNodeId ? findNode(tree.root, selectedNodeId) : null;
  const parentInfo = selectedNodeId ? findParent(tree.root, selectedNodeId) : null;
  const mission = currentMission || missions.find(m => m.status === 'in_progress');

  return (
    <div className="right-panel">
      {/* Node information */}
      <div style={{ padding: 16, borderBottom: '1px solid #ddd5c6' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: '#5a4e3c', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Node Inspector
        </div>
        {node ? (
          <div>
            <div className="node-info-row">
              <span className="node-info-label">Label</span>
              <span className="node-info-value" style={{ color: '#c9a84c', fontWeight: 700 }}>{node.label}</span>
            </div>
            <div className="node-info-row">
              <span className="node-info-label">Type</span>
              <span className="node-info-value">
                {!parentInfo ? '👑 Root' : !node.left && !node.right ? '🍃 Leaf' : '🔵 Internal'}
              </span>
            </div>
            <div className="node-info-row">
              <span className="node-info-label">Parent</span>
              <span className="node-info-value">{parentInfo ? `${parentInfo.node.label} (${parentInfo.side})` : '—'}</span>
            </div>
            <div className="node-info-row">
              <span className="node-info-label">Left child</span>
              <span className="node-info-value">{node.left ? node.left.label : <span style={{ color: '#ddd5c6' }}>∅ empty</span>}</span>
            </div>
            <div className="node-info-row">
              <span className="node-info-label">Right child</span>
              <span className="node-info-value">{node.right ? node.right.label : <span style={{ color: '#ddd5c6' }}>∅ empty</span>}</span>
            </div>
            <div className="node-info-row">
              <span className="node-info-label">Subtree size</span>
              <span className="node-info-value">{countNodes(node)}</span>
            </div>
            <div className="node-info-row" style={{ border: 'none' }}>
              <span className="node-info-label">ID</span>
              <span className="node-info-value" style={{ fontSize: 10, color: '#8a7a68' }}>{node.id.split('_').slice(0, 2).join('_')}</span>
            </div>
            <button onClick={() => setSelectedNode(null)} className="btn btn-secondary btn-sm" style={{ marginTop: 10, width: '100%' }}>
              Deselect
            </button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0', color: '#8a7a68' }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>🔍</div>
            <p style={{ fontSize: 11 }}>Click a node in the tree to inspect it</p>
          </div>
        )}
      </div>

      {/* Tree summary */}
      <div style={{ padding: 16, borderBottom: '1px solid #ddd5c6' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: '#5a4e3c', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Tree Summary
        </div>
        <div className="node-info-row">
          <span className="node-info-label">Total nodes</span>
          <span className="node-info-value">{countNodes(tree.root)}</span>
        </div>
        <div className="node-info-row">
          <span className="node-info-label">Root</span>
          <span className="node-info-value">{tree.root?.label || '—'}</span>
        </div>
        <div className="node-info-row" style={{ border: 'none' }}>
          <span className="node-info-label">Status</span>
          <span className="node-info-value" style={{ color: tree.root ? '#4a7c59' : '#8a7a68' }}>
            {tree.root ? '🌳 Active' : '∅ Empty'}
          </span>
        </div>
      </div>

      {/* Hints */}
      {mission && showHints && (
        <div style={{ padding: 16 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 12, fontWeight: 700, color: '#5a4e3c', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            💡 Hints
          </div>
          {mission.hints.map(hint => (
            <details key={hint.level} style={{ marginBottom: 8 }}>
              <summary style={{
                cursor: 'pointer', fontSize: 11, fontWeight: 600, color: '#c9a84c',
                padding: '4px 0', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 4,
              }}>
                <span>▶</span>
                Hint {hint.level}
                {hint.penalty > 0 && <span style={{ color: '#8a7a68', fontWeight: 400 }}>(-{hint.penalty} XP)</span>}
              </summary>
              <p style={{ fontSize: 11, color: '#5a4e3c', marginTop: 4, lineHeight: 1.5, background: '#fff8e1', padding: '8px 10px', borderRadius: 4, borderLeft: '3px solid #c9a84c' }}>
                {hint.text}
              </p>
              <button className="btn btn-secondary btn-sm" style={{ marginTop: 4, fontSize: 10 }}
                onClick={() => useHint(hint.level)}>
                Use this hint
              </button>
            </details>
          ))}
        </div>
      )}
    </div>
  );
};

// ============================================================
// BOTTOM PANEL
// ============================================================

export const BottomPanel: React.FC = () => {
  const { activityLog, validationMessages, clearValidation } = useGameStore();

  return (
    <div className="bottom-panel">
      {/* Instructions / Log */}
      <div style={{ flex: 1, padding: '10px 16px', borderRight: '1px solid #ddd5c6', overflowY: 'auto' }}>
        <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: '#5a4e3c', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          Activity Log
        </div>
        {activityLog.slice(0, 8).map((entry, i) => (
          <div key={i} style={{ fontSize: 11, color: i === 0 ? '#2c2416' : '#8a7a68', padding: '1px 0', fontFamily: "'JetBrains Mono', monospace" }}>
            {entry}
          </div>
        ))}
      </div>
      {/* Validation */}
      <div style={{ width: 320, padding: '10px 12px', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 11, fontWeight: 700, color: '#5a4e3c', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Status
          </div>
          {validationMessages.length > 0 && (
            <button onClick={clearValidation} style={{ fontSize: 10, color: '#8a7a68', background: 'none', border: 'none', cursor: 'pointer' }}>clear</button>
          )}
        </div>
        {validationMessages.slice(0, 4).map((msg, i) => (
          <div key={i} className={`validation-msg ${msg.type}`} style={{ marginBottom: 4 }}>
            <span style={{ fontSize: 11 }}>{msg.type === 'success' ? '✅' : msg.type === 'error' ? '❌' : msg.type === 'warning' ? '⚠' : 'ℹ'}</span>
            <span style={{ fontSize: 11 }}>{msg.text}</span>
          </div>
        ))}
        {validationMessages.length === 0 && (
          <div style={{ fontSize: 11, color: '#8a7a68' }}>No messages</div>
        )}
      </div>
    </div>
  );
};
