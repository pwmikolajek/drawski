import { Socket } from 'socket.io';
import { powerupService } from '../../services/powerupService';
import { roomService } from '../../services/roomService';
import { logger } from '../../utils/logger';
import type { PowerupId } from '../../models/Player';

export function registerPowerupEvents(socket: Socket, io: any) {
  // Get dynamic price for powerup
  socket.on('powerup:get_price', ({ powerupId, targetSocketId }: { powerupId: PowerupId; targetSocketId?: string }) => {
    const player = roomService.findPlayerBySocket(socket.id);
    if (!player) {
      socket.emit('powerup:error', { message: 'Player not found' });
      return;
    }

    const price = powerupService.getDynamicPrice(player.roomCode, socket.id, powerupId, targetSocketId);

    socket.emit('powerup:price_update', {
      powerupId,
      price,
      targetSocketId,
    });
  });

  // Purchase powerup
  socket.on('powerup:purchase', ({ powerupId, targetSocketId }: { powerupId: PowerupId; targetSocketId?: string }) => {
    const player = roomService.findPlayerBySocket(socket.id);
    if (!player) {
      socket.emit('powerup:error', { message: 'Player not found' });
      return;
    }

    const success = powerupService.purchasePowerup(player.roomCode, socket.id, powerupId, targetSocketId);

    if (success) {
      const room = roomService.getRoom(player.roomCode);
      if (room) {
        const updatedPlayer = room.players.get(socket.id);
        if (updatedPlayer) {
          // Send updated player data
          socket.emit('powerup:purchased', {
            powerupId,
            score: updatedPlayer.score,
            powerups: updatedPlayer.powerups,
          });

          // Broadcast updated scores
          io.to(player.roomCode).emit('room:players:update', {
            players: Array.from(room.players.values()),
          });

          logger.info(`Powerup ${powerupId} purchased by ${socket.id}`);
        }
      }
    } else {
      socket.emit('powerup:error', { message: 'Failed to purchase powerup' });
    }
  });

  // Activate powerup
  socket.on('powerup:activate', ({ powerupId, targetSocketId }: { powerupId: PowerupId; targetSocketId?: string }) => {
    const player = roomService.findPlayerBySocket(socket.id);
    if (!player) {
      socket.emit('powerup:error', { message: 'Player not found' });
      return;
    }

    const success = powerupService.activatePowerup(player.roomCode, socket.id, powerupId, targetSocketId);

    if (success) {
      const room = roomService.getRoom(player.roomCode);
      if (room) {
        const updatedPlayer = room.players.get(socket.id);
        if (updatedPlayer) {
          // Send updated powerup inventory and cooldowns
          socket.emit('powerup:activated', {
            powerupId,
            powerups: updatedPlayer.powerups,
            activeEffects: updatedPlayer.activeEffects,
            cooldowns: updatedPlayer.cooldowns,
          });

          // Broadcast updated players (in case effects changed)
          io.to(player.roomCode).emit('room:players:update', {
            players: Array.from(room.players.values()),
          });

          logger.info(`Powerup ${powerupId} activated by ${socket.id}`);
        }
      }
    } else {
      socket.emit('powerup:error', { message: 'Failed to activate powerup' });
    }
  });
}
