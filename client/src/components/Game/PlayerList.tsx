import React from 'react';
import type { Player } from '../../types';

interface PlayerListProps {
  players: Player[];
  currentUserId?: string;
  hostId?: string;
  currentDrawerId?: string;
}

const getRankEmoji = (rank: number) => {
  switch (rank) {
    case 1: return '🥇';
    case 2: return '🥈';
    case 3: return '🥉';
    default: return `#${rank}`;
  }
};

const getAvatarColor = (index: number) => {
  const colors = [
    'from-purple-400 to-purple-600',
    'from-blue-400 to-blue-600',
    'from-green-400 to-green-600',
    'from-yellow-400 to-yellow-600',
    'from-red-400 to-red-600',
    'from-pink-400 to-pink-600',
  ];
  return colors[index % colors.length];
};

export const PlayerList: React.FC<PlayerListProps> = ({ players, currentUserId, hostId, currentDrawerId }) => {
  // Sort players by score for ranking
  const sortedPlayers = [...players].sort((a, b) => b.score - a.score);
  const maxScore = Math.max(...players.map(p => p.score), 1);

  return (
    <div className="bg-gradient-to-br from-white to-gray-50 rounded-xl shadow-lg p-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-2 pb-2 border-b-2 border-gray-200">
        <h3 className="text-base font-bold bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
          Leaderboard
        </h3>
        <span className="text-xs font-semibold bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
          {players.length}/6
        </span>
      </div>

      {/* Players */}
      <div className="space-y-2">
        {sortedPlayers.map((player, index) => {
          const rank = index + 1;
          const isCurrentUser = player.socketId === currentUserId;
          const isDrawing = player.socketId === currentDrawerId;
          const scorePercentage = (player.score / maxScore) * 100;

          return (
            <div
              key={player.socketId}
              className={`relative overflow-hidden rounded-lg transition-all duration-300 ${
                isCurrentUser
                  ? 'ring-2 ring-primary-500 shadow-lg'
                  : 'shadow-sm hover:shadow-md'
              } ${isDrawing ? 'ring-2 ring-purple-400 animate-pulse' : ''}`}
            >
              {/* Background gradient based on score */}
              <div
                className="absolute inset-0 bg-gradient-to-r from-primary-50 to-purple-50 opacity-40"
                style={{ width: `${Math.max(scorePercentage, 10)}%` }}
              />

              {/* Content */}
              <div className="relative p-2">
                <div className="flex items-center gap-2">
                  {/* Rank */}
                  <div className="flex-shrink-0 w-6 text-center">
                    <span className="text-lg font-bold">
                      {getRankEmoji(rank)}
                    </span>
                  </div>

                  {/* Avatar */}
                  <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${getAvatarColor(index)} flex items-center justify-center text-white font-bold text-sm shadow-sm`}>
                    {player.name.charAt(0).toUpperCase()}
                  </div>

                  {/* Player Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="font-bold text-sm text-gray-800 truncate">
                        {player.name}
                      </span>

                      {isDrawing && (
                        <span className="text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                          🎨
                        </span>
                      )}

                      {player.socketId === hostId && (
                        <span className="text-xs bg-yellow-400 text-yellow-900 px-1.5 py-0.5 rounded-full font-semibold">
                          👑
                        </span>
                      )}

                      {isCurrentUser && (
                        <span className="text-xs bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-semibold">
                          You
                        </span>
                      )}

                      {player.currentStreak >= 2 && (
                        <span className="text-xs bg-gradient-to-r from-orange-500 to-red-500 text-white px-1.5 py-0.5 rounded-full font-semibold animate-pulse">
                          🔥 {player.currentStreak}x
                        </span>
                      )}
                    </div>

                    {/* Score Display */}
                    <div className="flex items-center gap-1">
                      <span className="text-lg font-bold text-primary-600">
                        {player.score}
                      </span>
                      <span className="text-xs text-gray-500">pts</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {players.length < 2 && (
        <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg text-center">
          <p className="text-xs text-yellow-800 font-medium">
            ⏳ Waiting for more players...
          </p>
        </div>
      )}
    </div>
  );
};
