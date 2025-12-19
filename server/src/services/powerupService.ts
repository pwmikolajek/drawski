import { Server } from 'socket.io';
import { roomService } from './roomService';
import { wordService } from './wordService';
import { logger } from '../utils/logger';
import { POWERUP_CONFIG } from '../../../shared/constants';
import type { PowerupId } from '../models/Player';

class PowerupService {
  private io: Server | null = null;

  setIO(io: Server) {
    this.io = io;
  }

  // Purchase a powerup
  purchasePowerup(roomCode: string, socketId: string, powerupId: PowerupId): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room) return false;

    const player = room.players.get(socketId);
    if (!player) return false;

    // Find powerup config
    const powerup = Object.values(POWERUP_CONFIG).find(p => p.id === powerupId);
    if (!powerup) {
      logger.warn(`Invalid powerup ID: ${powerupId}`);
      return false;
    }

    // Check if player has enough points
    if (player.score < powerup.cost) {
      logger.warn(`Player ${player.name} cannot afford ${powerup.name} (cost: ${powerup.cost}, score: ${player.score})`);
      return false;
    }

    // Deduct cost and add powerup to inventory
    player.score -= powerup.cost;
    player.powerups[powerupId] = (player.powerups[powerupId] || 0) + 1;

    logger.info(`Player ${player.name} purchased ${powerup.name} for ${powerup.cost} points`);
    return true;
  }

  // Activate a powerup
  activatePowerup(roomCode: string, socketId: string, powerupId: PowerupId): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    const player = room.players.get(socketId);
    if (!player) return false;

    // Check if player owns the powerup
    if (!player.powerups[powerupId] || player.powerups[powerupId] <= 0) {
      logger.warn(`Player ${player.name} doesn't own powerup ${powerupId}`);
      return false;
    }

    // Handle powerup effects based on type
    let success = false;

    switch (powerupId) {
      case 'reveal_letter':
        success = this.activateRevealLetter(roomCode, socketId);
        break;
      case 'word_length':
        success = this.activateWordLength(roomCode, socketId);
        break;
      case 'category_hint':
        success = this.activateCategoryHint(roomCode, socketId);
        break;
      case 'extra_time':
        success = this.activateExtraTime(roomCode, socketId);
        break;
      case 'undo':
        success = this.activateUndo(roomCode, socketId);
        break;
      case 'double_points':
        success = this.activateDoublePoints(roomCode, socketId);
        break;
      case 'streak_shield':
        success = this.activateStreakShield(roomCode, socketId);
        break;
      default:
        logger.warn(`Unknown powerup type: ${powerupId}`);
        return false;
    }

    // If successful, consume the powerup
    if (success) {
      player.powerups[powerupId]--;
      if (player.powerups[powerupId] === 0) {
        delete player.powerups[powerupId];
      }
      logger.info(`Player ${player.name} activated powerup ${powerupId}`);
    }

    return success;
  }

  // Reveal Letter: Show one random hidden letter
  private activateRevealLetter(roomCode: string, socketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    const currentWord = room.gameState.currentWord;
    const displayWord = room.gameState.displayWord;

    if (!currentWord || !displayWord) return false;

    // Use the existing hint reveal logic
    const newDisplay = wordService.revealHint(currentWord, displayWord);

    // Update game state
    room.gameState.displayWord = newDisplay;

    // Send updated display to the player
    this.io.to(socketId).emit('powerup:effect', {
      type: 'reveal_letter',
      displayWord: newDisplay,
    });

    // Also broadcast hint to everyone
    this.io.to(roomCode).emit('hint:revealed', {
      displayWord: newDisplay,
    });

    return true;
  }

  // Word Length: Show exact letter count
  private activateWordLength(roomCode: string, socketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    const currentWord = room.gameState.currentWord;
    if (!currentWord) return false;

    this.io.to(socketId).emit('powerup:effect', {
      type: 'word_length',
      wordLength: currentWord.length,
      message: `The word has ${currentWord.length} letters!`,
    });

    return true;
  }

  // Category Hint: Show word category
  private activateCategoryHint(roomCode: string, socketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    const currentWord = room.gameState.currentWord;
    if (!currentWord) return false;

    // Determine category based on word (simplified categorization)
    const category = this.getWordCategory(currentWord);

    this.io.to(socketId).emit('powerup:effect', {
      type: 'category_hint',
      category,
      message: `Category: ${category}`,
    });

    return true;
  }

  // Extra Time: Add 30 seconds to round timer
  private activateExtraTime(roomCode: string, socketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    // Check if player is the drawer
    if (room.gameState.currentDrawer !== socketId) {
      logger.warn(`Player ${socketId} tried to use extra time but is not the drawer`);
      return false;
    }

    // Broadcast extra time to all players (client will handle extending the timer)
    this.io.to(roomCode).emit('powerup:effect', {
      type: 'extra_time',
      extraTime: 30000, // 30 seconds in milliseconds
      message: 'Drawer added 30 seconds to the timer!',
    });

    return true;
  }

  // Undo: Signal to client to undo last stroke (handled client-side)
  private activateUndo(roomCode: string, socketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    // Check if player is the drawer
    if (room.gameState.currentDrawer !== socketId) {
      logger.warn(`Player ${socketId} tried to use undo but is not the drawer`);
      return false;
    }

    // Emit undo event to the drawer (client handles the actual undo)
    this.io.to(socketId).emit('powerup:effect', {
      type: 'undo',
    });

    return true;
  }

  // Double Points: Activate effect for next correct guess
  private activateDoublePoints(roomCode: string, socketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room) return false;

    const player = room.players.get(socketId);
    if (!player) return false;

    // Add active effect
    player.activeEffects.push({
      type: 'double_points',
      activatedAt: Date.now(),
      expiresAt: Date.now() + 120000, // Expires in 2 minutes
    });

    // Notify player
    this.io?.to(socketId).emit('powerup:effect', {
      type: 'double_points',
      message: 'Your next correct guess will earn 2x points!',
    });

    return true;
  }

  // Streak Shield: Protect streak from one failed guess
  private activateStreakShield(roomCode: string, socketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room) return false;

    const player = room.players.get(socketId);
    if (!player) return false;

    // Add active effect
    player.activeEffects.push({
      type: 'streak_shield',
      activatedAt: Date.now(),
      expiresAt: Date.now() + 120000, // Expires in 2 minutes
    });

    // Notify player
    this.io?.to(socketId).emit('powerup:effect', {
      type: 'streak_shield',
      message: 'Your streak is protected for the next round!',
    });

    return true;
  }

  // Check if player has an active effect
  hasActiveEffect(player: any, effectType: PowerupId): boolean {
    const now = Date.now();
    return player.activeEffects.some((effect: any) =>
      effect.type === effectType &&
      (!effect.expiresAt || effect.expiresAt > now)
    );
  }

  // Remove expired effects
  cleanupExpiredEffects(player: any): void {
    const now = Date.now();
    player.activeEffects = player.activeEffects.filter((effect: any) =>
      !effect.expiresAt || effect.expiresAt > now
    );
  }

  // Consume an active effect (remove it)
  consumeEffect(player: any, effectType: PowerupId): void {
    const index = player.activeEffects.findIndex((effect: any) => effect.type === effectType);
    if (index !== -1) {
      player.activeEffects.splice(index, 1);
    }
  }

  // Helper: Determine word category (simplified)
  private getWordCategory(word: string): string {
    // Simple categorization based on common words
    // In a real implementation, you'd have a more sophisticated system
    const animals = ['cat', 'dog', 'elephant', 'giraffe', 'bird', 'fish', 'dragon', 'dinosaur', 'butterfly', 'caterpillar', 'rhinoceros', 'hippopotamus'];
    const objects = ['book', 'phone', 'cup', 'plate', 'fork', 'spoon', 'pen', 'key', 'bag', 'box', 'clock', 'lamp', 'guitar', 'piano', 'camera'];
    const places = ['house', 'castle', 'island', 'mountain', 'ocean', 'volcano', 'pyramid', 'bridge'];
    const food = ['apple', 'pizza', 'cake', 'hamburger', 'sandwich'];
    const nature = ['sun', 'moon', 'star', 'tree', 'flower', 'rainbow'];

    const lowerWord = word.toLowerCase();

    if (animals.includes(lowerWord)) return 'Animal';
    if (objects.includes(lowerWord)) return 'Object';
    if (places.includes(lowerWord)) return 'Place';
    if (food.includes(lowerWord)) return 'Food';
    if (nature.includes(lowerWord)) return 'Nature';

    return 'Thing'; // Default category
  }

  // Award free powerup to player
  awardPowerup(roomCode: string, socketId: string, powerupId: PowerupId): void {
    const room = roomService.getRoom(roomCode);
    if (!room) return;

    const player = room.players.get(socketId);
    if (!player) return;

    player.powerups[powerupId] = (player.powerups[powerupId] || 0) + 1;

    const powerup = Object.values(POWERUP_CONFIG).find(p => p.id === powerupId);
    if (powerup) {
      this.io?.to(socketId).emit('powerup:awarded', {
        powerupId,
        name: powerup.name,
        badge: powerup.badge,
      });
      logger.info(`Awarded ${powerup.name} to ${player.name}`);
    }
  }
}

export const powerupService = new PowerupService();
