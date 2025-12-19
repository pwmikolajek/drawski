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

### Client State Synchronization

The client uses React hooks and Context API (no Redux/Zustand):
- `SocketContext`: Provides socket instance to entire component tree
- `GameRoom`: Main game component managing players, gameState, and UI
- `DrawingCanvas`: Canvas state (color, brush size, drawing context)

State updates flow: Server event → Socket listener → setState → React re-render

### Real-Time Communication

**Socket.IO Event Categories** (defined in `/shared/eventNames.ts`):

1. **Room Events**: `room:create`, `room:join`, `room:leave`, `room:players:update`
2. **Game Events**: `game:start`, `round:start:drawer`, `round:start:guesser`, `round:end`, `game:ended`
3. **Drawing Events**: `drawing:batch`, `drawing:clear`
4. **Word Events**: `word:select`, `word:selected`
5. **Hint Events**: `hint:revealed`
6. **Chat/Guess Events**: `chat:message`, `guess:correct` (partially implemented)

**Socket.IO Rooms Strategy:**
- `io.to(roomCode).emit(...)` → Broadcast to all players in room
- `socket.to(roomCode).emit(...)` → Broadcast to all except sender
- `io.to(socketId).emit(...)` → Send to specific player (e.g., drawer-only events)

### Game Flow

**1. Lobby Phase**
- Host creates room → Server generates 4-character room code (A-Z, 0-9)
- Players join using room code → Max 6 players per room
- Host starts game when ready (min 2 players)

**2. Round Start**
- Server selects next drawer (round-robin rotation)
- Drawer receives 3 word options from WordService
- 15-second word selection timeout (auto-select if expired)
- Drawer sees `round:start:drawer` event, guessers see `round:start:guesser` event

**3. Drawing Phase**
- Drawer selects word → Server creates masked display word: "_ _ _ _ _"
- 80-second round timer starts
- Hint timers reveal letters at 20s, 40s, 60s intervals
- Drawer draws → Events batched and optimized → Broadcast to guessers
- Guessers type guesses (chat system - scoring logic incomplete)

**4. Round End**
- Timer expires or all guessers guess correctly
- Word revealed to all players
- Scores updated (if guess system implemented)
- If more rounds remain, next round starts after brief delay
- If all rounds complete, game ends with final scores

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
roundTimers: Map<roomCode, NodeJS.Timeout>  # Word choice (15s) and round duration (80s)
hintTimers: Map<roomCode, NodeJS.Timeout[]> # Hint reveal timers [20s, 40s, 60s]
```

**CRITICAL**: Always call `clearRoundTimers(roomCode)` before starting new rounds or cleaning up rooms to prevent timer leaks.

### Game Configuration

All game parameters are in `/shared/constants.ts`:

```typescript
GAME_CONFIG:
├── ROUNDS_PER_GAME: 3
├── ROUND_DURATION: 80000ms
├── WORD_CHOICE_TIME: 15000ms
├── HINT_INTERVALS: [20000, 40000, 60000]ms
└── MIN/MAX_PLAYERS: 2-6

CANVAS_CONFIG:
├── WIDTH/HEIGHT: 800x600
├── BRUSH_SIZE: 1-50 (default 5)
└── BATCH_INTERVAL: 16ms (60fps)
```

## Important Implementation Details

### Validation Strategy

**Server-side validation** (in socket event handlers):
- Room codes normalized to uppercase
- Player names trimmed and required
- Drawer validation: Only current drawer can select word or emit drawing events
- Coordinate bounds: Drawing events validated within canvas bounds (-10 to 810, -10 to 610)
- Room capacity: Max 6 players enforced

**Client-side validation**:
- Form inputs (player name, room code)
- UI restrictions (non-drawer cannot draw, non-host cannot start game)

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

### Environment Variables

Server expects:
```bash
PORT=3001                           # Server port
CLIENT_URL=http://localhost:3000   # CORS origin
NODE_ENV=development               # Environment
```

Client connects to server at `http://localhost:3001` (hardcoded in socket.service.ts).

## Known Incomplete Features

The following features are partially implemented and may need completion:

1. **Chat/Guessing System**:
   - `chat:message` event defined but handler incomplete in `gameEvents.ts`
   - Guess detection (word matching logic) not implemented
   - Score calculation on correct guess missing

2. **Rejoin Functionality**:
   - `room:rejoin` and `room:rejoin:failed` events defined
   - No handler implementation for reconnecting dropped players

3. **Rate Limiting**:
   - `RATE_LIMITS` constants defined in `/shared/constants.ts`
   - Middleware exists but not applied to socket events

4. **Scoring System**:
   - Player scores exist in data model
   - Full scoring logic (time-based, drawer bonus) not visible in current code

5. **Validation Relaxation** (for testing):
   - Minimum 2-player check may be commented out
   - Drawer-only drawing validation may be disabled
   - Review before production deployment

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

## File Structure Reference

```
/client
├── /src
│   ├── /components          # React components (Canvas, Game, Lobby)
│   ├── /contexts           # SocketContext for global socket access
│   ├── /services           # socket.service.ts, drawingOptimizer.ts
│   └── /types              # TypeScript interfaces
/server
├── /src
│   ├── /middleware         # Express middleware (error handling)
│   ├── /models             # Data models (Room, Player, GameState)
│   ├── /services           # Business logic (RoomService, GameService, WordService)
│   ├── /socket             # Socket.IO handlers (socketHandler, room/game/drawing events)
│   └── /utils              # Utilities (logger, wordList, roomCodeGenerator)
/shared
├── constants.ts            # Game configuration constants
└── eventNames.ts           # Socket.IO event name constants
```
