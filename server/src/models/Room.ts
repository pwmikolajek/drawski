import { Player } from './Player';
import { GameState, createGameState } from './GameState';

export interface DrawingEvent {
  x: number;
  y: number;
  type: 'draw' | 'move';
  color?: string;
  size?: number;
}

export interface GlobalCooldown {
  lastUsedBy: string;
  canUseAgainAt: number;
  usesThisRound: number;
}

export interface RoomCooldowns {
  [powerupId: string]: GlobalCooldown;
}

export interface DrawingSnapshot {
  timestamp: number;
  events: DrawingEvent[];
}

export interface Room {
  roomCode: string;
  hostSocketId: string;
  players: Map<string, Player>;
  gameState: GameState;
  drawingHistory: DrawingEvent[];
  globalCooldowns: RoomCooldowns;
  drawingSnapshots: DrawingSnapshot[];
  createdAt: number;
  lastActivity: number;
}

export function createRoom(roomCode: string, hostSocketId: string): Room {
  return {
    roomCode,
    hostSocketId,
    players: new Map(),
    gameState: createGameState(),
    drawingHistory: [],
    globalCooldowns: {},
    drawingSnapshots: [],
    createdAt: Date.now(),
    lastActivity: Date.now(),
  };
}
