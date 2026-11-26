// ============================================================
// GAME STATE MANAGEMENT (Zustand store)
// ============================================================

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  GameState, GameScreen, BinaryTree, TreeNode, TraversalType,
  Mission, PlayerProgress, ArchivistRank, Achievement, HistoryAction
} from '../types';
import {
  makeTree, makeNode, cloneTree, serialize, deserialize, traverse,
  treesAreEqual, findNode, findParent, countNodes, newId, validateTree, damageArchive
} from '../engine/treeAlgorithms';
import { MISSIONS } from '../engine/missions';

// ---- Rank thresholds ----
function computeRank(xp: number): ArchivistRank {
  if (xp >= 3000) return 'Master Archivist';
  if (xp >= 2000) return 'Data Preservation Specialist';
  if (xp >= 1000) return 'Tree Engineer';
  if (xp >= 400) return 'Branch Detective';
  return 'Archive Trainee';
}

function computeLevel(xp: number): number {
  return Math.floor(xp / 200) + 1;
}

// ---- Achievements ----
const ACHIEVEMENT_DEFS: Achievement[] = [
  { id: 'first_tree', title: 'First Record', description: 'Complete your first mission', icon: '🌳', unlocked: false },
  { id: 'perfect_mission', title: 'Perfect Restoration', description: 'Complete a mission without using hints', icon: '⭐', unlocked: false },
  { id: 'memory_clear', title: 'Clean Slate', description: 'Complete the memory clear mission', icon: '🧹', unlocked: false },
  { id: 'error_detective', title: 'Error Detective', description: 'Correctly identify a corrupted archive', icon: '🔍', unlocked: false },
  { id: 'five_missions', title: 'Dedicated Archivist', description: 'Complete 5 missions', icon: '📚', unlocked: false },
  { id: 'master_archivist', title: 'Master Archivist', description: 'Complete all 12 missions', icon: '🏆', unlocked: false },
  { id: 'no_hints_three', title: 'Self-Sufficient', description: 'Complete 3 missions without hints', icon: '💡', unlocked: false },
  { id: 'traversal_expert', title: 'Traversal Expert', description: 'Run all 4 traversal types', icon: '🔄', unlocked: false },
];

function defaultPlayer(): PlayerProgress {
  return {
    totalXP: 0, level: 1, rank: 'Archive Trainee',
    missionsCompleted: 0, perfectMissions: 0, totalStars: 0,
    achievements: JSON.parse(JSON.stringify(ACHIEVEMENT_DEFS)),
    unlockedRooms: ['lobby'],
    currentMissionId: null,
    hintsUsed: 0,
    lastSaved: Date.now(),
  };
}

function emptyTree(): BinaryTree { return makeTree(null); }

export interface GameStore extends GameState {
  // Navigation
  setScreen: (screen: GameScreen) => void;

  // Mission
  startMission: (missionId: string) => void;
  completeMission: (missionId: string, score: number) => void;

  // Tree building
  addNode: (label: string, parentId?: string, side?: 'left' | 'right') => string | null;
  removeNode: (nodeId: string) => void;
  connectNode: (parentId: string, childId: string, side: 'left' | 'right') => boolean;
  disconnectNode: (nodeId: string) => void;
  setSelectedNode: (nodeId: string | null) => void;
  resetWorkingTree: () => void;
  setWorkingTree: (tree: BinaryTree) => void;

  // Archive terminal
  exportTree: () => void;
  restoreTree: () => void;
  clearMemory: () => void;
  verifyRestoration: () => boolean;
  setSerializedText: (text: string) => void;
  damageFile: (damageType: 'missing_null' | 'extra_token' | 'invalid_label' | 'truncate') => void;

  // Traversal
  setTraversalType: (type: TraversalType) => void;
  startTraversal: () => void;
  stepTraversal: () => void;
  resetTraversal: () => void;
  toggleTraversalPlay: () => void;

  // Undo/redo
  undo: () => void;
  redo: () => void;

  // Logs
  addLog: (msg: string) => void;
  addValidation: (type: 'success' | 'error' | 'info' | 'warning', text: string) => void;
  clearValidation: () => void;

  // Settings
  setSoundEnabled: (enabled: boolean) => void;
  setShowHints: (show: boolean) => void;

  // Hints
  useHint: (level: 1 | 2 | 3) => void;

  // traversal tracking
  _traversalTracker: Set<string>;
}

