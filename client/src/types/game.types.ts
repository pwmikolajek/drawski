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
}

export interface Room {
  roomCode: string;
  isHost: boolean;
  players: Player[];
  gameState?: GameState;
}
