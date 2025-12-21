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

export function createPlayer(socketId: string, name: string, avatar: number = 1): Player {
  return {
    socketId,
    name,
    avatar,
    score: 0,
    isReady: false,
    guessedCorrectly: false,
    isConnected: true,
    joinedAt: Date.now(),
    currentStreak: 0,
    maxStreak: 0,
    totalCorrectGuesses: 0,
    powerups: {},
    activeEffects: [],
    cooldowns: {},
  };
}
