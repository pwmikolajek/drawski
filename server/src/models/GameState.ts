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
  // Bonus tracking
  firstBloodAwarded: boolean;
  guessTimeStamps: Map<string, number>; // socketId -> timestamp when they guessed
  // Powerup effects
  timePausedUntil: number | null; // Time Warp: timestamp when timer can resume
  brushSabotageActive: boolean; // Brush Sabotage: random brush sizes active
}

export function createGameState(maxRounds: number = 3, roundDuration: number = 80000): GameState {
  return {
    status: 'waiting',
    currentDrawer: null,
    currentWord: null,
    displayWord: null,
    currentWordDifficulty: null,
    round: 0,
    maxRounds,
    roundStartTime: null,
    roundDuration,
    wordOptions: null,
    firstBloodAwarded: false,
    guessTimeStamps: new Map(),
    timePausedUntil: null,
    brushSabotageActive: false,
  };
}
