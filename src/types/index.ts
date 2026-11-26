// ============================================================
// CORE TYPES FOR THE MUSEUM'S VANISHING FAMILY TREES GAME
// ============================================================

export interface TreeNode {
  id: string;
  label: string;
  left: TreeNode | null;
  right: TreeNode | null;
  x?: number;
  y?: number;
  metadata?: {
    era?: string;
    description?: string;
    isHighlighted?: boolean;
    isVisited?: boolean;
    isSelected?: boolean;
    isCorrect?: boolean;
    isIncorrect?: boolean;
    isMissing?: boolean;
  };
}

export interface BinaryTree {
  root: TreeNode | null;
  size: number;
}

export type TraversalType = 'preorder' | 'inorder' | 'postorder' | 'levelorder';

export interface TraversalStep {
  nodeId: string;
  label: string;
  stepIndex: number;
  traversalType: TraversalType;
}

export interface TraversalResult {
  sequence: string[];
  steps: TraversalStep[];
}

export interface SerializationResult {
  success: boolean;
  text: string;
  nodeCount: number;
  error?: string;
}

export interface DeserializationResult {
  success: boolean;
  tree: BinaryTree | null;
  error?: string;
  errorDetail?: string;
}

export interface ValidationError {
  type: 'missing_token' | 'extra_token' | 'invalid_label' | 'invalid_structure' | 'cycle' | 'too_large' | 'malformed';
  message: string;
  suggestion: string;
  position?: number;
}

// ============================================================
// MISSION TYPES
// ============================================================

export type MissionDifficulty = 'tutorial' | 'easy' | 'medium' | 'hard' | 'expert';
export type MissionStatus = 'locked' | 'available' | 'in_progress' | 'completed' | 'perfect';

export interface MissionObjective {
  id: string;
  description: string;
  completed: boolean;
  type: 'build_tree' | 'restore_tree' | 'identify_error' | 'traversal' | 'serialize' | 'deserialize';
}

export interface HintLevel {
  level: 1 | 2 | 3;
  text: string;
  penalty: number; // XP reduction
}

export interface Mission {
  id: string;
  number: number;
  chapter: number;
  title: string;
  story: string;
  objective: string;
  difficulty: MissionDifficulty;
  status: MissionStatus;
  objectives: MissionObjective[];
  hints: HintLevel[];
  reward: { xp: number; badge?: string; unlocks?: string[] };
  targetTree?: BinaryTree;
  serializedInput?: string; // for restoration missions
  corruptedInput?: string;  // for damage detection missions
  corruptionType?: ValidationError['type'];
  timeLimit?: number;       // seconds, 0 = no limit
  maxScore: number;
  score: number;
  starsEarned: number;
  completedAt?: number;
  hintsUsed: number;
}

// ============================================================
// PLAYER TYPES
// ============================================================

export type ArchivistRank =
  | 'Archive Trainee'
  | 'Branch Detective'
  | 'Tree Engineer'
  | 'Data Preservation Specialist'
  | 'Master Archivist';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: number;
}

export interface PlayerProgress {
  totalXP: number;
  level: number;
  rank: ArchivistRank;
  missionsCompleted: number;
  perfectMissions: number;
  totalStars: number;
  achievements: Achievement[];
  unlockedRooms: string[];
  currentMissionId: string | null;
  hintsUsed: number;
  lastSaved: number;
}

// ============================================================
// GAME STATE
// ============================================================

export type GameScreen =
  | 'dashboard'
  | 'mission_archive'
  | 'tree_restoration'
  | 'archive_terminal'
  | 'traversal_lab'
  | 'challenge_mode'
  | 'achievements'
  | 'settings';

export interface HistoryAction {
  type: 'add_node' | 'remove_node' | 'connect' | 'disconnect' | 'move';
  payload: unknown;
  timestamp: number;
}

export interface GameState {
  screen: GameScreen;
  currentMission: Mission | null;
  workingTree: BinaryTree;
  originalTree: BinaryTree | null;
  serializedText: string;
  memoryCleared: boolean;
  restoredTree: BinaryTree | null;
  selectedNodeId: string | null;
  traversalType: TraversalType;
  traversalSteps: TraversalStep[];
  traversalIndex: number;
  traversalPlaying: boolean;
  history: HistoryAction[];
  historyIndex: number;
  activityLog: string[];
  validationMessages: { type: 'success' | 'error' | 'info' | 'warning'; text: string }[];
  player: PlayerProgress;
  missions: Mission[];
  soundEnabled: boolean;
  showHints: boolean;
}
