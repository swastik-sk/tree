// ============================================================
// ACHIEVEMENTS SCREEN
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';

export const AchievementsScreen: React.FC = () => {
  const { player } = useGameStore();
  const unlocked = player.achievements.filter(a => a.unlocked).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="card">
        <div className="card-header">
          <span className="card-title">🏆 Achievement Gallery</span>
          <span style={{ fontSize: 12, color: '#8a7a68' }}>{unlocked} / {player.achievements.length} unlocked</span>
        </div>
        <div className="card-body">
          <div className="progress-bar" style={{ marginBottom: 16 }}>
            <div className="progress-fill" style={{ width: `${(unlocked / player.achievements.length) * 100}%`, background: '#c9a84c' }} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {player.achievements.map(ach => (
              <div key={ach.id} style={{
                padding: 16, borderRadius: 8,
                background: ach.unlocked ? '#faf7f2' : '#f3f0ea',
                border: `1px solid ${ach.unlocked ? '#c9a84c' : '#ddd5c6'}`,
                opacity: ach.unlocked ? 1 : 0.5,
                transition: 'all 0.2s',
              }}>
                <div style={{ fontSize: 32, marginBottom: 8 }}>{ach.icon}</div>
                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 13, fontWeight: 700, color: '#2c2416', marginBottom: 4 }}>
                  {ach.title}
                </div>
                <div style={{ fontSize: 11, color: '#8a7a68', lineHeight: 1.5 }}>{ach.description}</div>
                {ach.unlocked && ach.unlockedAt && (
                  <div style={{ fontSize: 10, color: '#c9a84c', marginTop: 8, fontWeight: 600 }}>
                    ✓ Unlocked {new Date(ach.unlockedAt).toLocaleDateString()}
                  </div>
                )}
                {!ach.unlocked && (
                  <div style={{ fontSize: 10, color: '#8a7a68', marginTop: 8 }}>🔒 Locked</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Rank progression */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🎖 Archivist Ranks</span>
        </div>
        <div className="card-body">
          {[
            { rank: 'Archive Trainee', xp: 0, icon: '📋' },
            { rank: 'Branch Detective', xp: 400, icon: '🔍' },
            { rank: 'Tree Engineer', xp: 1000, icon: '⚙' },
            { rank: 'Data Preservation Specialist', xp: 2000, icon: '💾' },
            { rank: 'Master Archivist', xp: 3000, icon: '🏛' },
          ].map(({ rank, xp, icon }) => (
            <div key={rank} style={{
              display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0',
              borderBottom: '1px solid #f0ebe2', opacity: player.totalXP >= xp ? 1 : 0.4,
            }}>
              <span style={{ fontSize: 24 }}>{icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#2c2416', fontSize: 13 }}>{rank}</div>
                <div style={{ fontSize: 11, color: '#8a7a68' }}>Required: {xp.toLocaleString()} XP</div>
              </div>
              {player.totalXP >= xp && (
                <span style={{ color: '#4a7c59', fontSize: 12, fontWeight: 600 }}>✓ Achieved</span>
              )}
              {player.rank === rank && (
                <span style={{ background: '#c9a84c', color: '#2c2416', padding: '2px 8px', borderRadius: 4, fontSize: 10, fontWeight: 700 }}>CURRENT</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================
// SETTINGS SCREEN
// ============================================================

export const SettingsScreen: React.FC = () => {
  const { soundEnabled, showHints, setSoundEnabled, setShowHints, player } = useGameStore();

  const handleReset = () => {
    if (window.confirm('Reset ALL progress? This cannot be undone!')) {
      localStorage.removeItem('museum-game-save');
      window.location.reload();
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, maxWidth: 600 }}>
      <div className="card">
        <div className="card-header"><span className="card-title">⚙ Settings</span></div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            { label: 'Sound Effects', desc: 'Enable audio feedback for interactions', value: soundEnabled, onChange: setSoundEnabled },
            { label: 'Hint System', desc: 'Show hints panel during missions', value: showHints, onChange: setShowHints },
          ].map(({ label, desc, value, onChange }) => (
            <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid #f0ebe2' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13, color: '#2c2416' }}>{label}</div>
                <div style={{ fontSize: 11, color: '#8a7a68', marginTop: 2 }}>{desc}</div>
              </div>
              <button
                onClick={() => onChange(!value)}
                style={{
                  width: 48, height: 26, borderRadius: 13, border: 'none', cursor: 'pointer',
                  background: value ? '#c9a84c' : '#ddd5c6',
                  position: 'relative', transition: 'background 0.2s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 3, left: value ? 'calc(100% - 23px)' : 3,
                  width: 20, height: 20, background: 'white', borderRadius: '50%',
                  transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Player info */}
      <div className="card">
        <div className="card-header"><span className="card-title">👤 Archivist Profile</span></div>
        <div className="card-body">
          <div className="node-info-row"><span className="node-info-label">Rank</span><span className="node-info-value">{player.rank}</span></div>
          <div className="node-info-row"><span className="node-info-label">Total XP</span><span className="node-info-value">{player.totalXP}</span></div>
          <div className="node-info-row"><span className="node-info-label">Level</span><span className="node-info-value">{player.level}</span></div>
          <div className="node-info-row"><span className="node-info-label">Missions done</span><span className="node-info-value">{player.missionsCompleted}</span></div>
          <div className="node-info-row" style={{ border: 'none' }}>
            <span className="node-info-label">Last saved</span>
            <span className="node-info-value" style={{ fontSize: 11 }}>{new Date(player.lastSaved).toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* How to play */}
      <div className="card">
        <div className="card-header"><span className="card-title">📖 How to Play</span></div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {[
            ['🌳 Build Trees', 'Add a root node, then add children by selecting a parent node first. Set left or right side before adding.'],
            ['💾 Serialization', 'Export any tree to preorder text with null markers (#). Every # marks an absent child branch.'],
            ['🧹 Memory Clear', 'After exporting, clear memory. The original tree is gone. Restore ONLY from the archive text.'],
            ['✓ Verification', 'After restoring, compare traversals and use Verify Restoration to confirm structural identity.'],
            ['🔍 Error Detection', 'Some missions give you corrupted archive text. Submit it to find the exact error.'],
          ].map(([title, desc]) => (
            <div key={title as string} style={{ background: '#f7f3ed', border: '1px solid #ddd5c6', borderRadius: 6, padding: '10px 12px' }}>
              <div style={{ fontWeight: 600, fontSize: 12, color: '#2c2416', marginBottom: 4 }}>{title}</div>
              <div style={{ fontSize: 11, color: '#5a4e3c', lineHeight: 1.5 }}>{desc}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Danger zone */}
      <div className="card" style={{ borderColor: '#d4634a' }}>
        <div className="card-header" style={{ borderBottomColor: '#d4634a' }}>
          <span className="card-title" style={{ color: '#d4634a' }}>⚠ Danger Zone</span>
        </div>
        <div className="card-body">
          <button className="btn btn-danger" onClick={handleReset}>
            🗑 Reset All Progress
          </button>
          <p style={{ fontSize: 11, color: '#8a7a68', marginTop: 8 }}>
            This will permanently delete all saved progress, XP, and achievements.
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// CHALLENGE MODE SCREEN
// ============================================================

import { makeTree, makeNode, damageArchive, deserialize, serialize } from '../engine/treeAlgorithms';
import { TreeCanvas } from '../components/TreeCanvas';

function generateRandomTree(depth: number): import('../types').BinaryTree {
  const labels = ['A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q'];
  let idx = 0;
  function build(d: number): import('../types').TreeNode | null {
    if (d <= 0 || idx >= labels.length) return null;
    const label = labels[idx++];
    const leftProb = d > 1 ? 0.75 : 0.3;
    const rightProb = d > 1 ? 0.75 : 0.3;
    const left = Math.random() < leftProb ? build(d - 1) : null;
    const right = Math.random() < rightProb ? build(d - 1) : null;
    return makeNode(label, left, right);
  }
  return makeTree(build(depth));
}

export const ChallengeModeScreen: React.FC = () => {
  const { addValidation, addLog, setWorkingTree } = useGameStore();
  const [challengeTree, setChallengeTree] = React.useState<import('../types').BinaryTree | null>(null);
  const [archived, setArchived] = React.useState('');
  const [damaged, setDamaged] = React.useState('');
  const [userInput, setUserInput] = React.useState('');
  const [phase, setPhase] = React.useState<'generate' | 'export' | 'damage' | 'detect' | 'done'>('generate');

  const handleGenerate = () => {
    const tree = generateRandomTree(4);
    setChallengeTree(tree);
    setWorkingTree(tree);
    setPhase('export');
    addLog('Challenge tree generated');
  };

  const handleExport = () => {
    if (!challengeTree) return;
    const result = serialize(challengeTree);
    setArchived(result.text);
    setPhase('damage');
    addLog('Tree exported for challenge');
  };

  const handleDamage = () => {
    const types: Array<'missing_null' | 'extra_token' | 'invalid_label' | 'truncate'> = ['missing_null', 'extra_token', 'invalid_label', 'truncate'];
    const type = types[Math.floor(Math.random() * types.length)];
    const dmg = damageArchive(archived, type);
    setDamaged(dmg);
    setPhase('detect');
    addLog(`Archive damaged (type hidden from player)`);
  };

  const handleCheck = () => {
    const result = deserialize(userInput || damaged);
    if (!result.success) {
      addValidation('success', `✅ Correct! You identified the error: ${result.error}`);
      addLog(`Challenge: error correctly identified`);
    } else {
      addValidation('error', '❌ No error found — but there is one! Look more carefully.');
    }
    setPhase('done');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 700 }}>
      <div className="card" style={{ background: 'linear-gradient(135deg, #2c2416, #3d3020)', border: 'none', color: '#f7f3ed' }}>
        <div className="card-body">
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: '#c9a84c', marginBottom: 6 }}>⚔ Challenge Mode</div>
          <p style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.6 }}>
            A random tree is generated, exported, and then secretly damaged. Your job is to find the error in the corrupted archive.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={handleGenerate}>🎲 Generate New Tree</button>
        {phase !== 'generate' && <button className="btn btn-secondary" onClick={handleExport} disabled={phase !== 'export'}>📤 Export</button>}
        {phase === 'damage' && <button className="btn btn-danger" onClick={handleDamage}>💥 Damage Archive</button>}
        {phase === 'detect' && <button className="btn btn-success" onClick={handleCheck}>🔍 Submit Detection</button>}
      </div>

      {challengeTree && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#5a4e3c', marginBottom: 6 }}>Challenge Tree</div>
            <TreeCanvas tree={challengeTree} height={250} readOnly />
          </div>
          <div>
            {archived && (
              <div className="card" style={{ marginBottom: 10 }}>
                <div className="card-header"><span className="card-title">Original Archive</span></div>
                <div className="card-body">
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, wordBreak: 'break-all', color: '#4a7c59' }}>{archived}</div>
                </div>
              </div>
            )}
            {damaged && (
              <div className="card" style={{ borderColor: '#d4634a' }}>
                <div className="card-header"><span className="card-title" style={{ color: '#d4634a' }}>⚠ Damaged Archive</span></div>
                <div className="card-body">
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, wordBreak: 'break-all', color: '#880e4f', background: '#fce4ec', padding: '8px', borderRadius: 4 }}>{damaged}</div>
                  <textarea
                    style={{ marginTop: 10, width: '100%', fontFamily: "'JetBrains Mono', monospace", fontSize: 11, padding: 8, border: '1px solid #c8b89a', borderRadius: 4, background: '#faf7f2', resize: 'none' }}
                    rows={2} placeholder="Optionally paste corrected version..."
                    value={userInput} onChange={e => setUserInput(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {phase === 'done' && (
        <button className="btn btn-primary" onClick={() => { setPhase('generate'); setChallengeTree(null); setArchived(''); setDamaged(''); setUserInput(''); }}>
          🔄 New Challenge
        </button>
      )}
    </div>
  );
};


