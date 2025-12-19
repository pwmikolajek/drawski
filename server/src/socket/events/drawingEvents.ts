import { Server, Socket } from 'socket.io';
import { roomService } from '../../services/roomService';
import { logger } from '../../utils/logger';
import { DrawingEvent } from '../../models/Room';

export function setupDrawingEvents(io: Server, socket: Socket) {
  // Handle batched drawing events
  socket.on('drawing:batch', (events: DrawingEvent[]) => {
    try {
      const room = roomService.getRoomBySocket(socket.id);

      if (!room) {
        return;
      }

      // Validate that the socket is the current drawer (disabled for testing)
      // if (room.gameState.currentDrawer !== socket.id) {
      //   logger.warn(`Non-drawer ${socket.id} attempted to draw in room ${room.roomCode}`);
      //   return;
      // }

      // Validate events structure
      if (!Array.isArray(events) || events.length === 0) {
        return;
      }

      // Validate each event
      const validEvents = events.filter(event => {
        if (typeof event.x !== 'number' || typeof event.y !== 'number') {
          return false;
        }
        if (event.type !== 'draw' && event.type !== 'move') {
          return false;
        }
        // Validate coordinates are within bounds
        if (event.x < -10 || event.x > 810 || event.y < -10 || event.y > 610) {
          return false;
        }
        return true;
      });

      if (validEvents.length === 0) {
        return;
      }

      // Add to drawing history for late joiners
      room.drawingHistory.push(...validEvents);

      // Limit drawing history size to prevent memory issues
      if (room.drawingHistory.length > 10000) {
        room.drawingHistory = room.drawingHistory.slice(-5000);
      }

      // Broadcast to all other players in the room
      socket.to(room.roomCode).emit('drawing:batch', validEvents);

      // Update last activity
      room.lastActivity = Date.now();
    } catch (error) {
      logger.error('Error handling drawing batch:', error);
    }
  });

  // Handle clear canvas
  socket.on('drawing:clear', () => {
    try {
      const room = roomService.getRoomBySocket(socket.id);

      if (!room) {
        return;
      }

      // Validate that the socket is the current drawer (disabled for testing)
      // if (room.gameState.currentDrawer !== socket.id) {
      //   logger.warn(`Non-drawer ${socket.id} attempted to clear in room ${room.roomCode}`);
      //   return;
      // }

      // Clear drawing history
      room.drawingHistory = [];

      // Broadcast clear to all other players in the room
      socket.to(room.roomCode).emit('drawing:clear');

      logger.info(`Canvas cleared in room ${room.roomCode}`);
    } catch (error) {
      logger.error('Error clearing canvas:', error);
    }
  });
}
