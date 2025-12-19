import { Server } from 'socket.io';
import { roomService } from './roomService';
import { wordService } from './wordService';
import { powerupService } from './powerupService';
import { logger } from '../utils/logger';
import { GAME_CONFIG, DIFFICULTY_CONFIG, BONUS_CONFIG } from '../../../shared/constants';
import { GAME, HINT } from '../../../shared/eventNames';

class GameService {
  private io: Server | null = null;
  private roundTimers: Map<string, NodeJS.Timeout> = new Map();
  private hintTimers: Map<string, NodeJS.Timeout[]> = new Map();

  setIO(io: Server) {
    this.io = io;
  }

  // Start a new game
  startGame(roomCode: string) {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return;

    // Reset game state
    room.gameState.round = 1;
    room.gameState.status = 'choosing';

    // Reset all player scores and states
    room.players.forEach(player => {
      player.score = 0;
      player.guessedCorrectly = false;
    });

    // Start first round
    this.startRound(roomCode);

    logger.info(`Game started in room ${roomCode}`);
  }

  // Restart the game (full reset including streaks and powerups)
  restartGame(roomCode: string) {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return;

    // Clear any existing timers
    this.clearRoundTimers(roomCode);

    // Reset game state
    room.gameState.round = 1;
    room.gameState.status = 'waiting';
    room.gameState.currentDrawer = '';
    room.gameState.currentWord = null;
    room.gameState.displayWord = null;
    room.gameState.currentWordDifficulty = null;
    room.gameState.roundStartTime = null;
    room.gameState.wordOptions = null;
    room.gameState.firstBloodAwarded = false;
    room.gameState.guessTimeStamps.clear();

    // Reset all player scores, streaks, and powerups
    room.players.forEach(player => {
      player.score = 0;
      player.guessedCorrectly = false;
      player.currentStreak = 0;
      player.totalCorrectGuesses = 0;
      player.powerups = {};
      player.activeEffects = [];
    });

    // Clear drawing history
    room.drawingHistory = [];

    // Notify all players that game was restarted
    this.io.to(roomCode).emit(GAME.RESTARTED, {
      players: Array.from(room.players.values()),
      gameState: room.gameState,
    });

    logger.info(`Game restarted in room ${roomCode}`);
  }

  // Start a new round
  startRound(roomCode: string) {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return;

    // Clear drawing history
    room.drawingHistory = [];

    // Clear any existing timers
    this.clearRoundTimers(roomCode);

    // Reset guessed status for all players
    room.players.forEach(player => {
      player.guessedCorrectly = false;
    });

    // Select next drawer (round-robin)
    const players = Array.from(room.players.values());
    const currentDrawerIndex = players.findIndex(p => p.socketId === room.gameState.currentDrawer);
    const nextDrawerIndex = (currentDrawerIndex + 1) % players.length;
    const nextDrawer = players[nextDrawerIndex];

    room.gameState.currentDrawer = nextDrawer.socketId;
    room.gameState.status = 'choosing';
    room.gameState.currentWord = null;
    room.gameState.displayWord = null;
    room.gameState.currentWordDifficulty = null;
    room.gameState.roundStartTime = null;
    room.gameState.firstBloodAwarded = false;
    room.gameState.guessTimeStamps.clear();

    // Get word options (one from each difficulty level)
    const wordOptions = wordService.getWordOptions();
    room.gameState.wordOptions = wordOptions;

    // Notify drawer to choose a word
    this.io.to(nextDrawer.socketId).emit(GAME.ROUND_START_DRAWER, {
      wordOptions,
      round: room.gameState.round,
      maxRounds: room.gameState.maxRounds,
    });

    // Notify other players
    nextDrawer.socketId;
    this.io.to(roomCode).except(nextDrawer.socketId).emit(GAME.ROUND_START_GUESSER, {
      drawerName: nextDrawer.name,
      round: room.gameState.round,
      maxRounds: room.gameState.maxRounds,
    });

    // Auto-select word if drawer doesn't choose within time limit
    const autoSelectTimeout = setTimeout(() => {
      const currentRoom = roomService.getRoom(roomCode);
      if (currentRoom && currentRoom.gameState.status === 'choosing') {
        const randomWordObj = wordOptions[Math.floor(Math.random() * wordOptions.length)];
        this.selectWord(roomCode, nextDrawer.socketId, randomWordObj.word, randomWordObj.difficulty);
      }
    }, GAME_CONFIG.WORD_CHOICE_TIME);

    this.roundTimers.set(roomCode + '_choice', autoSelectTimeout);

    logger.info(`Round ${room.gameState.round} started in room ${roomCode}, drawer: ${nextDrawer.name}`);
  }

