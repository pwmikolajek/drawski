export const GAME_CONFIG = {
  MIN_PLAYERS: 2,
  MAX_PLAYERS: 6,
  ROUNDS_PER_GAME: 3,
  ROUND_DURATION: 80000,        // 80 seconds
  WORD_CHOICE_TIME: 15000,      // 15 seconds
  HINT_INTERVALS: [20000, 40000, 60000],  // 20s, 40s, 60s
  MAX_SCORE: 1000,
  MIN_SCORE: 500,
  DRAWER_SCORE_MULTIPLIER: 0.5,
} as const;

export const CANVAS_CONFIG = {
  WIDTH: 800,
  HEIGHT: 600,
  MIN_BRUSH_SIZE: 1,
  MAX_BRUSH_SIZE: 50,
  DEFAULT_BRUSH_SIZE: 5,
  BATCH_INTERVAL: 16,           // 60fps
  DEFAULT_COLOR: '#000000',
  ERASER_COLOR: '#FFFFFF',
} as const;

export const RATE_LIMITS = {
  CHAT_MESSAGES_PER_MINUTE: 30,
  DRAWING_EVENTS_PER_SECOND: 100,
} as const;

export const ROOM_CONFIG = {
  CODE_LENGTH: 4,
  INACTIVE_TIMEOUT: 3600000,    // 1 hour
} as const;

export const DIFFICULTY_CONFIG = {
  EASY: {
    multiplier: 1.0,
    badge: '🟢',
    label: 'Easy',
    color: 'green',
  },
  MEDIUM: {
    multiplier: 1.5,
    badge: '🟡',
    label: 'Medium',
    color: 'yellow',
  },
  HARD: {
    multiplier: 2.0,
    badge: '🔴',
    label: 'Hard',
    color: 'red',
  },
} as const;

export const BONUS_CONFIG = {
  // Speed bonuses (based on guess time)
  SPEED: {
    LIGHTNING: {
      threshold: 5000,     // Under 5 seconds
      bonus: 500,
      badge: '⚡',
      label: 'Lightning',
    },
    QUICK: {
      threshold: 10000,    // Under 10 seconds
      bonus: 300,
      badge: '🔥',
      label: 'Quick',
    },
    FAST: {
      threshold: 20000,    // Under 20 seconds
      bonus: 150,
      badge: '💨',
      label: 'Fast',
    },
  },
  // First person to guess
  FIRST_BLOOD: {
    bonus: 200,
    badge: '🩸',
    label: 'First Blood',
  },
  // Consecutive correct guesses
  STREAK: {
    bonusPerStreak: 100,   // +100 points per consecutive round
    maxStreakBonus: 500,   // Cap at 5x streak
    badge: '🔥',
    label: 'On Fire',
  },
  // All guessers guess correctly
  PERFECT_ROUND: {
    guesserBonus: 300,
    drawerBonus: 500,
    badge: '✨',
    label: 'Perfect Round',
  },
} as const;

export const POWERUP_CONFIG = {
  // Hint power-ups (for guessers)
  REVEAL_LETTER: {
    id: 'reveal_letter',
    name: 'Reveal Letter',
    description: 'Reveal one random letter in the word',
    cost: 300,
    badge: '💡',
    type: 'hint' as const,
    usableBy: 'guesser' as const,
  },
  WORD_LENGTH: {
    id: 'word_length',
    name: 'Word Length',
    description: 'Show the exact number of letters',
    cost: 150,
    badge: '📏',
    type: 'hint' as const,
    usableBy: 'guesser' as const,
  },
  CATEGORY_HINT: {
    id: 'category_hint',
    name: 'Category Hint',
    description: 'Reveal the word category (Animal, Object, etc.)',
    cost: 200,
    badge: '🏷️',
    type: 'hint' as const,
    usableBy: 'guesser' as const,
  },

  // Drawing power-ups (for drawers)
  EXTRA_TIME: {
    id: 'extra_time',
    name: 'Extra Time',
    description: 'Add 30 seconds to the round timer',
    cost: 400,
    badge: '⏰',
    type: 'drawing' as const,
    usableBy: 'drawer' as const,
  },
  UNDO: {
    id: 'undo',
    name: 'Undo',
    description: 'Undo your last drawing stroke',
    cost: 100,
    badge: '↩️',
    type: 'drawing' as const,
    usableBy: 'drawer' as const,
  },

  // Universal power-ups
  DOUBLE_POINTS: {
    id: 'double_points',
    name: '2x Points',
    description: 'Double your points for the next correct guess',
    cost: 500,
    badge: '⭐',
    type: 'universal' as const,
    usableBy: 'guesser' as const,
  },
  STREAK_SHIELD: {
    id: 'streak_shield',
    name: 'Streak Shield',
    description: 'Protect your streak for one round if you fail',
    cost: 350,
    badge: '🛡️',
    type: 'universal' as const,
    usableBy: 'guesser' as const,
  },
} as const;
