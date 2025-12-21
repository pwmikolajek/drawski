import React, { useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import type { Player, GameState, WordWithDifficulty, WordDifficulty, PowerupInventory, ActiveEffect } from '../../types';
import { PlayerList } from './PlayerList';
import { DrawingCanvas } from '../Canvas/DrawingCanvas';
import { WordSelection } from './WordSelection';
import { WordDisplay } from './WordDisplay';
import { Timer } from './Timer';
import { Chat } from './Chat';
import { BonusNotification } from './BonusNotification';
import { PowerupShop } from './PowerupShop';
import { PowerupBar } from './PowerupBar';
import { GameSettings } from './GameSettings';
import toast from 'react-hot-toast';

interface GameRoomProps {
  roomCode: string;
  isHost: boolean;
  onLeaveRoom: () => void;
  initialPlayers?: Player[];
  initialGameState?: GameState | null;
}

interface GameConfig {
  rounds: number;
  roundDuration: number;
}

export const GameRoom: React.FC<GameRoomProps> = ({
  roomCode,
  isHost,
  onLeaveRoom,
  initialPlayers = [],
  initialGameState = null
}) => {
  const { socket } = useSocket();
  const [players, setPlayers] = useState<Player[]>(initialPlayers);
  const [gameState, setGameState] = useState<GameState | null>(initialGameState);
  const [hostId, setHostId] = useState<string | null>(
    initialPlayers.length > 0 ? initialPlayers[0].socketId : null
  );

  // Game-specific state
  const [wordOptions, setWordOptions] = useState<WordWithDifficulty[]>([]);
  const [displayWord, setDisplayWord] = useState<string | null>(null);
  const [currentWord, setCurrentWord] = useState<string | null>(null);
  const [currentWordDifficulty, setCurrentWordDifficulty] = useState<WordDifficulty | null>(null);
  const [isDrawer, setIsDrawer] = useState(false);
  const [drawerName, setDrawerName] = useState<string | null>(null);
  const [roundInfo, setRoundInfo] = useState<{ round: number; maxRounds: number } | null>(null);

  // Bonus notification state
  const [bonusData, setBonusData] = useState<{
    bonuses: Array<{ type: string; amount: number; badge: string }>;
    totalBonus: number;
    baseScore: number;
    totalScore: number;
  } | null>(null);

  // Powerup state
  const [showShop, setShowShop] = useState(false);

  // Game settings state
  const [showGameSettings, setShowGameSettings] = useState(false);

  // Get current player's powerups and active effects
  const currentPlayer = players.find(p => p.socketId === socket?.id);
  const playerPowerups: PowerupInventory = currentPlayer?.powerups || {};
  const activeEffects: ActiveEffect[] = currentPlayer?.activeEffects || [];
  const playerCooldowns = currentPlayer?.cooldowns || {};
  const playerScore = currentPlayer?.score || 0;

  useEffect(() => {
    if (!socket) return;

    // Listen for player updates
    socket.on('room:players:update', ({ players: updatedPlayers, newHost }) => {
      setPlayers(updatedPlayers);
      if (newHost) {
        setHostId(newHost);
      }
    });

    // Listen for round start (drawer)
    socket.on('round:start:drawer', ({ wordOptions: options, round, maxRounds }) => {
      setWordOptions(options);
      setIsDrawer(true);
      setRoundInfo({ round, maxRounds });
      setCurrentWord(null); // Clear previous round's word
      setDisplayWord(null); // Clear previous round's display word
      setCurrentWordDifficulty(null); // Clear previous round's difficulty
      setGameState({
        status: 'choosing',
        currentDrawer: socket.id || '',
        currentWord: null,
        displayWord: null,
        currentWordDifficulty: null,
        round,
        maxRounds,
        roundStartTime: null,
        roundDuration: 80000,
        wordOptions: options,
      });
      toast("You're the drawer! Choose a word", { icon: '🎨' });
    });

    // Listen for round start (guesser)
    socket.on('round:start:guesser', ({ drawerName: drawer, round, maxRounds }) => {
      setIsDrawer(false);
      setDrawerName(drawer);
      setRoundInfo({ round, maxRounds });
      setCurrentWord(null); // Clear previous round's word
      setDisplayWord(null); // Clear previous round's display word
      setCurrentWordDifficulty(null); // Clear previous round's difficulty
      setGameState({
        status: 'choosing',
        currentDrawer: '',
        currentWord: null,
        displayWord: null,
        currentWordDifficulty: null,
        round,
        maxRounds,
        roundStartTime: null,
        roundDuration: 80000,
        wordOptions: null,
      });
      toast(`${drawer} is choosing a word...`, { icon: '⏳' });
    });

    // Listen for word selected
    socket.on('word:selected', ({ displayWord: word, actualWord, difficulty }) => {
      setDisplayWord(word);
      setWordOptions([]);
      setCurrentWordDifficulty(difficulty);
      // If we received the actual word, we are the drawer
      if (actualWord) {
        setCurrentWord(actualWord);
        setIsDrawer(true);
      }
      setGameState(prev => prev ? {
        ...prev,
        status: 'drawing',
        roundStartTime: Date.now(),
        currentWordDifficulty: difficulty
      } : null);
      toast(isDrawer ? 'Start drawing!' : 'Word selected! Start guessing!', { icon: '✏️' });
    });

    // Listen for hints
    socket.on('hint:revealed', ({ displayWord: word }) => {
      setDisplayWord(word);
      toast('Hint revealed!', { icon: '💡' });
    });

    // Listen for round end
    socket.on('round:end', ({ word, scores }) => {
      setCurrentWord(word);
      setDisplayWord(null);
      toast.success(`Round over! The word was: ${word}`);

      // Update player scores
      setPlayers(prevPlayers =>
        prevPlayers.map(player => {
          const scoreData = scores.find((s: any) => s.name === player.name);
          return scoreData ? { ...player, score: scoreData.score } : player;
        })
      );
    });

    // Listen for game end
    socket.on('game:end', ({ winners, finalScores }) => {
      setGameState(prev => prev ? { ...prev, status: 'ended' } : null);
      toast.success(`Game Over! Winner(s): ${winners.join(', ')}`);

      // Update final scores
      setPlayers(prevPlayers =>
        prevPlayers.map(player => {
          const scoreData = finalScores.find((s: any) => s.name === player.name);
          return scoreData ? { ...player, score: scoreData.score } : player;
        })
      );
    });

    // Listen for game restart
    socket.on('game:restarted', ({ players: updatedPlayers, gameState: newGameState }) => {
      setPlayers(updatedPlayers);
      setGameState(newGameState);
      setCurrentWord(null);
      setDisplayWord(null);
      setCurrentWordDifficulty(null);
      setWordOptions([]);
      setBonusData(null);
      toast.success('Game restarted! Get ready for a new game.', { icon: '🔄' });
    });

    // Listen for bonus awarded
    socket.on('bonus:awarded', (data) => {
      setBonusData(data);
    });

    // Listen for powerup events
    socket.on('powerup:purchased', ({ powerups, score }) => {
      setPlayers(prevPlayers =>
        prevPlayers.map(p =>
          p.socketId === socket.id ? { ...p, powerups, score } : p
        )
      );
      toast.success('Powerup purchased!', { icon: '🛒' });
    });

    socket.on('powerup:activated', ({ powerups, activeEffects: effects }) => {
      setPlayers(prevPlayers =>
        prevPlayers.map(p =>
          p.socketId === socket.id ? { ...p, powerups, activeEffects: effects } : p
        )
      );
      toast.success('Powerup activated!', { icon: '⚡' });
    });

    socket.on('powerup:awarded', ({ powerupName }) => {
      toast.success(`You earned a free powerup: ${powerupName}!`, { icon: '🎁', duration: 4000 });
    });

    socket.on('powerup:effect', ({ type, message }) => {
      if (type === 'extra_time') {
        toast.success(message, { icon: '⏰', duration: 3000 });
      } else {
        toast.success(message, { icon: '💡', duration: 3000 });
      }
    });

    socket.on('powerup:error', ({ message }) => {
      toast.error(message);
    });

    // Listen for room errors
    socket.on('room:error', ({ message }) => {
      toast.error(message);
    });

    return () => {
      socket.off('room:players:update');
      socket.off('round:start:drawer');
      socket.off('round:start:guesser');
      socket.off('word:selected');
      socket.off('hint:revealed');
      socket.off('round:end');
      socket.off('game:end');
      socket.off('game:restarted');
      socket.off('bonus:awarded');
      socket.off('powerup:purchased');
      socket.off('powerup:activated');
      socket.off('powerup:awarded');
      socket.off('powerup:effect');
      socket.off('powerup:error');
      socket.off('room:error');
    };
  }, [socket, isDrawer]);

  const handleLeaveRoom = () => {
    if (socket) {
      socket.emit('room:leave');
    }
    onLeaveRoom();
  };

  const handleStartGame = (config: GameConfig) => {
    if (socket) {
      socket.emit('game:start', config);
    }
    setShowGameSettings(false);
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(roomCode);
    toast.success('Room code copied!');
  };

  const handlePurchasePowerup = (powerupId: string, targetSocketId?: string) => {
    if (socket) {
      socket.emit('powerup:purchase', { powerupId, targetSocketId });
    }
  };

  const handleActivatePowerup = (powerupId: string, targetSocketId?: string) => {
    if (socket) {
      socket.emit('powerup:activate', { powerupId, targetSocketId });
    }
  };

  const handleRestartGame = () => {
    if (socket) {
      socket.emit('game:restart');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 p-3">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/drawski-logo.png"
                alt="Drawski"
                className="h-6 w-auto"
              />
              <div>
                <p className="text-gray-600">
                  Room Code:{' '}
                  <button
                    onClick={copyRoomCode}
                    className="font-mono text-2xl font-bold text-primary-600 hover:text-primary-700 ml-2"
                  >
                    {roomCode}
                  </button>
                  <span className="text-sm text-gray-500 ml-2">(click to copy)</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Powerup Shop Button */}
              {gameState && gameState.status !== 'waiting' && gameState.status !== 'ended' && (
                <button
                  onClick={() => setShowShop(true)}
                  className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-4 py-2 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center gap-2 h-[42px]"
                >
                  <span className="text-xl">🛒</span>
                  <span>Powerup Shop</span>
                  <span className="bg-white/20 px-2 py-0.5 rounded-full text-sm">{playerScore} pts</span>
                </button>
              )}

              <button
                onClick={handleLeaveRoom}
                className="btn-secondary h-[42px] flex items-center"
              >
                Leave Room
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-3">
          {/* Left Sidebar - Leaderboard + Chat */}
          <div className="lg:col-span-1 flex flex-col gap-4 h-[calc(100vh-200px)]">
            {/* Leaderboard */}
            <div className="flex-shrink-0">
              <PlayerList
                players={players}
                currentUserId={socket?.id}
                hostId={hostId || undefined}
                currentDrawerId={gameState?.currentDrawer || undefined}
              />

              {/* Start Game Button (Host Only) */}
              {isHost && (!gameState || gameState?.status === 'waiting') && (
                <button
                  onClick={() => setShowGameSettings(true)}
                  className="btn-primary w-full mt-4"
                >
                  Start Game
                </button>
              )}
            </div>

            {/* Chat */}
            {gameState && gameState.status !== 'waiting' && gameState.status !== 'ended' && (
              <div className="flex-1 min-h-0">
                <Chat isDrawer={isDrawer} />
              </div>
            )}
          </div>

          {/* Main Game Area - Full Width */}
          <div className="lg:col-span-3">
            <div className="card p-4">
              {!gameState || gameState?.status === 'waiting' ? (
                <div className="min-h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🎨</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      Waiting for game to start...
                    </h2>
                    <p className="text-gray-600">
                      {isHost
                        ? 'Click "Start Game" when ready (minimum 2 players)'
                        : 'Waiting for host to start the game'}
                    </p>
                  </div>
                </div>
              ) : gameState?.status === 'choosing' && isDrawer ? (
                <div className="min-h-[500px] flex items-center justify-center">
                  <WordSelection
                    wordOptions={wordOptions}
                    onSelectWord={(word) => {
                      setCurrentWord(word);
                      socket?.emit('word:select', { word });
                    }}
                  />
                </div>
              ) : gameState?.status === 'choosing' && !isDrawer ? (
                <div className="min-h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">⏳</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">
                      {drawerName} is choosing a word...
                    </h2>
                    <p className="text-gray-600">Get ready to guess!</p>
                  </div>
                </div>
              ) : gameState?.status === 'drawing' ? (
                <div className="space-y-3">
                  {/* Game Status Bar */}
                  <div className="bg-gradient-to-r from-primary-50 to-primary-100 p-3 rounded-lg shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      {/* Round Info with Multiplier */}
                      <div className="flex-shrink-0">
                        <div className="text-base font-bold text-gray-800 whitespace-nowrap">
                          Round {roundInfo?.round} / {roundInfo?.maxRounds}
                        </div>
                        {currentWordDifficulty && (
                          <div className={`mt-1.5 inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold ${
                            currentWordDifficulty === 'easy'
                              ? 'bg-green-50 text-green-700 shadow-sm shadow-green-200 animate-pulse-soft' :
                            currentWordDifficulty === 'medium'
                              ? 'bg-yellow-50 text-yellow-700 shadow-sm shadow-yellow-200 animate-pulse-soft' :
                              'bg-red-50 text-red-700 shadow-sm shadow-red-200 animate-pulse-soft'
                          }`}>
                            <span className="mr-1">
                              {currentWordDifficulty === 'easy' ? '🟢' :
                               currentWordDifficulty === 'medium' ? '🟡' :
                               '🔴'}
                            </span>
                            {currentWordDifficulty === 'easy' ? '1.0x' :
                             currentWordDifficulty === 'medium' ? '1.5x' :
                             '2.0x'} Points
                          </div>
                        )}
                      </div>

                      {/* Word Display */}
                      <div className="flex-1 flex items-center justify-center min-w-0">
                        {isDrawer ? (
                          currentWord ? (
                            <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-lg font-bold text-lg shadow-sm">
                              Your word: <span className="text-yellow-900">{currentWord}</span>
                            </div>
                          ) : (
                            <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-lg font-bold text-lg shadow-sm">
                              🎨 You are the drawer!
                            </div>
                          )
                        ) : displayWord ? (
                          <WordDisplay word={displayWord} />
                        ) : null}
                      </div>

                      {/* Timer */}
                      {gameState.roundStartTime && (
                        <div className="flex-shrink-0">
                          <Timer
                            startTime={gameState.roundStartTime}
                            duration={80000}
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Drawing Canvas */}
                  <div className="bg-white rounded-lg shadow-md p-3">
                    <div className="flex justify-center">
                      <div className="border-2 border-gray-200 rounded-lg overflow-hidden max-w-full shadow-lg">
                        <DrawingCanvas
                          isDrawer={isDrawer}
                          width={800}
                          height={533}
                        />
                      </div>
                    </div>
                    {!isDrawer && (
                      <div className="text-center text-sm text-gray-600 mt-2">
                        💬 Type your guess in the chat on the right!
                      </div>
                    )}
                  </div>
                </div>
              ) : gameState?.status === 'ended' ? (
                <div className="min-h-[500px] flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl mb-4">🏆</div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">
                      Game Over!
                    </h2>
                    <div className="bg-gray-50 rounded-lg p-6 max-w-lg mx-auto">
                      <h3 className="font-semibold text-lg mb-3">Final Scores:</h3>
                      <div className="space-y-2 mb-6">
                        {players
                          .sort((a, b) => b.score - a.score)
                          .map((player, index) => (
                            <div
                              key={player.socketId}
                              className={`flex justify-between items-center p-3 rounded gap-4 ${
                                index === 0 ? 'bg-yellow-100 font-bold' : 'bg-white'
                              }`}
                            >
                              <span className="truncate">
                                {index === 0 && '👑 '}
                                {player.name}
                              </span>
                              <span className="whitespace-nowrap font-semibold">{player.score} pts</span>
                            </div>
                          ))}
                      </div>

                      {/* Play Again Button (Host Only) */}
                      {isHost && (
                        <button
                          onClick={handleRestartGame}
                          className="btn-primary w-full"
                        >
                          🔄 Play Again
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          </div>
        </div>

        {/* Bonus Notification */}
        {bonusData && (
          <BonusNotification
            bonuses={bonusData.bonuses}
            totalBonus={bonusData.totalBonus}
            baseScore={bonusData.baseScore}
            totalScore={bonusData.totalScore}
            onComplete={() => setBonusData(null)}
          />
        )}

        {/* Powerup Shop Modal */}
        {showShop && socket && (
          <PowerupShop
            playerScore={playerScore}
            playerPowerups={playerPowerups}
            players={players}
            currentSocketId={socket.id || ''}
            onPurchase={handlePurchasePowerup}
            onClose={() => setShowShop(false)}
          />
        )}

        {/* Powerup Bar */}
        {gameState && gameState.status === 'drawing' && (
          <PowerupBar
            playerPowerups={playerPowerups}
            activeEffects={activeEffects}
            cooldowns={playerCooldowns}
            onActivate={handleActivatePowerup}
            isDrawer={isDrawer}
          />
        )}

        {/* Game Settings Modal */}
        {showGameSettings && (
          <GameSettings
            onStartGame={handleStartGame}
            onCancel={() => setShowGameSettings(false)}
          />
        )}
      </div>
    </div>
  );
};
