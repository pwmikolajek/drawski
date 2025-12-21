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
  CLOSE: 'guess:close',
  ALREADY_GUESSED: 'guess:already:guessed',
} as const;

// Hint Events
export const HINT = {
  REVEALED: 'hint:revealed',
} as const;

// Powerup Events
export const POWERUP = {
  // General powerup actions
  BUY: 'powerup:buy',
  ACTIVATE: 'powerup:activate',
  PURCHASED: 'powerup:purchased',
  ACTIVATED: 'powerup:activated',
  ERROR: 'powerup:error',

  // Dynamic pricing
  GET_PRICE: 'powerup:get_price',
  PRICE_UPDATE: 'powerup:price_update',

  // Specific powerup effects
  TIME_WARP_ACTIVATED: 'powerup:time_warp:activated',
  TIME_WARP_ENDED: 'powerup:time_warp:ended',

  SKETCH_VISION_GRANTED: 'powerup:sketch_vision:granted',

  BLIND_SPOT_APPLIED: 'powerup:blind_spot:applied',
  BLIND_SPOT_ENDED: 'powerup:blind_spot:ended',

  POINT_STEAL_EXECUTED: 'powerup:point_steal:executed',

  CANVAS_CHAOS_APPLIED: 'powerup:canvas_chaos:applied',
  CANVAS_CHAOS_ENDED: 'powerup:canvas_chaos:ended',

  BRUSH_SABOTAGE_ACTIVATED: 'powerup:brush_sabotage:activated',
  BRUSH_SABOTAGE_ENDED: 'powerup:brush_sabotage:ended',

  SPEED_CURSE_APPLIED: 'powerup:speed_curse:applied',

  ORACLE_HINT_REVEALED: 'powerup:oracle_hint:revealed',

  CANVAS_REWIND_ACTIVATED: 'powerup:canvas_rewind:activated',
} as const;
