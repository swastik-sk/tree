// ============================================================
// DASHBOARD SCREEN
// ============================================================

import React from 'react';
import { useGameStore } from '../store/gameStore';

export const Dashboard: React.FC = () => {
  const { player, missions, setScreen, startMission } = useGameStore();

  const completedCount = missions.filter(m => m.status === 'completed' || m.status === 'perfect').length;
  const availableCount = missions.filter(m => m.status === 'available').length;
  const inProgress = missions.find(m => m.status === 'in_progress');
  const nextMission = missions.find(m => m.status === 'available');

  const stats = [
    { label: 'Total XP', value: player.totalXP.toLocaleString(), icon: '⚡' },
    { label: 'Level', value: player.level, icon: '📈' },
    { label: 'Missions Done', value: completedCount, icon: '✅' },
    { label: 'Total Stars', value: player.totalStars, icon: '⭐' },
    { label: 'Perfect Runs', value: player.perfectMissions, icon: '💎' },
    { label: 'Achievements', value: `${player.achievements.filter(a => a.unlocked).length}/${player.achievements.length}`, icon: '🏆' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Welcome */}
      <div className="card" style={{ background: 'linear-gradient(135deg, #2c2416 0%, #3d3020 100%)', color: '#f7f3ed', border: 'none' }}>
        <div className="card-body">
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: '#c9a84c', marginBottom: 6 }}>
            Welcome, {player.rank}
          </div>
          <p style={{ fontSize: 13, color: '#c8b89a', lineHeight: 1.6, maxWidth: 500 }}>
            The museum's historical family records are at risk. Ancient binary trees were corrupted during a system migration.
            Your mission: restore every vanishing family tree before history is lost forever.
          </p>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            {inProgress && (
              <button className="btn btn-primary" onClick={() => startMission(inProgress.id)}>
                ▶ Continue: {inProgress.title}
              </button>
            )}
            {!inProgress && nextMission && (
              <button className="btn btn-primary" onClick={() => startMission(nextMission.id)}>
                ▶ Start Next Mission
              </button>
            )}
            <button className="btn btn-secondary" style={{ color: '#c8b89a', borderColor: '#5a4e3c' }} onClick={() => setScreen('mission_archive')}>
              📜 All Missions
            </button>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
        {stats.map(stat => (
          <div key={stat.label} className="card" style={{ padding: 16, textAlign: 'center' }}>
            <div style={{ fontSize: 24, marginBottom: 4 }}>{stat.icon}</div>
            <div style={{ fontFamily: "'Cinzel', serif", fontSize: 20, fontWeight: 700, color: '#c9a84c' }}>{stat.value}</div>
            <div style={{ fontSize: 11, color: '#8a7a68', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 2 }}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Recent missions */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">📋 Mission Progress</span>
          <span style={{ fontSize: 12, color: '#8a7a68' }}>{completedCount} / {missions.length} complete</span>
        </div>
        <div className="card-body">
          <div className="progress-bar" style={{ marginBottom: 12 }}>
            <div className="progress-fill" style={{ width: `${(completedCount / missions.length) * 100}%`, background: '#4a7c59' }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {missions.slice(0, 6).map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 0', borderBottom: '1px solid #f0ebe2' }}>
                <span style={{ width: 24, fontSize: 14 }}>
                  {m.status === 'completed' || m.status === 'perfect' ? '✅' : m.status === 'in_progress' ? '▶' : m.status === 'available' ? '🔓' : '🔒'}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: m.status === 'locked' ? '#c8b89a' : '#2c2416' }}>
                  M{m.number}: {m.title}
                </span>
                <div className="stars">
                  {[1,2,3].map(s => (
                    <span key={s} className={`star ${s <= m.starsEarned ? 'filled' : 'empty'}`}>★</span>
                  ))}
                </div>
                {(m.status === 'available' || m.status === 'in_progress') && (
                  <button className="btn btn-primary btn-sm" onClick={() => startMission(m.id)}>
                    {m.status === 'in_progress' ? 'Resume' : 'Start'}
                  </button>
                )}
              </div>
            ))}
          </div>
          {completedCount < missions.length && (
            <button className="btn btn-secondary" style={{ marginTop: 12 }} onClick={() => setScreen('mission_archive')}>
              View all missions →
            </button>
          )}
        </div>
      </div>

      {/* Recent achievements */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">🏆 Achievements</span>
          <span style={{ fontSize: 12, color: '#8a7a68' }}>{player.achievements.filter(a => a.unlocked).length} unlocked</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10 }}>
            {player.achievements.map(ach => (
              <div key={ach.id} className="tooltip-wrapper" style={{
                textAlign: 'center', padding: '12px 8px',
                background: ach.unlocked ? '#faf7f2' : '#f3f0ea',
                border: `1px solid ${ach.unlocked ? '#c9a84c' : '#ddd5c6'}`,
                borderRadius: 8, opacity: ach.unlocked ? 1 : 0.4,
              }}>
                <div style={{ fontSize: 24, marginBottom: 4 }}>{ach.icon}</div>
                <div style={{ fontSize: 10, fontWeight: 600, color: '#5a4e3c', lineHeight: 1.3 }}>{ach.title}</div>
                <div className="tooltip-content">{ach.description}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// MISSION ARCHIVE SCREEN
// ============================================================

const CHAPTER_NAMES = ['', 'The First Record', 'The Broken Branches', 'The Lost Archives', 'The Corrupted Records', 'The Master Archivist'];
const DIFF_ICONS: Record<string, string> = { tutorial: '📚', easy: '🌱', medium: '🔥', hard: '⚡', expert: '💀' };

export const MissionArchive: React.FC = () => {
  const { missions, startMission } = useGameStore();
  const chapters = [...new Set(missions.map(m => m.chapter))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {chapters.map(ch => (
        <div key={ch}>
          <div style={{ fontFamily: "'Cinzel', serif", fontSize: 15, fontWeight: 700, color: '#2c2416', marginBottom: 12, paddingBottom: 8, borderBottom: '2px solid #c9a84c' }}>
            Chapter {ch}: {CHAPTER_NAMES[ch]}
          </div>
          <div className="mission-grid">
            {missions.filter(m => m.chapter === ch).map(m => (
              <div
                key={m.id}
                className={`mission-card ${m.status === 'locked' ? 'locked' : m.status}`}
                onClick={() => m.status !== 'locked' && startMission(m.id)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#8a7a68' }}>MISSION {m.number.toString().padStart(2, '0')}</span>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span className={`badge badge-${m.difficulty}`}>{DIFF_ICONS[m.difficulty]} {m.difficulty}</span>
                    {m.status === 'locked' && <span>🔒</span>}
                  </div>
                </div>

                <div style={{ fontFamily: "'Cinzel', serif", fontSize: 14, fontWeight: 700, color: '#2c2416', marginBottom: 6 }}>
                  {m.title}
                </div>
                <p style={{ fontSize: 11, color: '#8a7a68', lineHeight: 1.5, marginBottom: 10 }}>
                  {m.story.slice(0, 100)}...
                </p>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div className="stars">
                    {[1,2,3].map(s => (
                      <span key={s} className={`star ${s <= m.starsEarned ? 'filled' : 'empty'}`}>★</span>
                    ))}
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <span style={{ fontSize: 11, color: '#c9a84c', fontWeight: 600 }}>+{m.reward.xp} XP</span>
                    {m.reward.badge && <span style={{ fontSize: 11, color: '#8a7a68' }}>🎖 {m.reward.badge}</span>}
                  </div>
                </div>

                {(m.status === 'completed' || m.status === 'perfect') && m.score > 0 && (
                  <div style={{ marginTop: 8, fontSize: 11, color: '#4a7c59', fontWeight: 600 }}>
                    Score: {m.score} / {m.maxScore}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
