import { Server } from 'socket.io';
import { roomService } from './roomService';
import { wordService } from './wordService';
import { logger } from '../utils/logger';
import { POWERUP_CONFIG, POWERUP_PRICING } from '../../../shared/constants';
import type { PowerupId } from '../models/Player';
import type { Player } from '../models/Player';

class PowerupService {
  private io: Server | null = null;

  setIO(io: Server) {
    this.io = io;
  }

  // Get dynamic price based on game state
  getDynamicPrice(
    roomCode: string,
    socketId: string,
    powerupId: PowerupId,
    targetSocketId?: string
  ): number {
    const room = roomService.getRoom(roomCode);
    if (!room) return 0;

    const powerup = Object.values(POWERUP_CONFIG).find(p => p.id === powerupId);
    if (!powerup) return 0;

    const basePrice = powerup.basePrice;
    let multiplier = 1.0;

    // 1. Position-based multiplier
    const sortedPlayers = Array.from(room.players.values()).sort((a, b) => b.score - a.score);
    const playerRank = sortedPlayers.findIndex(p => p.socketId === socketId);

    if (playerRank === 0) {
      multiplier *= POWERUP_PRICING.POSITION_MULTIPLIERS.FIRST;
    } else if (playerRank === 1) {
      multiplier *= POWERUP_PRICING.POSITION_MULTIPLIERS.SECOND;
    } else if (playerRank === 2) {
      multiplier *= POWERUP_PRICING.POSITION_MULTIPLIERS.THIRD;
    } else if (playerRank === 3) {
      multiplier *= POWERUP_PRICING.POSITION_MULTIPLIERS.FOURTH;
    } else if (playerRank === 4) {
      multiplier *= POWERUP_PRICING.POSITION_MULTIPLIERS.FIFTH;
    } else if (playerRank === sortedPlayers.length - 1) {
      multiplier *= POWERUP_PRICING.POSITION_MULTIPLIERS.LAST;
    }

    // 2. Time-based multiplier (based on round progress)
    if (room.gameState.roundStartTime) {
      const elapsed = Date.now() - room.gameState.roundStartTime;
      const total = room.gameState.roundDuration;
      const progress = elapsed / total;

      if (progress < 0.33) {
        multiplier *= POWERUP_PRICING.TIME_MULTIPLIERS.EARLY;
      } else if (progress < 0.67) {
        multiplier *= POWERUP_PRICING.TIME_MULTIPLIERS.MID;
      } else {
        multiplier *= POWERUP_PRICING.TIME_MULTIPLIERS.LATE;
      }
    }

    // 3. Target-based pricing (competitive powerups)
    if (targetSocketId && powerup.type === 'competitive') {
      const targetRank = sortedPlayers.findIndex(p => p.socketId === targetSocketId);

      // Anti-griefing: Targeting last place costs more
      if (targetRank === sortedPlayers.length - 1) {
        multiplier *= POWERUP_PRICING.GRIEFING_PENALTY;
      }

      // Comeback mechanics
      if (playerRank === sortedPlayers.length - 1) {
        multiplier *= POWERUP_PRICING.COMEBACK_BONUS;
      } else if (playerRank === 0) {
        multiplier *= POWERUP_PRICING.LEADER_PENALTY;
      }
    }

    // Clamp multiplier to bounds
    multiplier = Math.max(POWERUP_PRICING.MIN_MULTIPLIER, Math.min(POWERUP_PRICING.MAX_MULTIPLIER, multiplier));

    return Math.round(basePrice * multiplier);
  }

