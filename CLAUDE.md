# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Drawski is a real-time multiplayer drawing and guessing game (similar to Pictionary) built with a client-server architecture using Socket.IO for WebSocket communication.

**Tech Stack:**
- **Client**: React 19 + TypeScript + Vite + Tailwind CSS
- **Server**: Node.js + Express + Socket.IO + TypeScript
- **Shared**: Common TypeScript types and constants

## Development Commands

### Server (port 3001)
```bash
cd server
npm install
npm run dev      # Development with nodemon hot-reload
npm run build    # Compile TypeScript to dist/
npm start        # Run production build from dist/
```

### Client (port 3000)
```bash
cd client
npm install
npm run dev      # Development with Vite HMR
npm run build    # Production build (runs tsc + vite build)
npm run preview  # Preview production build locally
npm run lint     # Run ESLint
```

### Working with Shared Code
The `/shared` directory contains constants and event names used by both client and server. Changes here affect both sides of the application.

## Architecture Overview

### Server-Authoritative State Model

The server maintains the single source of truth for all game state using an in-memory architecture:

```
RoomService (Singleton)
├── rooms: Map<roomCode, Room>          # O(1) lookup by room code
└── socketToRoom: Map<socketId, roomCode> # O(1) reverse lookup

Room Model
├── players: Map<socketId, Player>
├── gameState: GameState
├── drawingHistory: DrawingEvent[]      # Limited to 10,000 events
└── Auto-cleanup after 1 hour of inactivity
```

**Key Services:**
- `RoomService`: Room creation, joining, player management
- `GameService`: Game flow, round management, timers, scoring
- `WordService`: Word selection, hint revealing, display word generation
- `PowerupService`: Powerup purchasing, activation, and effect management

### Client State Synchronization

The client uses React hooks and Context API (no Redux/Zustand):
- `SocketContext`: Provides socket instance to entire component tree
- `GameRoom`: Main game component managing players, gameState, and UI
- `DrawingCanvas`: Canvas state (color, brush size, drawing context)
- `PowerupBar`: Active powerups and effects display
- `PowerupShop`: Powerup purchasing interface
- `Chat`: Chat messages and guess submission

State updates flow: Server event → Socket listener → setState → React re-render

### Real-Time Communication

**Socket.IO Event Categories** (defined in `/shared/eventNames.ts`):

1. **Room Events**: `room:create`, `room:join`, `room:leave`, `room:players:update`
2. **Game Events**: `game:start`, `round:start:drawer`, `round:start:guesser`, `round:end`, `game:ended`, `game:restart`
3. **Drawing Events**: `drawing:batch`, `drawing:clear`
4. **Word Events**: `word:select`, `word:selected`
5. **Hint Events**: `hint:revealed`
6. **Chat/Guess Events**: `chat:message`, `chat:received`, `guess:correct`, `guess:close`
7. **Powerup Events**: `powerup:purchase`, `powerup:activate`, `powerup:effect`, `powerup:awarded`

**Socket.IO Rooms Strategy:**
- `io.to(roomCode).emit(...)` → Broadcast to all players in room
- `socket.to(roomCode).emit(...)` → Broadcast to all except sender
- `io.to(socketId).emit(...)` → Send to specific player (e.g., drawer-only events)

### Game Flow

**1. Lobby Phase**
- Host creates room → Server generates 4-character room code (A-Z, 0-9)
- Players join using room code → Max 6 players per room
- Host can configure game settings (rounds, round duration)
- Host starts game when ready (min 2 players)

**2. Round Start**
- Server selects next drawer (round-robin rotation)
- Drawer receives 3 word options from WordService (one per difficulty: Easy, Medium, Hard)
- 15-second word selection timeout (auto-select if expired)
- Drawer sees `round:start:drawer` event, guessers see `round:start:guesser` event

**3. Drawing Phase**
- Drawer selects word → Server creates masked display word: "_ _ _ _ _"
- Round timer starts (configurable, default 80 seconds)
- Hint timers reveal letters at 20s, 40s, 60s intervals
- Drawer draws → Events batched and optimized → Broadcast to guessers
- Guessers type guesses in chat → Server validates using Levenshtein distance
- Close guesses (within edit distance) trigger `guess:close` event
- Correct guesses award points and bonuses

**4. Round End**
- Timer expires or all guessers guess correctly
- Word revealed to all players
- Scores and bonuses displayed
- Drawer receives points if at least one player guessed correctly (Perfect Round bonus if all guessed)
- If more rounds remain, next round starts after brief delay
- If all rounds complete, game ends with final scores

### Scoring System