  // Handle word selection by drawer
  selectWord(roomCode: string, socketId: string, word: string, difficulty?: string) {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return;

    // Validate drawer
    if (room.gameState.currentDrawer !== socketId) {
      logger.warn(`Non-drawer tried to select word in room ${roomCode}`);
      return;
    }

    // Validate word is in options
    const wordObj = room.gameState.wordOptions?.find(w => w.word === word);
    if (!wordObj) {
      logger.warn(`Invalid word selected in room ${roomCode}`);
      return;
    }

    // Use provided difficulty or get from wordObj
    const wordDifficulty = difficulty || wordObj.difficulty;

    // Clear word choice timer
    const choiceTimer = this.roundTimers.get(roomCode + '_choice');
    if (choiceTimer) {
      clearTimeout(choiceTimer);
      this.roundTimers.delete(roomCode + '_choice');
    }

    // Set word and create display
    room.gameState.currentWord = word;
    room.gameState.currentWordDifficulty = wordDifficulty as any;
    room.gameState.displayWord = wordService.createDisplayWord(word);
    room.gameState.status = 'drawing';
    room.gameState.roundStartTime = Date.now();
    room.gameState.wordOptions = null;

    // Clear canvas for new round
    this.io.to(roomCode).emit('drawing:clear');

    // Notify drawer with actual word
    this.io.to(socketId).emit(GAME.WORD_SELECTED, {
      displayWord: room.gameState.displayWord,
      wordLength: word.length,
      actualWord: word, // Send actual word to drawer
      difficulty: wordDifficulty, // Send difficulty to drawer
    });

    // Notify guessers with masked word only
    this.io.to(roomCode).except(socketId).emit(GAME.WORD_SELECTED, {
      displayWord: room.gameState.displayWord,
      wordLength: word.length,
      difficulty: wordDifficulty, // Send difficulty to guessers
    });

    // Start hint timers
    this.startHintTimers(roomCode);

    // Start round timer
    const roundTimeout = setTimeout(() => {
      this.endRound(roomCode);
    }, GAME_CONFIG.ROUND_DURATION);

    this.roundTimers.set(roomCode + '_round', roundTimeout);

    logger.info(`Word selected in room ${roomCode}: ${word}`);
  }

  // Start hint reveal timers
  private startHintTimers(roomCode: string) {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return;

    const timers: NodeJS.Timeout[] = [];

    GAME_CONFIG.HINT_INTERVALS.forEach((interval) => {
      const timer = setTimeout(() => {
        this.revealHint(roomCode);
      }, interval);
      timers.push(timer);
    });

    this.hintTimers.set(roomCode, timers);
  }

  // Reveal a hint
  private revealHint(roomCode: string) {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io || !room.gameState.currentWord || !room.gameState.displayWord) return;

    // Don't reveal hints if round is over
    if (room.gameState.status !== 'drawing') return;

    const newDisplay = wordService.revealHint(room.gameState.currentWord, room.gameState.displayWord);
    room.gameState.displayWord = newDisplay;

    // Broadcast hint to all players
    this.io.to(roomCode).emit(HINT.REVEALED, {
      displayWord: newDisplay,
    });