  // Check if player can use powerup (cooldown validation)
  canUsePowerup(roomCode: string, socketId: string, powerupId: PowerupId): { allowed: boolean; reason?: string } {
    const room = roomService.getRoom(roomCode);
    if (!room) return { allowed: false, reason: 'Room not found' };

    const player = room.players.get(socketId);
    if (!player) return { allowed: false, reason: 'Player not found' };

    const powerup = Object.values(POWERUP_CONFIG).find(p => p.id === powerupId);
    if (!powerup) return { allowed: false, reason: 'Invalid powerup' };

    const now = Date.now();

    // Check personal cooldown
    if (player.cooldowns[powerupId]) {
      const cooldown = player.cooldowns[powerupId];
      if (cooldown.canUseAgainAt > now) {
        const secondsLeft = Math.ceil((cooldown.canUseAgainAt - now) / 1000);
        return { allowed: false, reason: `On cooldown for ${secondsLeft}s` };
      }
    }

    // Check global cooldown
    if (room.globalCooldowns[powerupId]) {
      const globalCooldown = room.globalCooldowns[powerupId];
      if (globalCooldown.canUseAgainAt > now) {
        const secondsLeft = Math.ceil((globalCooldown.canUseAgainAt - now) / 1000);
        return { allowed: false, reason: `Global cooldown: ${secondsLeft}s` };
      }

      // Check per-round usage limits
      if (globalCooldown.usesThisRound >= powerup.maxUsesPerRound) {
        return { allowed: false, reason: `Max uses per round reached (${powerup.maxUsesPerRound})` };
      }
    }

    return { allowed: true };
  }

  // Validate target for competitive powerups
  validateTarget(
    roomCode: string,
    attackerSocketId: string,
    targetSocketId: string | undefined,
    powerupId: PowerupId
  ): { valid: boolean; reason?: string } {
    const room = roomService.getRoom(roomCode);
    if (!room) return { valid: false, reason: 'Room not found' };

    const powerup = Object.values(POWERUP_CONFIG).find(p => p.id === powerupId);
    if (!powerup) return { valid: false, reason: 'Invalid powerup' };

    // Check if powerup requires a target
    if (powerup.requiresTarget && !targetSocketId) {
      return { valid: false, reason: 'This powerup requires a target' };
    }

    if (!targetSocketId) return { valid: true };

    // Can't target self
    if (targetSocketId === attackerSocketId) {
      return { valid: false, reason: 'Cannot target yourself' };
    }

    // Target must be a valid player
    const target = room.players.get(targetSocketId);
    if (!target) {
      return { valid: false, reason: 'Invalid target' };
    }

    // For most competitive powerups, can't target the drawer
    if (targetSocketId === room.gameState.currentDrawer && powerupId !== 'point_steal') {
      return { valid: false, reason: 'Cannot target the drawer' };
    }

    return { valid: true };
  }

  // Update cooldowns after powerup use
  private updateCooldowns(roomCode: string, socketId: string, powerupId: PowerupId): void {
    const room = roomService.getRoom(roomCode);
    if (!room) return;

    const player = room.players.get(socketId);
    if (!player) return;

    const powerup = Object.values(POWERUP_CONFIG).find(p => p.id === powerupId);
    if (!powerup) return;

    const now = Date.now();

    // Update personal cooldown
    if (powerup.personalCooldown > 0) {
      player.cooldowns[powerupId] = {
        lastUsedAt: now,
        canUseAgainAt: now + powerup.personalCooldown,
      };
    }

    // Update global cooldown
    if (powerup.globalCooldown > 0) {
      if (!room.globalCooldowns[powerupId]) {
        room.globalCooldowns[powerupId] = {
          lastUsedBy: socketId,
          canUseAgainAt: now + powerup.globalCooldown,
          usesThisRound: 0,
        };
      } else {
        room.globalCooldowns[powerupId].lastUsedBy = socketId;
        room.globalCooldowns[powerupId].canUseAgainAt = now + powerup.globalCooldown;
      }
    }

    // Increment per-round usage counter
    if (!room.globalCooldowns[powerupId]) {
      room.globalCooldowns[powerupId] = {
        lastUsedBy: socketId,
        canUseAgainAt: now,
        usesThisRound: 1,
      };
    } else {
      room.globalCooldowns[powerupId].usesThisRound++;
    }
  }

  // Purchase a powerup
  purchasePowerup(roomCode: string, socketId: string, powerupId: PowerupId, targetSocketId?: string): boolean {
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

    // Calculate dynamic price
    const price = this.getDynamicPrice(roomCode, socketId, powerupId, targetSocketId);

    // Check if player has enough points
    if (player.score < price) {
      logger.warn(`Player ${player.name} cannot afford ${powerup.name} (cost: ${price}, score: ${player.score})`);
      return false;
    }

    // Deduct cost and add powerup to inventory
    player.score -= price;
    player.powerups[powerupId] = (player.powerups[powerupId] || 0) + 1;

    logger.info(`Player ${player.name} purchased ${powerup.name} for ${price} points`);
    return true;
  }

