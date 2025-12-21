export type PowerupId =
  | 'reveal_letter' | 'extra_time' | 'streak_shield'
  | 'time_warp' | 'sketch_vision' | 'triple_points'
  | 'blind_spot' | 'point_steal' | 'canvas_chaos'
  | 'brush_sabotage' | 'speed_curse'
  | 'oracle_hint' | 'canvas_rewind';

export interface PowerupInventory {
  [key: string]: number; // powerupId -> count
}

export interface ActiveEffect {
  type: PowerupId;
  activatedAt: number;
  expiresAt?: number;
}

export interface PlayerCooldown {
  lastUsedAt: number;
  canUseAgainAt: number;
}

export interface PlayerCooldowns {
  [powerupId: string]: PlayerCooldown;
}

export interface Player {
  socketId: string;
  name: string;
  avatar: number;
  score: number;
  isReady: boolean;
  guessedCorrectly: boolean;
  isConnected: boolean;
  joinedAt: number;
  // Streak tracking
  currentStreak: number;
  maxStreak: number;
  totalCorrectGuesses: number;
  // Power-ups
  powerups: PowerupInventory;
  activeEffects: ActiveEffect[];
  cooldowns: PlayerCooldowns;
}

export type GameStatus = 'waiting' | 'choosing' | 'drawing' | 'ended';

export type WordDifficulty = 'easy' | 'medium' | 'hard';

export interface WordWithDifficulty {
  word: string;
  difficulty: WordDifficulty;
}

export interface GameState {
  status: GameStatus;
  currentDrawer: string | null;
  currentWord: string | null;
  displayWord: string | null;
  currentWordDifficulty: WordDifficulty | null;
  round: number;
  maxRounds: number;
  roundStartTime: number | null;
  roundDuration: number;
  wordOptions: WordWithDifficulty[] | null;
  // Powerup effects
  timePausedUntil?: number | null; // Time Warp: timestamp when timer can resume
  brushSabotageActive?: boolean; // Brush Sabotage: random brush sizes active
}

export interface Room {
  roomCode: string;
  isHost: boolean;
  players: Player[];
  gameState?: GameState;
}
