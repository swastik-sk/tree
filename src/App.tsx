// ============================================================
// MAIN APP – Museum's Vanishing Family Trees
// ============================================================

import React from 'react';
import './styles/global.css';
import { useGameStore } from './store/gameStore';
import { Sidebar, RightPanel, BottomPanel } from './components/Layout';
import { Dashboard, MissionArchive } from './screens/Dashboard';
import { TreeRestorationScreen } from './screens/TreeRestoration';
import { ArchiveTerminal } from './components/ArchiveTerminal';
import { TraversalLab } from './components/TraversalLab';
import { AchievementsScreen, SettingsScreen, ChallengeModeScreen } from './screens/Other';
import { TreeCanvas } from './components/TreeCanvas';

const SCREEN_TITLES: Record<string, { title: string; subtitle: string }> = {
  dashboard: { title: 'Museum Archive', subtitle: 'Historical Records Recovery System' },
  mission_archive: { title: 'Mission Archive', subtitle: 'Select and manage restoration missions' },
  tree_restoration: { title: 'Tree Restoration', subtitle: 'Interactive binary tree puzzle workspace' },
  archive_terminal: { title: 'Archive Terminal', subtitle: 'Serialization and deserialization system' },
  traversal_lab: { title: 'Traversal Laboratory', subtitle: 'Animate and analyze tree traversals' },
  challenge_mode: { title: 'Challenge Mode', subtitle: 'Random trees, real damage, real detection' },
  achievements: { title: 'Achievements', subtitle: 'Your archivist progress and ranks' },
  settings: { title: 'Settings', subtitle: 'Configure your archive workspace' },
};

export default function App() {
  const { screen, workingTree, player } = useGameStore();
  const info = SCREEN_TITLES[screen] || SCREEN_TITLES['dashboard'];

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-area">
        {/* Page header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">{info.title}</h1>
            <p className="page-subtitle">{info.subtitle}</p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ display: 'flex', gap: 16, fontSize: 12, color: '#8a7a68' }}>
              <span>⚡ <strong style={{ color: '#c9a84c' }}>{player.totalXP}</strong> XP</span>
              <span>📈 Lv.<strong style={{ color: '#c9a84c' }}>{player.level}</strong></span>
              <span>🎖 <strong style={{ color: '#c9a84c' }}>{player.rank}</strong></span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="content-row">
          <div className="main-content">
            {screen === 'dashboard' && <Dashboard />}
            {screen === 'mission_archive' && <MissionArchive />}
            {screen === 'tree_restoration' && <TreeRestorationScreen />}
            {screen === 'archive_terminal' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <ArchiveTerminal />
                <div className="card">
                  <div className="card-header"><span className="card-title">🌳 Current Tree View</span></div>
                  <div className="card-body">
                    <TreeCanvas tree={workingTree} height={280} />
                  </div>
                </div>
              </div>
            )}
            {screen === 'traversal_lab' && <TraversalLab />}
            {screen === 'challenge_mode' && <ChallengeModeScreen />}
            {screen === 'achievements' && <AchievementsScreen />}
            {screen === 'settings' && <SettingsScreen />}
          </div>

          <RightPanel tree={workingTree} />
        </div>

        <BottomPanel />
      </div>
    </div>
  );
}