export const useGameStore = create<GameStore>()(
  persist(
    (set, get) => ({
      screen: 'dashboard',
      currentMission: null,
      workingTree: emptyTree(),
      originalTree: null,
      serializedText: '',
      memoryCleared: false,
      restoredTree: null,
      selectedNodeId: null,
      traversalType: 'preorder',
      traversalSteps: [],
      traversalIndex: -1,
      traversalPlaying: false,
      history: [],
      historyIndex: -1,
      activityLog: [],
      validationMessages: [],
      player: defaultPlayer(),
      missions: JSON.parse(JSON.stringify(MISSIONS)),
      soundEnabled: true,
      showHints: true,
      _traversalTracker: new Set(),

      setScreen: (screen) => set({ screen }),

      startMission: (missionId) => {
        const missions = get().missions;
        const mission = missions.find(m => m.id === missionId);
        if (!mission) return;
        const updatedMissions = missions.map(m =>
          m.id === missionId ? { ...m, status: 'in_progress' as const } : m
        );
        // Load target tree if this is a restoration mission
        let workingTree = emptyTree();
        if (mission.serializedInput && !mission.targetTree) {
          const result = deserialize(mission.serializedInput);
          if (result.success && result.tree) workingTree = result.tree;
        } else if (mission.targetTree) {
          workingTree = emptyTree(); // player must build
        }

        set({
          currentMission: { ...mission, status: 'in_progress' },
          missions: updatedMissions,
          workingTree,
          originalTree: mission.targetTree ? cloneTree(mission.targetTree) : null,
          serializedText: '',
          memoryCleared: false,
          restoredTree: null,
          selectedNodeId: null,
          traversalSteps: [],
          traversalIndex: -1,
          activityLog: [`Started mission: ${mission.title}`],
          validationMessages: [],
          screen: 'tree_restoration',
        });
      },

      completeMission: (missionId, score) => {
        const state = get();
        const missions = state.missions.map(m => {
          if (m.id !== missionId) return m;
          const stars = score >= m.maxScore * 0.9 ? 3 : score >= m.maxScore * 0.6 ? 2 : 1;
          return { ...m, status: 'completed' as const, score, starsEarned: stars };
        });
        // Unlock next mission
        const idx = missions.findIndex(m => m.id === missionId);
        const updated = missions.map((m, i) => {
          if (i === idx + 1 && m.status === 'locked') return { ...m, status: 'available' as const };
          return m;
        });
        const mission = missions[idx];
        const player = { ...state.player };
        player.totalXP += score;
        player.level = computeLevel(player.totalXP);
        player.rank = computeRank(player.totalXP);
        player.missionsCompleted++;
        player.totalStars += mission.starsEarned;
        if (mission.hintsUsed === 0) player.perfectMissions++;
        if (mission.reward.unlocks) {
          player.unlockedRooms = [...player.unlockedRooms, ...mission.reward.unlocks];
        }
        // Check achievements
        const achievements = player.achievements.map(a => {
          if (a.unlocked) return a;
          if (a.id === 'first_tree' && player.missionsCompleted >= 1) return { ...a, unlocked: true, unlockedAt: Date.now() };
          if (a.id === 'perfect_mission' && player.perfectMissions >= 1) return { ...a, unlocked: true, unlockedAt: Date.now() };
          if (a.id === 'five_missions' && player.missionsCompleted >= 5) return { ...a, unlocked: true, unlockedAt: Date.now() };
          if (a.id === 'master_archivist' && player.missionsCompleted >= 12) return { ...a, unlocked: true, unlockedAt: Date.now() };
          if (a.id === 'memory_clear' && missionId === 'mission_08') return { ...a, unlocked: true, unlockedAt: Date.now() };
          if (a.id === 'error_detective' && missionId === 'mission_09') return { ...a, unlocked: true, unlockedAt: Date.now() };
          if (a.id === 'no_hints_three' && player.perfectMissions >= 3) return { ...a, unlocked: true, unlockedAt: Date.now() };
          return a;
        });
        player.achievements = achievements;
        player.lastSaved = Date.now();
        set({ missions: updated, player, currentMission: null });
      },

      addNode: (label, parentId?, side?) => {
        const state = get();
        const tree = state.workingTree;
        const validation = validateTree(tree.root);
        if (!validation.valid) {
          get().addValidation('error', 'Tree has integrity issues. Reset before adding nodes.');
          return null;
        }
        const node = makeNode(label);
        let newRoot = tree.root;

        if (!parentId) {
          if (tree.root) {
            get().addValidation('error', 'A root already exists. Select a parent node first.');
            return null;
          }
          newRoot = node;
        } else {
          const parent = findNode(tree.root, parentId);
          if (!parent) { get().addValidation('error', 'Parent node not found.'); return null; }
          if (side === 'left') {
            if (parent.left) { get().addValidation('error', 'Left child already exists. Disconnect it first.'); return null; }
            parent.left = node;
          } else if (side === 'right') {
            if (parent.right) { get().addValidation('error', 'Right child already exists. Disconnect it first.'); return null; }
            parent.right = node;
          } else {
            get().addValidation('error', 'Specify left or right side.'); return null;
          }
        }
        const newTree: BinaryTree = { root: newRoot, size: countNodes(newRoot) };
        get().addLog(`Added node "${label}"${parentId ? ` as ${side} child` : ' as root'}`);
        set({ workingTree: newTree });
        return node.id;
      },

      removeNode: (nodeId) => {
        const state = get();
        const tree = state.workingTree;
        if (tree.root?.id === nodeId) {
          set({ workingTree: emptyTree() });
          get().addLog('Removed root node');
          return;
        }
        const parent = findParent(tree.root, nodeId);
        if (!parent) { get().addValidation('error', 'Node not found.'); return; }
        if (parent.side === 'left') parent.node.left = null;
        else parent.node.right = null;
        const newTree: BinaryTree = { root: tree.root, size: countNodes(tree.root) };
        get().addLog(`Removed node`);
        set({ workingTree: newTree });
      },

      connectNode: (parentId, childId, side) => {
        const state = get();
        const root = state.workingTree.root;
        const parent = findNode(root, parentId);
        const child = findNode(root, childId);
        if (!parent || !child) { get().addValidation('error', 'Node not found.'); return false; }
        if (side === 'left') {
          if (parent.left) { get().addValidation('error', 'Left child already exists.'); return false; }
          parent.left = child;
        } else {
          if (parent.right) { get().addValidation('error', 'Right child already exists.'); return false; }
          parent.right = child;
        }
        const v = validateTree(root);
        if (!v.valid) {
          if (side === 'left') parent.left = null; else parent.right = null;
          get().addValidation('error', `Connection would create a cycle.`);
          return false;
        }
        const newTree: BinaryTree = { root, size: countNodes(root) };
        get().addLog(`Connected node as ${side} child`);
        set({ workingTree: newTree });
        return true;
      },

      disconnectNode: (nodeId) => {
        const state = get();
        const root = state.workingTree.root;
        const parent = findParent(root, nodeId);
        if (!parent) { get().addValidation('error', 'Cannot find parent to disconnect from.'); return; }
        if (parent.side === 'left') parent.node.left = null;
        else parent.node.right = null;
        const newTree: BinaryTree = { root, size: countNodes(root) };
        get().addLog('Disconnected node from parent');
        set({ workingTree: newTree });
      },

      setSelectedNode: (nodeId) => set({ selectedNodeId: nodeId }),

      resetWorkingTree: () => {
        set({ workingTree: emptyTree(), selectedNodeId: null, traversalSteps: [], traversalIndex: -1 });
        get().addLog('Reset working tree');
        get().addValidation('info', 'Tree cleared. Start fresh.');
      },

      setWorkingTree: (tree) => set({ workingTree: tree }),

      exportTree: () => {
        const state = get();
        const result = serialize(state.workingTree);
        if (!result.success) {
          get().addValidation('error', `Export failed: ${result.error}`);
          return;
        }
        get().addLog(`Exported tree (${result.nodeCount} nodes) → ${result.text.slice(0, 60)}...`);
        get().addValidation('success', `Archive exported: ${result.nodeCount} node(s) encoded.`);
        set({ serializedText: result.text, originalTree: cloneTree(state.workingTree) });
      },

      restoreTree: () => {
        const state = get();
        if (!state.serializedText) {
          get().addValidation('error', 'No archive text to restore from. Export a tree first.');
          return;
        }
        const result = deserialize(state.serializedText);
        if (!result.success || !result.tree) {
          get().addValidation('error', `❌ Restoration failed: ${result.error}. ${result.errorDetail}`);
          get().addLog(`Restoration error: ${result.error}`);
          return;
        }
        get().addLog(`Restored tree from archive text (${countNodes(result.tree.root)} nodes)`);
        get().addValidation('success', 'Tree successfully restored from archive text!');
        set({ restoredTree: result.tree, workingTree: result.tree });
      },

      clearMemory: () => {
        const state = get();
        if (!state.serializedText) {
          get().addValidation('warning', 'Export the tree first before clearing memory.');
          return;
        }
        get().addLog('⚠ Memory cleared — original tree data deleted. Only archive text remains.');
        get().addValidation('info', 'Memory cleared. The original tree is gone. Restore from archive text only.');
        set({ workingTree: emptyTree(), memoryCleared: true, originalTree: null, selectedNodeId: null });
      },

      verifyRestoration: () => {
        const state = get();
        const a = state.originalTree?.root ?? state.restoredTree?.root ?? null;
        const b = state.restoredTree?.root ?? state.workingTree.root ?? null;
        if (!b) { get().addValidation('error', 'No restored tree to verify.'); return false; }
        const equal = treesAreEqual(a, b);
        if (equal) {
          get().addValidation('success', '✅ Verification passed! Restored tree matches the original structure perfectly.');
          get().addLog('Verification: PASSED — trees are structurally identical');
        } else {
          get().addValidation('error', '❌ Verification failed. The restored tree differs from the original. Check labels and branch positions.');
          get().addLog('Verification: FAILED — structural mismatch');
        }
        return equal;
      },

      setSerializedText: (text) => set({ serializedText: text }),

      damageFile: (damageType) => {
        const { serializedText } = get();
        if (!serializedText) { get().addValidation('warning', 'No archive text to damage.'); return; }
        const damaged = damageArchive(serializedText, damageType);
        get().addLog(`⚠ Archive damaged (type: ${damageType})`);
        get().addValidation('warning', `File damaged with: ${damageType}. Try restoring to see the error.`);
        set({ serializedText: damaged });
      },

      setTraversalType: (type) => {
        set({ traversalType: type, traversalSteps: [], traversalIndex: -1, traversalPlaying: false });
      },

      startTraversal: () => {
        const state = get();
        const result = traverse(state.workingTree, state.traversalType);
        get().addLog(`Started ${state.traversalType} traversal (${result.steps.length} nodes)`);
        set({ traversalSteps: result.steps, traversalIndex: 0 });

        // Track traversal types used
        const tracker = new Set(state._traversalTracker);
        tracker.add(state.traversalType);
        set({ _traversalTracker: tracker });
        if (tracker.size >= 4) {
          const player = { ...state.player };
          const ach = player.achievements.map(a =>
            a.id === 'traversal_expert' && !a.unlocked ? { ...a, unlocked: true, unlockedAt: Date.now() } : a
          );
          player.achievements = ach;
          set({ player });
        }
      },

      stepTraversal: () => {
        const { traversalIndex, traversalSteps } = get();
        if (traversalIndex < traversalSteps.length - 1) {
          set({ traversalIndex: traversalIndex + 1 });
        } else {
          set({ traversalPlaying: false });
          get().addLog('Traversal complete');
        }
      },

      resetTraversal: () => set({ traversalIndex: -1, traversalPlaying: false }),

      toggleTraversalPlay: () => {
        const { traversalPlaying, traversalSteps, traversalIndex } = get();
        if (traversalIndex >= traversalSteps.length - 1) {
          set({ traversalIndex: 0, traversalPlaying: true });
        } else {
          set({ traversalPlaying: !traversalPlaying });
        }
      },

      undo: () => {
        // Simplified: just log
        get().addLog('Undo requested');
        get().addValidation('info', 'Undo: use Reset to clear the entire tree if needed.');
      },
      redo: () => {
        get().addLog('Redo requested');
      },

      addLog: (msg) => {
        const ts = new Date().toLocaleTimeString();
        set(s => ({ activityLog: [`[${ts}] ${msg}`, ...s.activityLog].slice(0, 50) }));
      },

      addValidation: (type, text) => {
        set(s => ({ validationMessages: [{ type, text }, ...s.validationMessages].slice(0, 10) }));
      },

      clearValidation: () => set({ validationMessages: [] }),

      setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
      setShowHints: (show) => set({ showHints: show }),

      useHint: (level) => {
        const { currentMission, player } = get();
        if (!currentMission) return;
        const updatedMissions = get().missions.map(m =>
          m.id === currentMission.id ? { ...m, hintsUsed: Math.max(m.hintsUsed, level) } : m
        );
        set({ missions: updatedMissions, currentMission: { ...currentMission, hintsUsed: level }, player: { ...player, hintsUsed: player.hintsUsed + 1 } });
        get().addLog(`Hint ${level} used`);
      },
    }),
    {
      name: 'museum-game-save',
      partialize: (state) => ({
        player: state.player,
        missions: state.missions,
        soundEnabled: state.soundEnabled,
        showHints: state.showHints,
      }),
    }
  )
);
