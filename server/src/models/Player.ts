export type PowerupId = 'reveal_letter' | 'word_length' | 'category_hint' | 'extra_time' | 'undo' | 'double_points' | 'streak_shield';

export interface PowerupInventory {
  [key: string]: number; // powerupId -> count
}

export interface ActiveEffect {
  type: PowerupId;
  activatedAt: number;
  expiresAt?: number;
}

export interface Player {
  socketId: string;
  name: string;
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
}

export function createPlayer(socketId: string, name: string): Player {
  return {
    socketId,
    name,
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
  };
}
