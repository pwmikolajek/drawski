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
  // ===== KEPT POWERUPS (3) =====
  REVEAL_LETTER: {
    id: 'reveal_letter',
    name: 'Reveal Letter',
    description: 'Reveal one random letter in the word',
    basePrice: 300,
    badge: '💡',
    type: 'hint' as const,
    usableBy: 'guesser' as const,
    requiresTarget: false,
    effectDuration: 0,
    personalCooldown: 0,
    globalCooldown: 0,
    maxUsesPerRound: 999,
  },
  EXTRA_TIME: {
    id: 'extra_time',
    name: 'Extra Time',
    description: 'Add 30 seconds to the round timer',
    basePrice: 400,
    badge: '⏰',
    type: 'drawing' as const,
    usableBy: 'drawer' as const,
    requiresTarget: false,
    effectDuration: 0,
    personalCooldown: 0,
    globalCooldown: 0,
    maxUsesPerRound: 999,
  },
  STREAK_SHIELD: {
    id: 'streak_shield',
    name: 'Streak Shield',
    description: 'Protect your streak for one round if you fail',
    basePrice: 350,
    badge: '🛡️',
    type: 'defensive' as const,
    usableBy: 'guesser' as const,
    requiresTarget: false,
    effectDuration: 120000,
    personalCooldown: 0,
    globalCooldown: 0,
    maxUsesPerRound: 999,
  },

  // ===== NEW SELF-HELP POWERUPS (3) =====
  TIME_WARP: {
    id: 'time_warp',
    name: 'Time Warp',
    description: 'Freeze the round timer for 15 seconds',
    basePrice: 600,
    badge: '⏳',
    type: 'tactical' as const,
    usableBy: 'guesser' as const,
    requiresTarget: false,
    effectDuration: 15000,
    personalCooldown: 45000,
    globalCooldown: 30000,
    maxUsesPerRound: 2,
  },
  TRIPLE_POINTS: {
    id: 'triple_points',
    name: '3x Points',
    description: 'Triple your points for the next correct guess',
    basePrice: 700,
    badge: '💰',
    type: 'self_help' as const,
    usableBy: 'guesser' as const,
    requiresTarget: false,
    effectDuration: 120000,
    personalCooldown: 0,
    globalCooldown: 0,
    maxUsesPerRound: 999,
  },

  // ===== NEW COMPETITIVE POWERUPS (5) =====
  BLIND_SPOT: {
    id: 'blind_spot',
    name: 'Blind Spot',
    description: "Cover 30% of a target player's canvas with fog for 25 seconds",
    basePrice: 550,
    badge: '🌫️',
    type: 'competitive' as const,
    usableBy: 'guesser' as const,
    requiresTarget: true,
    effectDuration: 25000,
    personalCooldown: 90000,
    globalCooldown: 0,
    maxUsesPerRound: 3,
  },
  POINT_STEAL: {
    id: 'point_steal',
    name: 'Point Steal',
    description: "Steal 15% of target player's current score (100-400 points)",
    basePrice: 500,
    badge: '💸',
    type: 'competitive' as const,
    usableBy: 'both' as const,
    requiresTarget: true,
    effectDuration: 0,
    personalCooldown: 120000,
    globalCooldown: 60000,
    maxUsesPerRound: 2,
  },
  CANVAS_CHAOS: {
    id: 'canvas_chaos',
    name: 'Canvas Chaos',
    description: "Invert colors on target player's screen for 20 seconds",
    basePrice: 400,
    badge: '🎨',
    type: 'competitive' as const,
    usableBy: 'guesser' as const,
    requiresTarget: true,
    effectDuration: 20000,
    personalCooldown: 75000,
    globalCooldown: 0,
    maxUsesPerRound: 4,
  },
  BRUSH_SABOTAGE: {
    id: 'brush_sabotage',
    name: 'Brush Sabotage',
    description: 'Force drawer to use random brush size (1-50) for 15 seconds',
    basePrice: 650,
    badge: '🖌️',
    type: 'competitive' as const,
    usableBy: 'guesser' as const,
    requiresTarget: false,
    effectDuration: 15000,
    personalCooldown: 90000,
    globalCooldown: 45000,
    maxUsesPerRound: 2,
  },
  SPEED_CURSE: {
    id: 'speed_curse',
    name: 'Speed Curse',
    description: "Halve the next correct guess points for target player",
    basePrice: 350,
    badge: '⚡',
    type: 'competitive' as const,
    usableBy: 'guesser' as const,
    requiresTarget: true,
    effectDuration: 120000,
    personalCooldown: 60000,
    globalCooldown: 0,
    maxUsesPerRound: 3,
  },

  // ===== NEW TACTICAL POWERUPS (2) =====
  ORACLE_HINT: {
    id: 'oracle_hint',
    name: 'Oracle Hint',
    description: "Reveal the word's category AND first letter",
    basePrice: 400,
    badge: '🔮',
    type: 'tactical' as const,
    usableBy: 'guesser' as const,
    requiresTarget: false,
    effectDuration: 0,
    personalCooldown: 999999,
    globalCooldown: 0,
    maxUsesPerRound: 1,
  },
} as const;

export const POWERUP_PRICING = {
  // Position-based multipliers (based on player ranking)
  POSITION_MULTIPLIERS: {
    FIRST: 1.2,      // +20% for 1st place
    SECOND: 1.05,    // +5% for 2nd place
    THIRD: 1.0,      // Base price for 3rd place
    FOURTH: 0.9,     // -10% for 4th place
    FIFTH: 0.8,      // -20% for 5th place
    LAST: 0.75,      // -25% for last place
  },
  // Time-based multipliers (based on round progress)
  TIME_MULTIPLIERS: {
    EARLY: 1.33,     // +33% in first third of round
    MID: 1.0,        // Base price in middle third
    LATE: 0.67,      // -33% in final third
  },
  // Anti-griefing and comeback mechanics
  GRIEFING_PENALTY: 1.35,     // +35% for targeting last place
  COMEBACK_BONUS: 0.6,        // -40% for last place using offensive
  LEADER_PENALTY: 1.6,        // +60% for 1st place using offensive
  // Price bounds
  MIN_MULTIPLIER: 0.5,        // Price can't go below 50% of base
  MAX_MULTIPLIER: 2.0,        // Price can't exceed 200% of base
} as const;

export const AVATAR_CONFIG = {
  DEFAULT_AVATAR: 1,
  AVAILABLE_AVATARS: [1, 2, 3, 4, 5, 6, 7, 8],
  AVATAR_PATH: '/avatars/avatar-',
  AVATARS_PER_PAGE: 4,
} as const;
