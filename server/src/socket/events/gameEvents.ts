import { Server, Socket } from 'socket.io';
import { roomService } from '../../services/roomService';
import { gameService } from '../../services/gameService';
import { logger } from '../../utils/logger';
import { CHAT, GUESS } from '../../../../shared/eventNames';

export function setupGameEvents(io: Server, socket: Socket) {
  // Handle word selection
  socket.on('word:select', ({ word }: { word: string }) => {
    try {
      const roomCode = roomService.getRoomCode(socket.id);
      if (!roomCode) return;

      gameService.selectWord(roomCode, socket.id, word);
    } catch (error) {
      logger.error('Error selecting word:', error);
    }
  });

  // Handle game restart
  socket.on('game:restart', () => {
    try {
      const roomCode = roomService.getRoomCode(socket.id);
      if (!roomCode) return;

      const room = roomService.getRoom(roomCode);
      if (!room) return;

      // Only host can restart the game
      const isHost = Array.from(room.players.values())[0]?.socketId === socket.id;
      if (!isHost) {
        socket.emit('room:error', { message: 'Only the host can restart the game' });
        return;
      }

      gameService.restartGame(roomCode);
    } catch (error) {
      logger.error('Error restarting game:', error);
    }
  });

  // Handle chat messages (and guess detection)
  socket.on(CHAT.MESSAGE, ({ message }: { message: string }) => {
    try {
      const roomCode = roomService.getRoomCode(socket.id);
      if (!roomCode) return;

      const room = roomService.getRoom(roomCode);
      if (!room) return;

      const player = room.players.get(socket.id);
      if (!player) return;

      // Validate message
      const trimmedMessage = message.trim();
      if (!trimmedMessage || trimmedMessage.length > 100) return;

      // Check if this is a guess during drawing phase
      if (room.gameState.status === 'drawing' &&
          room.gameState.currentWord &&
          room.gameState.currentDrawer !== socket.id) {

        // Check if player already guessed correctly
        if (player.guessedCorrectly) {
          // Send message normally (already guessed)
          io.to(roomCode).emit(CHAT.RECEIVED, {
            playerName: player.name,
            message: trimmedMessage,
            isCorrect: false,
            timestamp: Date.now(),
          });
          return;
        }

        // Check if guess is correct (case-insensitive, trim whitespace)
        const isCorrect = trimmedMessage.toLowerCase() === room.gameState.currentWord.toLowerCase();

        if (isCorrect) {
          // Calculate and award score
          gameService.handleCorrectGuess(roomCode, socket.id);

          // Notify the guesser
          socket.emit(GUESS.CORRECT, {
            message: 'Correct! You guessed the word!',
          });

          // Notify everyone else
          socket.to(roomCode).emit(CHAT.RECEIVED, {
            playerName: player.name,
            message: `${player.name} guessed the word!`,
            isCorrect: true,
            timestamp: Date.now(),
          });

          logger.info(`Player ${player.name} guessed correctly in room ${roomCode}`);
        } else {
          // Wrong guess - show as "****" to other players to avoid giving hints
          socket.to(roomCode).emit(CHAT.RECEIVED, {
            playerName: player.name,
            message: '****',
            isCorrect: false,
            timestamp: Date.now(),
          });

          // Show actual message to the player who sent it
          socket.emit(CHAT.RECEIVED, {
            playerName: player.name,
            message: trimmedMessage,
            isCorrect: false,
            timestamp: Date.now(),
          });
        }
      } else {
        // Not in drawing phase or player is drawer - send message normally
        io.to(roomCode).emit(CHAT.RECEIVED, {
          playerName: player.name,
          message: trimmedMessage,
          isCorrect: false,
          timestamp: Date.now(),
        });
      }
    } catch (error) {
      logger.error('Error handling chat message:', error);
    }
  });
}
