import { Server as HTTPServer } from 'http';
import { Server, Socket } from 'socket.io';
import { logger } from '../utils/logger';
import { setupRoomEvents } from './events/roomEvents';
import { setupDrawingEvents } from './events/drawingEvents';
import { setupGameEvents } from './events/gameEvents';
import { registerPowerupEvents } from './events/powerupEvents';
import { gameService } from '../services/gameService';
import { powerupService } from '../services/powerupService';

let io: Server;

export function setupSocketIO(httpServer: HTTPServer): Server {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || 'http://localhost:3000',
      credentials: true,
    },
    // Enable binary data support for low-latency drawing
    transports: ['websocket', 'polling'],
  });

  // Initialize game service with IO instance
  gameService.setIO(io);
  powerupService.setIO(io);

  io.on('connection', (socket: Socket) => {
    logger.info(`Client connected: ${socket.id}`);

    // Basic connection test
    socket.emit('connected', { socketId: socket.id });

    // Setup room events
    setupRoomEvents(io, socket);

    // Setup drawing events
    setupDrawingEvents(io, socket);

    // Setup game events
    setupGameEvents(io, socket);

    // Setup powerup events
    registerPowerupEvents(socket, io);

    // Handle disconnection
    socket.on('disconnect', (reason) => {
      logger.info(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Error handling
    socket.on('error', (error) => {
      logger.error(`Socket error for ${socket.id}:`, error);
    });
  });

  logger.info('Socket.IO initialized');
  return io;
}

export function getIO(): Server {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
