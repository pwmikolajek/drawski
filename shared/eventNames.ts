// Connection Events
export const CONNECTION = {
  CONNECT: 'connect',
  DISCONNECT: 'disconnect',
  ERROR: 'error',
  CONNECT_ERROR: 'connect_error',
} as const;

// Room Events
export const ROOM = {
  CREATE: 'room:create',
  JOIN: 'room:join',
  LEAVE: 'room:leave',
  REJOIN: 'room:rejoin',

  CREATED: 'room:created',
  JOINED: 'room:joined',
  LEFT: 'room:left',
  REJOINED: 'room:rejoined',
  REJOIN_FAILED: 'room:rejoin:failed',
  ERROR: 'room:error',

  PLAYERS_UPDATE: 'room:players:update',
} as const;

// Game Events
export const GAME = {
  START: 'game:start',
  STARTED: 'game:started',
  END: 'game:end',
  ENDED: 'game:ended',
  RESTART: 'game:restart',
  RESTARTED: 'game:restarted',

  ROUND_START_DRAWER: 'round:start:drawer',
  ROUND_START_GUESSER: 'round:start:guesser',
  ROUND_END: 'round:end',

  WORD_SELECT: 'word:select',
  WORD_SELECTED: 'word:selected',
} as const;

// Drawing Events
export const DRAWING = {
  BATCH: 'drawing:batch',
  CLEAR: 'drawing:clear',
  TOOL_CHANGE: 'drawing:tool:change',
} as const;

// Chat & Guessing Events
export const CHAT = {
  MESSAGE: 'chat:message',
  RECEIVED: 'chat:received',
} as const;

export const GUESS = {
  CORRECT: 'guess:correct',
  ALREADY_GUESSED: 'guess:already:guessed',
} as const;

// Hint Events
export const HINT = {
  REVEALED: 'hint:revealed',
} as const;
