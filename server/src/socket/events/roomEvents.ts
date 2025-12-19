import { Server, Socket } from 'socket.io';
import { roomService } from '../../services/roomService';
import { gameService } from '../../services/gameService';
import { logger } from '../../utils/logger';
import { ROOM, GAME } from '../../../../shared/eventNames';
import { Player } from '../../models/Player';

export function setupRoomEvents(io: Server, socket: Socket) {
  // Create a new room
  socket.on(ROOM.CREATE, ({ playerName }: { playerName: string }) => {
    try {
      if (!playerName || playerName.trim().length === 0) {
        socket.emit(ROOM.ERROR, { message: 'Player name is required' });
        return;
      }

      const room = roomService.createRoom(socket.id, playerName.trim());

      // Join the socket to the room
      socket.join(room.roomCode);

      // Send room info back to creator
      socket.emit(ROOM.CREATED, {
        roomCode: room.roomCode,
        isHost: true,
        players: serializePlayers(room.players),
      });

      logger.info(`Room created: ${room.roomCode} by ${playerName}`);
    } catch (error) {
      logger.error('Error creating room:', error);
      socket.emit(ROOM.ERROR, { message: 'Failed to create room' });
    }
  });

  // Join an existing room
  socket.on(ROOM.JOIN, ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
    try {
      if (!roomCode || !playerName || playerName.trim().length === 0) {
        socket.emit(ROOM.ERROR, { message: 'Room code and player name are required' });
        return;
      }

      const room = roomService.joinRoom(roomCode, socket.id, playerName.trim());

      if (!room) {
        socket.emit(ROOM.ERROR, { message: 'Room not found, full, or game already started' });
        return;
      }

      // Join the socket to the room
      socket.join(room.roomCode);

      // Send room info to the joining player
      socket.emit(ROOM.JOINED, {
        roomCode: room.roomCode,
        isHost: room.hostSocketId === socket.id,
        players: serializePlayers(room.players),
        gameState: room.gameState,
      });

      // Notify other players in the room
      socket.to(room.roomCode).emit(ROOM.PLAYERS_UPDATE, {
        players: serializePlayers(room.players),
      });

      logger.info(`Player ${playerName} joined room ${room.roomCode}`);
    } catch (error) {
      logger.error('Error joining room:', error);
      socket.emit(ROOM.ERROR, { message: 'Failed to join room' });
    }
  });

  // Leave a room
  socket.on(ROOM.LEAVE, () => {
    handleLeaveRoom(io, socket);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    handleLeaveRoom(io, socket);
  });

  // Toggle ready status
  socket.on('player:ready', ({ isReady }: { isReady: boolean }) => {
    try {
      const room = roomService.setPlayerReady(socket.id, isReady);

      if (!room) {
        return;
      }

      // Broadcast updated player list
      io.to(room.roomCode).emit(ROOM.PLAYERS_UPDATE, {
        players: serializePlayers(room.players),
      });

      logger.info(`Player ${socket.id} ready status: ${isReady}`);
    } catch (error) {
      logger.error('Error toggling ready:', error);
    }
  });

  // Start game (host only)
  socket.on(GAME.START, () => {
    try {
      const room = roomService.getRoomBySocket(socket.id);

      if (!room) {
        socket.emit(ROOM.ERROR, { message: 'Room not found' });
        return;
      }

      // Check if socket is host
      if (room.hostSocketId !== socket.id) {
        socket.emit(ROOM.ERROR, { message: 'Only host can start the game' });
        return;
      }

      // Check if enough players (disabled for testing)
      // if (room.players.size < 2) {
      //   socket.emit(ROOM.ERROR, { message: 'Need at least 2 players to start' });
      //   return;
      // }

      // Start the game using game service
      gameService.startGame(room.roomCode);

      logger.info(`Game started in room ${room.roomCode}`);
    } catch (error) {
      logger.error('Error starting game:', error);
      socket.emit(ROOM.ERROR, { message: 'Failed to start game' });
    }
  });
}

// Helper function to handle leaving a room
function handleLeaveRoom(io: Server, socket: Socket) {
  const { room, roomCode } = roomService.leaveRoom(socket.id);

  if (roomCode) {
    socket.leave(roomCode);
    socket.emit(ROOM.LEFT, { roomCode });

    if (room) {
      // Notify remaining players
      io.to(roomCode).emit(ROOM.PLAYERS_UPDATE, {
        players: serializePlayers(room.players),
        newHost: room.hostSocketId,
      });
    }
  }
}

// Helper to serialize players Map to array
function serializePlayers(players: Map<string, Player>): Player[] {
  return Array.from(players.values());
}