  // Activate a powerup
  activatePowerup(roomCode: string, socketId: string, powerupId: PowerupId, targetSocketId?: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    const player = room.players.get(socketId);
    if (!player) return false;

    // Check if player owns the powerup
    if (!player.powerups[powerupId] || player.powerups[powerupId] <= 0) {
      logger.warn(`Player ${player.name} doesn't own powerup ${powerupId}`);
      return false;
    }

    // Validate cooldowns
    const cooldownCheck = this.canUsePowerup(roomCode, socketId, powerupId);
    if (!cooldownCheck.allowed) {
      logger.warn(`Powerup ${powerupId} blocked: ${cooldownCheck.reason}`);
      return false;
    }

    // Validate target for competitive powerups
    const targetCheck = this.validateTarget(roomCode, socketId, targetSocketId, powerupId);
    if (!targetCheck.valid) {
      logger.warn(`Target validation failed: ${targetCheck.reason}`);
      return false;
    }

    // Handle powerup effects based on type
    let success = false;

    switch (powerupId) {
      // KEPT POWERUPS (3)
      case 'reveal_letter':
        success = this.activateRevealLetter(roomCode, socketId);
        break;
      case 'extra_time':
        success = this.activateExtraTime(roomCode, socketId);
        break;
      case 'streak_shield':
        success = this.activateStreakShield(roomCode, socketId);
        break;

      // NEW SELF-HELP POWERUPS (3)
      case 'time_warp':
        success = this.activateTimeWarp(roomCode, socketId);
        break;
      case 'triple_points':
        success = this.activateTriplePoints(roomCode, socketId);
        break;

      // NEW COMPETITIVE POWERUPS (5)
      case 'blind_spot':
        success = this.activateBlindSpot(roomCode, socketId, targetSocketId!);
        break;
      case 'point_steal':
        success = this.activatePointSteal(roomCode, socketId, targetSocketId!);
        break;
      case 'canvas_chaos':
        success = this.activateCanvasChaos(roomCode, socketId, targetSocketId!);
        break;
      case 'brush_sabotage':
        success = this.activateBrushSabotage(roomCode, socketId);
        break;
      case 'speed_curse':
        success = this.activateSpeedCurse(roomCode, socketId, targetSocketId!);
        break;

      // NEW TACTICAL POWERUPS (2)
      case 'oracle_hint':
        success = this.activateOracleHint(roomCode, socketId);
        break;

      default:
        logger.warn(`Unknown powerup type: ${powerupId}`);
        return false;
    }

    // If successful, consume the powerup and update cooldowns
    if (success) {
      player.powerups[powerupId]--;
      if (player.powerups[powerupId] === 0) {
        delete player.powerups[powerupId];
      }
      this.updateCooldowns(roomCode, socketId, powerupId);
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

  // === NEW SELF-HELP POWERUPS ===

  // Time Warp: Freeze timer for 15 seconds
  private activateTimeWarp(roomCode: string, socketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    const now = Date.now();
    room.gameState.timePausedUntil = now + 15000; // 15 seconds

    // Broadcast to all players
    this.io.to(roomCode).emit('powerup:time_warp:activated', {
      pausedUntil: room.gameState.timePausedUntil,
      activatedBy: socketId,
    });

    // Auto-end after duration
    setTimeout(() => {
      const roomCheck = roomService.getRoom(roomCode);
      if (roomCheck) {
        roomCheck.gameState.timePausedUntil = null;
        this.io?.to(roomCode).emit('powerup:time_warp:ended');
      }
    }, 15000);

    return true;
  }

  // Triple Points: 3x points for next correct guess
  private activateTriplePoints(roomCode: string, socketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room) return false;

    const player = room.players.get(socketId);
    if (!player) return false;

    // Add active effect
    player.activeEffects.push({
      type: 'triple_points',
      activatedAt: Date.now(),
      expiresAt: Date.now() + 120000, // Expires in 2 minutes
    });

    // Notify player
    this.io?.to(socketId).emit('powerup:effect', {
      type: 'triple_points',
      message: 'Your next correct guess will earn 3x points!',
    });

    return true;
  }

  // === NEW COMPETITIVE POWERUPS ===

  // Blind Spot: Cover 30% of target's canvas with fog for 25 seconds
  private activateBlindSpot(roomCode: string, socketId: string, targetSocketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    // Send fog effect to target player
    this.io.to(targetSocketId).emit('powerup:blind_spot:applied', {
      duration: 25000,
      coverage: 0.3,
      attackedBy: socketId,
    });

    // Auto-end after duration
    setTimeout(() => {
      this.io?.to(targetSocketId).emit('powerup:blind_spot:ended');
    }, 25000);

    return true;
  }

  // Point Steal: Steal 15% of target's score (100-400 points)
  private activatePointSteal(roomCode: string, socketId: string, targetSocketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    const player = room.players.get(socketId);
    const target = room.players.get(targetSocketId);

    if (!player || !target) return false;

    // Calculate steal amount (15% of target score, clamped 100-400)
    const stealAmount = Math.max(100, Math.min(400, Math.floor(target.score * 0.15)));

    // Transfer points
    target.score = Math.max(0, target.score - stealAmount);
    player.score += stealAmount;

    // Notify both players
    this.io.to(targetSocketId).emit('powerup:point_steal:executed', {
      amount: stealAmount,
      stolento: socketId,
    });

    this.io.to(socketId).emit('powerup:point_steal:executed', {
      amount: stealAmount,
      stolenFrom: targetSocketId,
    });

    // Broadcast score update to room
    this.io.to(roomCode).emit('room:players:update', {
      players: Array.from(room.players.values()),
    });

    return true;
  }

  // Canvas Chaos: Invert colors on target's screen for 20 seconds
  private activateCanvasChaos(roomCode: string, socketId: string, targetSocketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    // Send invert effect to target player
    this.io.to(targetSocketId).emit('powerup:canvas_chaos:applied', {
      duration: 20000,
      attackedBy: socketId,
    });

    // Auto-end after duration
    setTimeout(() => {
      this.io?.to(targetSocketId).emit('powerup:canvas_chaos:ended');
    }, 20000);

    return true;
  }

  // Brush Sabotage: Random brush sizes for drawer for 15 seconds
  private activateBrushSabotage(roomCode: string, socketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    const drawerSocketId = room.gameState.currentDrawer;
    if (!drawerSocketId) return false;

    room.gameState.brushSabotageActive = true;

    // Send sabotage effect to drawer
    this.io.to(drawerSocketId).emit('powerup:brush_sabotage:activated', {
      duration: 15000,
      attackedBy: socketId,
    });

    // Auto-end after duration
    setTimeout(() => {
      const roomCheck = roomService.getRoom(roomCode);
      if (roomCheck) {
        roomCheck.gameState.brushSabotageActive = false;
        this.io?.to(drawerSocketId).emit('powerup:brush_sabotage:ended');
      }
    }, 15000);

    return true;
  }

  // Speed Curse: Halve next guess points for target
  private activateSpeedCurse(roomCode: string, socketId: string, targetSocketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room) return false;

    const target = room.players.get(targetSocketId);
    if (!target) return false;

    // Add active effect to target
    target.activeEffects.push({
      type: 'speed_curse',
      activatedAt: Date.now(),
      expiresAt: Date.now() + 120000, // Expires in 2 minutes
    });

    // Notify target
    this.io?.to(targetSocketId).emit('powerup:speed_curse:applied', {
      attackedBy: socketId,
    });

    return true;
  }

  // === NEW TACTICAL POWERUPS ===

  // Oracle Hint: Reveal category AND first letter
  private activateOracleHint(roomCode: string, socketId: string): boolean {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return false;

    const currentWord = room.gameState.currentWord;
    if (!currentWord) return false;

    // Get category
    const category = this.getWordCategory(currentWord);

    // Get first letter
    const firstLetter = currentWord[0];

    // Send to requesting player
    this.io.to(socketId).emit('powerup:oracle_hint:revealed', {
      category,
      firstLetter,
      message: `Category: ${category} | First letter: ${firstLetter}`,
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
