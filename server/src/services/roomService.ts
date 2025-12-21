import { Room, createRoom } from '../models/Room';
import { Player, createPlayer } from '../models/Player';
import { generateUniqueRoomCode } from '../utils/roomCodeGenerator';
import { logger } from '../utils/logger';
import { GAME_CONFIG, ROOM_CONFIG } from '../../../shared/constants';

class RoomService {
  private rooms: Map<string, Room> = new Map();
  private socketToRoom: Map<string, string> = new Map();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.startCleanupInterval();
  }

  // Create a new room
  createRoom(hostSocketId: string, hostName: string, avatar: number = 1): Room {
    const existingCodes = new Set(this.rooms.keys());
    const roomCode = generateUniqueRoomCode(existingCodes, ROOM_CONFIG.CODE_LENGTH);

    const room = createRoom(roomCode, hostSocketId);
    const host = createPlayer(hostSocketId, hostName, avatar);
    room.players.set(hostSocketId, host);

    this.rooms.set(roomCode, room);
    this.socketToRoom.set(hostSocketId, roomCode);

    logger.info(`Room created: ${roomCode} by ${hostName}`);
    return room;
  }

  // Join an existing room
  joinRoom(roomCode: string, socketId: string, playerName: string, avatar: number = 1): Room | null {
    const room = this.rooms.get(roomCode.toUpperCase());

    if (!room) {
      logger.warn(`Attempted to join non-existent room: ${roomCode}`);
      return null;
    }

    if (room.players.size >= GAME_CONFIG.MAX_PLAYERS) {
      logger.warn(`Room ${roomCode} is full`);
      return null;
    }

    if (room.gameState.status !== 'waiting') {
      logger.warn(`Room ${roomCode} game already started`);
      return null;
    }

    const player = createPlayer(socketId, playerName, avatar);
    room.players.set(socketId, player);
    room.lastActivity = Date.now();

    this.socketToRoom.set(socketId, roomCode);

    logger.info(`Player ${playerName} joined room ${roomCode}`);
    return room;
  }

  // Leave a room
  leaveRoom(socketId: string): { room: Room | null; roomCode: string | null } {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) {
      return { room: null, roomCode: null };
    }

    const room = this.rooms.get(roomCode);
    if (!room) {
      this.socketToRoom.delete(socketId);
      return { room: null, roomCode };
    }

    room.players.delete(socketId);
    room.lastActivity = Date.now();
    this.socketToRoom.delete(socketId);

    logger.info(`Player ${socketId} left room ${roomCode}`);

    // If room is empty, delete it
    if (room.players.size === 0) {
      this.rooms.delete(roomCode);
      logger.info(`Room ${roomCode} deleted (empty)`);
      return { room: null, roomCode };
    }

    // If host left, assign new host
    if (room.hostSocketId === socketId) {
      const newHost = Array.from(room.players.values())[0];
      room.hostSocketId = newHost.socketId;
      logger.info(`New host for room ${roomCode}: ${newHost.name}`);
    }

    return { room, roomCode };
  }

  // Get room by code
  getRoom(roomCode: string): Room | null {
    return this.rooms.get(roomCode.toUpperCase()) || null;
  }

  // Get room by socket ID
  getRoomBySocket(socketId: string): Room | null {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return null;
    return this.rooms.get(roomCode) || null;
  }

  // Get room code by socket ID
  getRoomCode(socketId: string): string | null {
    return this.socketToRoom.get(socketId) || null;
  }

  // Get all rooms
  getAllRooms(): Room[] {
    return Array.from(this.rooms.values());
  }

  // Find player by socket ID and return room code and player
  findPlayerBySocket(socketId: string): { roomCode: string; player: Player } | null {
    const roomCode = this.socketToRoom.get(socketId);
    if (!roomCode) return null;

    const room = this.rooms.get(roomCode);
    if (!room) return null;

    const player = room.players.get(socketId);
    if (!player) return null;

    return { roomCode, player };
  }

  // Update player ready status
  setPlayerReady(socketId: string, isReady: boolean): Room | null {
    const room = this.getRoomBySocket(socketId);
    if (!room) return null;

    const player = room.players.get(socketId);
    if (player) {
      player.isReady = isReady;
      room.lastActivity = Date.now();
    }

    return room;
  }

  // Check if all players are ready
  areAllPlayersReady(roomCode: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room || room.players.size < GAME_CONFIG.MIN_PLAYERS) {
      return false;
    }

    return Array.from(room.players.values()).every(player => player.isReady);
  }

  // Cleanup inactive rooms
  private cleanupInactiveRooms(): void {
    const now = Date.now();
    const timeout = ROOM_CONFIG.INACTIVE_TIMEOUT;

    for (const [roomCode, room] of this.rooms.entries()) {
      if (now - room.lastActivity > timeout) {
        // Remove all socket mappings
        for (const socketId of room.players.keys()) {
          this.socketToRoom.delete(socketId);
        }

        this.rooms.delete(roomCode);
        logger.info(`Room ${roomCode} cleaned up (inactive)`);
      }
    }
  }

  // Start cleanup interval
  private startCleanupInterval(): void {
    // Run cleanup every 10 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupInactiveRooms();
    }, 10 * 60 * 1000);
  }

  // Stop cleanup interval (for graceful shutdown)
  stopCleanup(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  // Get room stats
  getStats() {
    return {
      totalRooms: this.rooms.size,
      totalPlayers: this.socketToRoom.size,
    };
  }
}

export const roomService = new RoomService();
