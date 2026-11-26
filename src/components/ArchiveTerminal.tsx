// ============================================================
// ARCHIVE TERMINAL COMPONENT
// ============================================================

import React, { useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { deserialize, serialize } from '../engine/treeAlgorithms';

export const ArchiveTerminal: React.FC = () => {
  const {
    workingTree, serializedText, memoryCleared, restoredTree, originalTree,
    exportTree, restoreTree, clearMemory, verifyRestoration, setSerializedText, damageFile,
    validationMessages, clearValidation,
  } = useGameStore();

  const [localText, setLocalText] = useState('');
  const [showDamageMenu, setShowDamageMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleImport = () => {
    setSerializedText(localText);
    useGameStore.getState().addValidation('info', 'Archive text loaded into memory.');
    useGameStore.getState().addLog(`Imported archive text (${localText.split(' ').length} tokens)`);
  };

  const handleCopy = async () => {
    if (!serializedText) return;
    await navigator.clipboard.writeText(serializedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const previewDeserialize = () => {
    const text = localText || serializedText;
    if (!text) return;
    const result = deserialize(text);
    if (result.success && result.tree) {
      useGameStore.getState().addValidation('success', `✅ Valid archive — ${result.tree.size} node(s) detected.`);
    } else {
      useGameStore.getState().addValidation('error', `❌ ${result.error}: ${result.errorDetail}`);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Terminal header */}
      <div className="terminal">
        <div className="terminal-header">
          <div className="terminal-dot red" />
          <div className="terminal-dot yellow" />
          <div className="terminal-dot green" />
          <span className="terminal-title">ARCHIVE TERMINAL v2.0 — PREORDER_NULL_MARKER FORMAT</span>
        </div>
        <div className="terminal-body">
{`FORMAT: PREORDER with explicit null markers (#)
ENCODING: Whitespace-separated tokens
EXAMPLE: A B # D # # C # #
 ├─ A = root
 │   ├─ B = left child of A
 │   │   ├─ # = absent left child of B
 │   │   └─ D = right child of B
 │   │       ├─ # = absent left child of D
 │   │       └─ # = absent right child of D
 │   └─ C = right child of A
 │       ├─ # = absent left child of C
 │       └─ # = absent right child of C

STATUS: ${memoryCleared ? '⚠ MEMORY CLEARED — only archive text available' : workingTree.root ? `Tree loaded (${workingTree.size} nodes)` : 'No tree loaded'}
${serializedText ? `ARCHIVE: ${serializedText.slice(0, 80)}${serializedText.length > 80 ? '...' : ''}` : 'ARCHIVE: (none)'}`}
        </div>
      </div>

      {/* Current archive text display */}
      {serializedText && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">📄 Archive Text</span>
            <div style={{ display: 'flex', gap: 6 }}>
              <button className="btn btn-secondary btn-sm" onClick={handleCopy}>
                {copied ? '✓ Copied!' : '⎘ Copy'}
              </button>
              <div style={{ position: 'relative' }}>
                <button className="btn btn-danger btn-sm" onClick={() => setShowDamageMenu(!showDamageMenu)}>
                  ⚠ Damage File
                </button>
                {showDamageMenu && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, background: 'white',
                    border: '1px solid #ddd5c6', borderRadius: 6, padding: 6,
                    zIndex: 50, minWidth: 180, boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                  }}>
                    {[
                      { label: '❌ Remove null marker', type: 'missing_null' as const },
                      { label: '➕ Add extra token', type: 'extra_token' as const },
                      { label: '🔤 Invalid label', type: 'invalid_label' as const },
                      { label: '✂ Truncate archive', type: 'truncate' as const },
                    ].map(({ label, type }) => (
                      <button key={type}
                        onClick={() => { damageFile(type); setShowDamageMenu(false); }}
                        style={{ display: 'block', width: '100%', textAlign: 'left', padding: '6px 10px', border: 'none', background: 'none', cursor: 'pointer', fontSize: 12, color: '#5a4e3c' }}
                        onMouseOver={e => (e.currentTarget.style.background = '#fce4ec')}
                        onMouseOut={e => (e.currentTarget.style.background = 'none')}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="card-body">
            <div style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: 12,
              background: '#f7f3ed', border: '1px solid #ddd5c6', borderRadius: 4,
              padding: '10px 12px', wordBreak: 'break-all', lineHeight: 1.8, color: '#2c2416',
              maxHeight: 100, overflowY: 'auto',
            }}>
              {serializedText.split(' ').map((token, i) => (
                <span key={i} style={{
                  display: 'inline-block', margin: '1px 2px',
                  padding: '1px 6px', borderRadius: 3,
                  background: token === '#' ? '#fce4ec' : '#e8f5e9',
                  color: token === '#' ? '#880e4f' : '#1b5e20',
                  fontWeight: token === '#' ? 400 : 600,
                }}>
                  {token}
                </span>
              ))}
            </div>
            <div style={{ marginTop: 8, fontSize: 11, color: '#8a7a68' }}>
              Tokens: {serializedText.split(' ').length} |
              Nodes: {serializedText.split(' ').filter(t => t !== '#').length} |
              Null markers: {serializedText.split(' ').filter(t => t === '#').length}
            </div>
          </div>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
        <button className="btn btn-primary" onClick={exportTree} disabled={!workingTree.root}>
          📤 Export Tree
        </button>
        <button className="btn btn-secondary" onClick={clearMemory} disabled={!serializedText || memoryCleared}>
          🧹 Clear Memory
        </button>
        <button className="btn btn-success" onClick={restoreTree} disabled={!serializedText}>
          📥 Restore Tree
        </button>
        <button className="btn btn-secondary" onClick={verifyRestoration} disabled={!restoredTree && !workingTree.root}>
          ✓ Verify Restoration
        </button>
      </div>

      {/* Import area */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📋 Import Archive Text</span>
          <div style={{ display: 'flex', gap: 6 }}>
            <button className="btn btn-secondary btn-sm" onClick={previewDeserialize}>
              👁 Preview
            </button>
            <button className="btn btn-primary btn-sm" onClick={handleImport} disabled={!localText.trim()}>
              Load
            </button>
          </div>
        </div>
        <div className="card-body">
          <textarea
            className="terminal-input"
            value={localText}
            onChange={e => setLocalText(e.target.value)}
            placeholder="Paste archive text here, e.g.:  A B # # C # #"
            rows={3}
          />
          <p style={{ fontSize: 11, color: '#8a7a68', marginTop: 6 }}>
            Paste preorder-with-null-markers archive text. Use # for absent children. Click Load, then Restore Tree.
          </p>
        </div>
      </div>

      {/* Validation messages */}
      <div>
        {validationMessages.slice(0, 5).map((msg, i) => (
          <div key={i} className={`validation-msg ${msg.type}`}>
            <span>{msg.type === 'success' ? '✅' : msg.type === 'error' ? '❌' : msg.type === 'warning' ? '⚠' : 'ℹ'}</span>
            <span>{msg.text}</span>
          </div>
        ))}
        {validationMessages.length > 0 && (
          <button onClick={clearValidation} className="btn btn-secondary btn-sm" style={{ marginTop: 4 }}>
            Clear messages
          </button>
        )}
      </div>
    </div>
  );
};