**Base Score Calculation:**
- Points decrease linearly over time from MAX_SCORE (1000) to MIN_SCORE (500)
- Word difficulty multiplier applied: Easy (1.0x), Medium (1.5x), Hard (2.0x)
- Formula: `baseScore = maxScore - ((maxScore - minScore) * elapsedRatio) * difficultyMultiplier`

**Speed Bonuses:**
- Lightning (< 5s): +500 points ⚡
- Quick (< 10s): +300 points 🔥
- Fast (< 20s): +150 points 💨

**Streak System:**
- Consecutive correct guesses build streak
- +100 points per streak level (capped at +500 for 5+ streak)
- Streak resets if player fails to guess

**Special Bonuses:**
- First Blood: +200 points for first correct guess 🩸
- Perfect Round: +300 for all guessers, +500 for drawer ✨

**Drawer Score:**
- Earns 50% of total points awarded to guessers
- Perfect Round bonus if all players guess correctly

### Powerup System

Players can purchase and activate powerups using earned points:

**Hint Powerups (Guessers):**
- Reveal Letter (💡 300pts): Reveals one random hidden letter
- Word Length (📏 150pts): Shows exact letter count
- Category Hint (🏷️ 200pts): Reveals word category (Animal, Object, Place, Food, Nature)

**Drawing Powerups (Drawer):**
- Extra Time (⏰ 400pts): Adds 30 seconds to round timer
- Undo (↩️ 100pts): Removes last drawing stroke

**Universal Powerups:**
- 2x Points (⭐ 500pts): Doubles points for next correct guess
- Streak Shield (🛡️ 350pts): Protects streak for one round if player fails

**Powerup Management:**
- Purchased powerups stored in player inventory
- Active effects tracked with expiration times (typically 2 minutes)
- Effects automatically cleaned up when expired
- Some effects consumed on use (2x Points, Streak Shield)

### Drawing Optimization System

The `DrawingOptimizer` (client-side) implements aggressive bandwidth reduction:

```typescript
// Batching: Accumulate events for 16ms (60fps) intervals
// Compression: Remove points where direction doesn't change >10° (using dot product)
// Result: ~5-10x bandwidth reduction while maintaining visual quality
```

Drawing events are:
1. Batched on client every 16ms
2. Compressed by removing redundant points
3. Sent to server as `drawing:batch` event
4. Stored in `room.drawingHistory` (max 10,000 events)
5. Broadcast to other players in room
6. Rendered on their canvases

### Timer Management

GameService maintains multiple timers per room:

```typescript
roundTimers: Map<roomCode, NodeJS.Timeout>  # Word choice (15s) and round duration (configurable)
hintTimers: Map<roomCode, NodeJS.Timeout[]> # Hint reveal timers [20s, 40s, 60s]
```

**CRITICAL**: Always call `clearRoundTimers(roomCode)` before starting new rounds or cleaning up rooms to prevent timer leaks.

### Game Configuration

All game parameters are in `/shared/constants.ts`:

```typescript
GAME_CONFIG:
├── ROUNDS_PER_GAME: 3 (default, configurable)
├── ROUND_DURATION: 80000ms (default, configurable)
├── WORD_CHOICE_TIME: 15000ms
├── HINT_INTERVALS: [20000, 40000, 60000]ms
├── MIN/MAX_PLAYERS: 2-6
├── MAX_SCORE: 1000
├── MIN_SCORE: 500
└── DRAWER_SCORE_MULTIPLIER: 0.5

CANVAS_CONFIG:
├── WIDTH/HEIGHT: 800x600
├── BRUSH_SIZE: 1-50 (default 5)
├── BATCH_INTERVAL: 16ms (60fps)
└── DEFAULT_COLOR: '#000000'

DIFFICULTY_CONFIG:
├── EASY: 1.0x multiplier 🟢
├── MEDIUM: 1.5x multiplier 🟡
└── HARD: 2.0x multiplier 🔴

BONUS_CONFIG:
├── SPEED bonuses (Lightning, Quick, Fast)
├── FIRST_BLOOD: +200
├── STREAK: +100 per level (max +500)
└── PERFECT_ROUND: guesser +300, drawer +500

POWERUP_CONFIG:
├── Hint powerups (reveal_letter, word_length, category_hint)
├── Drawing powerups (extra_time, undo)
└── Universal powerups (double_points, streak_shield)
```

## Important Implementation Details

### Validation Strategy

**Server-side validation** (in socket event handlers):
- Room codes normalized to uppercase
- Player names trimmed and required
- Drawer validation: Only current drawer can select word or emit drawing events
- Coordinate bounds: Drawing events validated within canvas bounds (-10 to 810, -10 to 610)
- Room capacity: Max 6 players enforced
- Chat messages: Max 100 characters, trimmed
- Powerup purchases: Cost validation, inventory management
- Powerup activation: Role validation (drawer-only, guesser-only)