    logger.info(`Hint revealed in room ${roomCode}: ${newDisplay}`);
  }

  // Handle correct guess and calculate score with bonuses
  handleCorrectGuess(roomCode: string, socketId: string) {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return;

    const player = room.players.get(socketId);
    if (!player || player.guessedCorrectly) return;

    // Mark player as guessed correctly
    player.guessedCorrectly = true;
    const guessTime = Date.now();
    room.gameState.guessTimeStamps.set(socketId, guessTime);

    // Calculate base score with time and difficulty multipliers
    const timeElapsed = guessTime - (room.gameState.roundStartTime || guessTime);
    const timeRemaining = GAME_CONFIG.ROUND_DURATION - timeElapsed;
    const timeRatio = Math.max(0, timeRemaining / GAME_CONFIG.ROUND_DURATION);

    const baseScore = Math.round(
      GAME_CONFIG.MIN_SCORE + (GAME_CONFIG.MAX_SCORE - GAME_CONFIG.MIN_SCORE) * timeRatio
    );

    // Apply difficulty multiplier
    const difficulty = room.gameState.currentWordDifficulty || 'easy';
    const difficultyMultiplier = difficulty === 'hard'
      ? DIFFICULTY_CONFIG.HARD.multiplier
      : difficulty === 'medium'
        ? DIFFICULTY_CONFIG.MEDIUM.multiplier
        : DIFFICULTY_CONFIG.EASY.multiplier;

    let totalScore = Math.round(baseScore * difficultyMultiplier);
    const bonuses: Array<{ type: string; amount: number; badge: string }> = [];

    // 1. Check for speed bonuses
    if (timeElapsed < BONUS_CONFIG.SPEED.LIGHTNING.threshold) {
      bonuses.push({
        type: BONUS_CONFIG.SPEED.LIGHTNING.label,
        amount: BONUS_CONFIG.SPEED.LIGHTNING.bonus,
        badge: BONUS_CONFIG.SPEED.LIGHTNING.badge,
      });
      totalScore += BONUS_CONFIG.SPEED.LIGHTNING.bonus;
    } else if (timeElapsed < BONUS_CONFIG.SPEED.QUICK.threshold) {
      bonuses.push({
        type: BONUS_CONFIG.SPEED.QUICK.label,
        amount: BONUS_CONFIG.SPEED.QUICK.bonus,
        badge: BONUS_CONFIG.SPEED.QUICK.badge,
      });
      totalScore += BONUS_CONFIG.SPEED.QUICK.bonus;
    } else if (timeElapsed < BONUS_CONFIG.SPEED.FAST.threshold) {
      bonuses.push({
        type: BONUS_CONFIG.SPEED.FAST.label,
        amount: BONUS_CONFIG.SPEED.FAST.bonus,
        badge: BONUS_CONFIG.SPEED.FAST.badge,
      });
      totalScore += BONUS_CONFIG.SPEED.FAST.bonus;
    }

    // 2. Check for first blood
    if (!room.gameState.firstBloodAwarded) {
      room.gameState.firstBloodAwarded = true;
      bonuses.push({
        type: BONUS_CONFIG.FIRST_BLOOD.label,
        amount: BONUS_CONFIG.FIRST_BLOOD.bonus,
        badge: BONUS_CONFIG.FIRST_BLOOD.badge,
      });
      totalScore += BONUS_CONFIG.FIRST_BLOOD.bonus;
    }

    // 3. Apply streak bonus (if player has a streak from previous rounds)
    if (player.currentStreak > 0) {
      const streakBonus = Math.min(
        player.currentStreak * BONUS_CONFIG.STREAK.bonusPerStreak,
        BONUS_CONFIG.STREAK.maxStreakBonus
      );
      bonuses.push({
        type: `${BONUS_CONFIG.STREAK.label} x${player.currentStreak}`,
        amount: streakBonus,
        badge: BONUS_CONFIG.STREAK.badge,
      });
      totalScore += streakBonus;
    }

    // 4. Check for double points powerup
    if (powerupService.hasActiveEffect(player, 'double_points')) {
      const doubleBonus = totalScore; // Double the total score
      totalScore += doubleBonus;
      bonuses.push({
        type: '2x Points Powerup',
        amount: doubleBonus,
        badge: '⭐',
      });
      // Consume the effect
      powerupService.consumeEffect(player, 'double_points');
    }

    // 5. Increment streak and stats
    player.currentStreak++;
    player.totalCorrectGuesses++;
    player.maxStreak = Math.max(player.maxStreak, player.currentStreak);

    // Award powerups for milestones
    if (player.currentStreak === 3) {
      powerupService.awardPowerup(roomCode, socketId, 'reveal_letter');
    } else if (player.totalCorrectGuesses === 10) {
      powerupService.awardPowerup(roomCode, socketId, 'double_points');
    }

    // Add total score to player
    player.score += totalScore;

    // Award points to drawer (50% of guesser's total score)
    const drawer = room.players.get(room.gameState.currentDrawer!);
    if (drawer) {
      const drawerBonus = Math.round(totalScore * GAME_CONFIG.DRAWER_SCORE_MULTIPLIER);
      drawer.score += drawerBonus;
    }

    // Emit bonus notification to the player
    if (bonuses.length > 0) {
      this.io.to(socketId).emit('bonus:awarded', {
        bonuses,
        totalBonus: bonuses.reduce((sum, b) => sum + b.amount, 0),
        baseScore: Math.round(baseScore * difficultyMultiplier),
        totalScore,
      });
    }

    // Broadcast updated scores to all players
    this.io.to(roomCode).emit('room:players:update', {
      players: Array.from(room.players.values()),
    });

    // Check if all guessers have guessed correctly
    const allGuessed = Array.from(room.players.values())
      .filter(p => p.socketId !== room.gameState.currentDrawer)
      .every(p => p.guessedCorrectly);

    if (allGuessed) {
      // Award perfect round bonus
      this.awardPerfectRoundBonus(roomCode);
      logger.info(`All players guessed correctly in room ${roomCode}, ending round early`);
      this.endRound(roomCode);
    }

    logger.info(`Player ${player.name} scored ${totalScore} points (base: ${Math.round(baseScore * difficultyMultiplier)}, bonuses: ${bonuses.length})`);
  }

  // Award perfect round bonus to all players
  private awardPerfectRoundBonus(roomCode: string) {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return;

    const guessers = Array.from(room.players.values()).filter(
      p => p.socketId !== room.gameState.currentDrawer
    );

    // Award bonus to all guessers
    guessers.forEach(player => {
      player.score += BONUS_CONFIG.PERFECT_ROUND.guesserBonus;
      this.io?.to(player.socketId).emit('bonus:awarded', {
        bonuses: [{
          type: BONUS_CONFIG.PERFECT_ROUND.label,
          amount: BONUS_CONFIG.PERFECT_ROUND.guesserBonus,
          badge: BONUS_CONFIG.PERFECT_ROUND.badge,
        }],
        totalBonus: BONUS_CONFIG.PERFECT_ROUND.guesserBonus,
        baseScore: 0,
        totalScore: BONUS_CONFIG.PERFECT_ROUND.guesserBonus,
      });
    });

    // Award bonus to drawer
    const drawer = room.players.get(room.gameState.currentDrawer!);
    if (drawer) {
      drawer.score += BONUS_CONFIG.PERFECT_ROUND.drawerBonus;
      this.io.to(drawer.socketId).emit('bonus:awarded', {
        bonuses: [{
          type: BONUS_CONFIG.PERFECT_ROUND.label,
          amount: BONUS_CONFIG.PERFECT_ROUND.drawerBonus,
          badge: BONUS_CONFIG.PERFECT_ROUND.badge,
        }],
        totalBonus: BONUS_CONFIG.PERFECT_ROUND.drawerBonus,
        baseScore: 0,
        totalScore: BONUS_CONFIG.PERFECT_ROUND.drawerBonus,
      });
    }

    // Broadcast updated scores
    this.io.to(roomCode).emit('room:players:update', {
      players: Array.from(room.players.values()),
    });

    logger.info(`Perfect round bonus awarded in room ${roomCode}`);
  }

  // End current round
  endRound(roomCode: string) {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return;

    // Clear timers
    this.clearRoundTimers(roomCode);

    // Reset streaks for players who didn't guess (except drawer)
    // But check for streak shield powerup first
    room.players.forEach(player => {
      if (player.socketId !== room.gameState.currentDrawer && !player.guessedCorrectly) {
        // Check if player has streak shield active
        if (powerupService.hasActiveEffect(player, 'streak_shield')) {
          // Consume the shield but keep the streak
          powerupService.consumeEffect(player, 'streak_shield');
          logger.info(`Player ${player.name} used streak shield to protect ${player.currentStreak}x streak`);
        } else {
          // Reset streak
          player.currentStreak = 0;
        }
      }
    });

    // Reveal the word
    const word = room.gameState.currentWord || '';

    // Notify all players round ended
    this.io.to(roomCode).emit(GAME.ROUND_END, {
      word,
      scores: Array.from(room.players.values()).map(p => ({
        name: p.name,
        score: p.score,
      })),
    });

    logger.info(`Round ended in room ${roomCode}`);

    // Check if game should end
    if (room.gameState.round >= room.gameState.maxRounds) {
      this.endGame(roomCode);
    } else {
      // Start next round after a delay
      room.gameState.round++;
      setTimeout(() => {
        this.startRound(roomCode);
      }, 5000); // 5 second delay between rounds
    }
  }

  // End the game
  private endGame(roomCode: string) {
    const room = roomService.getRoom(roomCode);
    if (!room || !this.io) return;

    room.gameState.status = 'ended';

    // Get winner(s)
    const players = Array.from(room.players.values());
    const maxScore = Math.max(...players.map(p => p.score));
    const winners = players.filter(p => p.score === maxScore);

    // Notify all players game ended
    this.io.to(roomCode).emit(GAME.END, {
      winners: winners.map(w => w.name),
      finalScores: players.map(p => ({
        name: p.name,
        score: p.score,
      })).sort((a, b) => b.score - a.score),
    });

    logger.info(`Game ended in room ${roomCode}`);
  }

  // Clear all timers for a room
  private clearRoundTimers(roomCode: string) {
    // Clear round timer
    const roundTimer = this.roundTimers.get(roomCode + '_round');
    if (roundTimer) {
      clearTimeout(roundTimer);
      this.roundTimers.delete(roomCode + '_round');
    }

    // Clear choice timer
    const choiceTimer = this.roundTimers.get(roomCode + '_choice');
    if (choiceTimer) {
      clearTimeout(choiceTimer);
      this.roundTimers.delete(roomCode + '_choice');
    }

    // Clear hint timers
    const hintTimers = this.hintTimers.get(roomCode);
    if (hintTimers) {
      hintTimers.forEach(timer => clearTimeout(timer));
      this.hintTimers.delete(roomCode);
    }
  }

  // Clean up timers when room is destroyed
  cleanupRoom(roomCode: string) {
    this.clearRoundTimers(roomCode);
  }
}

export const gameService = new GameService();
