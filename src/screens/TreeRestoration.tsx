// ============================================================
// TREE RESTORATION SCREEN (Main puzzle screen)
// ============================================================

import React, { useEffect, useState } from 'react';
import { useGameStore } from '../store/gameStore';
import { TreeCanvas, NodeBuilderToolbar, AsciiTreeView } from '../components/TreeCanvas';
import { treesAreEqual, deserialize } from '../engine/treeAlgorithms';
import type { BinaryTree } from '../types';

function treeMatchesTarget(working: BinaryTree, target: BinaryTree | null): boolean {
  if (!target) return false;
  return treesAreEqual(working.root, target.root);
}

export const TreeRestorationScreen: React.FC = () => {
  const {
    currentMission, workingTree, originalTree, serializedText, memoryCleared,
    addNode, removeNode, disconnectNode, resetWorkingTree, selectedNodeId,
    addValidation, addLog, completeMission, missions, startMission,
    exportTree, restoreTree, clearMemory, verifyRestoration, setWorkingTree,
  } = useGameStore();

  const [view, setView] = useState<'visual' | 'ascii'>('visual');
  const [showOriginal, setShowOriginal] = useState(false);
  const [missionComplete, setMissionComplete] = useState(false);
  const [score, setScore] = useState(0);

  const mission = currentMission || missions.find(m => m.status === 'in_progress') || null;

  // Auto-load serialized input for restoration missions
  useEffect(() => {
    if (mission?.serializedInput && !workingTree.root && !memoryCleared) {
      // Show clue in terminal
      useGameStore.getState().setSerializedText('');
      addLog(`Mission loaded: ${mission.title}`);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mission?.id]);

  const handleCheck = () => {
    if (!mission) return;
    const target = mission.targetTree;
    const matches = treeMatchesTarget(workingTree, target || null);
    if (matches) {
      const hintsUsed = mission.hintsUsed;
      const penalty = hintsUsed * 20;
      const earned = Math.max(mission.maxScore - penalty, mission.maxScore * 0.3);
      setScore(Math.round(earned));
      addValidation('success', `✅ Perfect restoration! Family record verified. Score: ${Math.round(earned)}`);
      addLog(`Mission completed: ${mission.title}`);
      setMissionComplete(true);
    } else {
      addValidation('error', '❌ Tree structure does not match the target. Check node positions and labels.');
      addLog('Validation: tree mismatch — check branch positions');
    }
  };

  const handleCompleteAndSave = () => {
    if (!mission) return;
    completeMission(mission.id, score);
    setMissionComplete(false);
  };

  const handleRestoreAndVerify = () => {
    restoreTree();
    setTimeout(() => {
      const restored = useGameStore.getState().workingTree;
      const target = mission?.targetTree;
      if (target && treesAreEqual(restored.root, target.root)) {
        addValidation('success', '✅ Restored tree matches target perfectly!');
      }
    }, 100);
  };

  // For missions with serialized input, show import UI
  const isRestorationMission = mission?.serializedInput;
  const isCorruptedMission = mission?.corruptedInput;
  const targetTree = mission?.targetTree;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Mission Banner */}
      {mission && (
        <div className="card" style={{ background: 'linear-gradient(135deg, #2c2416, #3d3020)', border: 'none', color: '#f7f3ed' }}>
          <div className="card-body">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#8a7a68', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 4 }}>
                  Mission {mission.number} · Chapter {mission.chapter}
                </div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 17, fontWeight: 700, color: '#c9a84c', marginBottom: 8 }}>
                  {mission.title}
                </div>
                <p style={{ fontSize: 12, color: '#c8b89a', lineHeight: 1.6, marginBottom: 8 }}>{mission.story}</p>
                <div style={{ background: 'rgba(201,168,76,0.1)', border: '1px solid rgba(201,168,76,0.3)', borderRadius: 6, padding: '8px 12px' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#c9a84c' }}>🎯 Objective: </span>
                  <span style={{ fontSize: 12, color: '#e8d8b8' }}>{mission.objective}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 11, color: '#8a7a68', marginBottom: 4 }}>Max Score</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 24, fontWeight: 700, color: '#c9a84c' }}>{mission.maxScore}</div>
                <div style={{ fontSize: 11, color: '#c9a84c', marginTop: 4 }}>+{mission.reward.xp} XP</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Serialized input clue for restoration missions */}
      {isRestorationMission && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">📋 Archive Clue</span>
            <span style={{ fontSize: 11, color: '#8a7a68' }}>Use this to restore the tree</span>
          </div>
          <div className="card-body">
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, background: '#f7f3ed', border: '1px solid #ddd5c6', borderRadius: 4, padding: '10px 12px', wordBreak: 'break-all', color: '#2c2416', marginBottom: 10 }}>
              {mission.serializedInput}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" onClick={() => {
                useGameStore.getState().setSerializedText(mission!.serializedInput!);
                handleRestoreAndVerify();
              }}>
                📥 Auto-Restore from Clue
              </button>
              <button className="btn btn-secondary btn-sm" onClick={() => {
                useGameStore.getState().setSerializedText(mission!.serializedInput!);
                addLog('Archive clue loaded into terminal');
                addValidation('info', 'Archive text loaded. Go to Archive Terminal to restore, or click Auto-Restore.');
              }}>
                Load into Terminal
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Corrupted input for damage detection missions */}
      {isCorruptedMission && (
        <div className="card" style={{ borderLeft: '4px solid #d4634a' }}>
          <div className="card-header">
            <span className="card-title" style={{ color: '#d4634a' }}>⚠ Corrupted Archive</span>
            <span className="badge badge-hard">Damage Detection</span>
          </div>
          <div className="card-body">
            <p style={{ fontSize: 12, color: '#5a4e3c', marginBottom: 10 }}>
              This archive text has been flagged as corrupted. Submit it to the terminal to identify the error.
            </p>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 13, background: '#fce4ec', border: '1px solid #f48fb1', borderRadius: 4, padding: '10px 12px', wordBreak: 'break-all', color: '#880e4f', marginBottom: 10 }}>
              {mission?.corruptedInput}
            </div>
            <button className="btn btn-danger btn-sm" onClick={() => {
              const text = mission!.corruptedInput!;
              const result = deserialize(text);
              if (!result.success) {
                addValidation('error', `❌ Corruption detected: ${result.error}. ${result.errorDetail}`);
                addLog(`Error identified: ${result.error}`);
                // Complete the mission
                const earnedScore = mission!.maxScore - mission!.hintsUsed * 30;
                setScore(Math.max(earnedScore, mission!.maxScore * 0.3));
                setMissionComplete(true);
              } else {
                addValidation('warning', 'The system accepted this archive. No corruption detected with current settings.');
              }
            }}>
              🔍 Submit for Error Detection
            </button>
          </div>
        </div>
      )}

      {/* Memory clear status */}
      {memoryCleared && (
        <div style={{ background: '#fce4ec', border: '1px solid #f48fb1', borderRadius: 8, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 20 }}>🧹</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#880e4f' }}>Memory Cleared</div>
            <div style={{ fontSize: 11, color: '#c62828' }}>The original tree data has been permanently removed. Only the archive text remains in the terminal.</div>
          </div>
        </div>
      )}

      {/* Mission complete overlay */}
      {missionComplete && (
        <div style={{
          background: 'linear-gradient(135deg, #1b5e20, #2e7d32)', border: '2px solid #4a7c59',
          borderRadius: 12, padding: 24, textAlign: 'center', color: 'white',
        }}>
          <div style={{ fontSize: 48, marginBottom: 8 }}>🎉</div>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: '#c8e06b', marginBottom: 4 }}>
            Record Restored!
          </div>
          <div style={{ fontSize: 14, color: '#a5d6a7', marginBottom: 16 }}>
            Score: {score} / {mission?.maxScore} · Reward: +{mission?.reward.xp} XP
          </div>
          <button className="btn btn-primary btn-lg" onClick={handleCompleteAndSave}>
            ✓ Save & Continue
          </button>
        </div>
      )}

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <button
          className={`btn btn-secondary btn-sm`}
          onClick={() => setView(view === 'visual' ? 'ascii' : 'visual')}
        >
          {view === 'visual' ? '📝 ASCII View' : '🌳 Visual View'}
        </button>
        {originalTree && !memoryCleared && (
          <button
            className="btn btn-secondary btn-sm"
            onClick={() => setShowOriginal(!showOriginal)}
          >
            {showOriginal ? '🙈 Hide Target' : '👁 Show Target'}
          </button>
        )}
        {mission && !isCorruptedMission && (
          <button className="btn btn-success" onClick={handleCheck} disabled={!workingTree.root || missionComplete}>
            ✓ Verify Restoration
          </button>
        )}
      </div>

      {/* Tree views */}
      <div style={{ display: showOriginal && originalTree ? 'grid' : 'block', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: '#5a4e3c', marginBottom: 6 }}>
            {memoryCleared ? '🧹 Restored Tree (from archive)' : '🌳 Working Tree'}
          </div>
          {view === 'visual' ? (
            <TreeCanvas tree={workingTree} height={340} />
          ) : (
            <AsciiTreeView tree={workingTree} />
          )}
        </div>
        {showOriginal && originalTree && (
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#5a4e3c', marginBottom: 6 }}>👑 Target Tree</div>
            {view === 'visual' ? (
              <TreeCanvas tree={originalTree} height={340} readOnly />
            ) : (
              <AsciiTreeView tree={originalTree} />
            )}
          </div>
        )}
      </div>

      {/* Node builder */}
      {!isRestorationMission && !isCorruptedMission && (
        <div className="card">
          <div className="card-header"><span className="card-title">🔧 Tree Builder</span></div>
          <div className="card-body">
            <NodeBuilderToolbar
              onAddNode={addNode}
              onRemoveNode={removeNode}
              onDisconnect={disconnectNode}
              onReset={resetWorkingTree}
              selectedNodeId={selectedNodeId}
              tree={workingTree}
            />
            <p style={{ fontSize: 11, color: '#8a7a68', marginTop: 6 }}>
              {workingTree.root
                ? 'Click a node to select it, then add children below it.'
                : 'No root yet — type a label and click "+ Root" to begin.'}
            </p>
          </div>
        </div>
      )}

      {/* Quick serialize/restore */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">⚡ Quick Archive Actions</span>
        </div>
        <div className="card-body" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-secondary btn-sm" onClick={exportTree} disabled={!workingTree.root}>
            📤 Export
          </button>
          <button className="btn btn-secondary btn-sm" onClick={clearMemory} disabled={!serializedText || memoryCleared}>
            🧹 Clear Memory
          </button>
          <button className="btn btn-secondary btn-sm" onClick={handleRestoreAndVerify} disabled={!serializedText}>
            📥 Restore
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => useGameStore.getState().setScreen('archive_terminal')}>
            💾 Open Terminal →
          </button>
          <button className="btn btn-secondary btn-sm" onClick={() => useGameStore.getState().setScreen('traversal_lab')}>
            🔬 Traversal Lab →
          </button>
        </div>
      </div>
    </div>
  );
};