**Client-side validation**:
- Form inputs (player name, room code)
- UI restrictions (non-drawer cannot draw, non-host cannot start game)
- Powerup purchase buttons disabled if insufficient points

### Guess Validation

The server uses Levenshtein distance algorithm (edit distance) to provide feedback on guesses:
- Distance 0: Exact match → Correct guess
- Distance 1-2: Close guess → `guess:close` event for near-misses
- Higher distance: Normal chat message

### Security Middleware

Server uses:
- `helmet`: HTTP security headers
- `cors`: Restricted to CLIENT_URL (default: http://localhost:3000)
- `errorMiddleware`: Centralized error handling
- Winston logger: Structured logging for debugging

### Memory Management

**Room Cleanup:**
- Automatic cleanup runs every 10 minutes
- Removes rooms inactive for >1 hour
- Clears socketToRoom mappings

**Drawing History:**
- Limited to 10,000 events per room
- When exceeded, keeps only last 5,000
- Prevents unbounded memory growth in long games

**Powerup Effects:**
- Active effects automatically cleaned up when expired
- Checked before application and periodically cleaned

### Environment Variables

Server expects:
```bash
PORT=3001                           # Server port
CLIENT_URL=http://localhost:3000   # CORS origin
NODE_ENV=development               # Environment
```

Client connects to server at `http://localhost:3001` (hardcoded in socket.service.ts).

## Code Patterns to Follow

### Socket Event Handlers
Always structure socket handlers with validation, service calls, and error handling:

```typescript
socket.on('event:name', async (data, callback?) => {
  try {
    // 1. Validate input
    // 2. Get room/player context
    // 3. Call service method
    // 4. Emit response events
    // 5. Handle callback if provided
  } catch (error) {
    logger.error('Event failed:', error);
    socket.emit('event:error', { message: 'Error message' });
  }
});
```

### Service Methods
Services should be pure business logic without Socket.IO dependencies:

```typescript
class GameService {
  public startRound(roomCode: string): void {
    const room = roomService.getRoom(roomCode);
    // Pure game logic here
    // Return data or throw errors
    // Let socket handlers emit events
  }
}
```

### Client Event Listeners
Set up listeners in `useEffect` with cleanup:

```typescript
useEffect(() => {
  if (!socket) return;

  const handleEvent = (data: EventData) => {
    // Update local state
  };

  socket.on('event:name', handleEvent);
  return () => {
    socket.off('event:name', handleEvent);
  };
}, [socket, dependencies]);
```

## Testing Notes

- No test framework currently configured
- Manual testing workflow: Start server → Start client → Create/join room → Play game
- Health check endpoint: `GET http://localhost:3001/health`

## Common Debugging Tips

1. **Socket connection issues**: Check CORS configuration and CLIENT_URL environment variable
2. **Drawing not syncing**: Check DrawingOptimizer batching and `drawing:batch` event flow
3. **Game stuck in phase**: Check timer cleanup in GameService
4. **Room not found**: Verify socketToRoom mapping and room cleanup hasn't removed active rooms
5. **Players not updating**: Check `room:players:update` broadcast in room event handlers
6. **Powerups not working**: Check player inventory, active effects, and role validation
7. **Scoring issues**: Verify timer accuracy, difficulty multiplier, and bonus calculations
8. **Guess detection failing**: Check Levenshtein distance calculation and case-insensitive matching

## File Structure Reference

```
/client
├── /src
│   ├── /components
│   │   ├── /Canvas         # DrawingCanvas component
│   │   ├── /Game           # GameRoom, Chat, PowerupBar, PowerupShop, Timer, WordDisplay
│   │   ├── /Lobby          # RoomCreator, RoomJoiner
│   │   └── /UI             # Reusable UI components
│   ├── /contexts           # SocketContext for global socket access
│   ├── /services           # socket.service.ts, drawingOptimizer.ts
│   └── /types              # TypeScript interfaces
/server
├── /src
│   ├── /middleware         # Express middleware (error handling)
│   ├── /models             # Data models (Room, Player, GameState)
│   ├── /services           # Business logic (RoomService, GameService, WordService, PowerupService)
│   ├── /socket             # Socket.IO handlers (socketHandler, room/game/drawing/powerup events)
│   └── /utils              # Utilities (logger, wordList, roomCodeGenerator, guessValidator)
/shared
├── constants.ts            # Game configuration constants
└── eventNames.ts           # Socket.IO event name constants
```
