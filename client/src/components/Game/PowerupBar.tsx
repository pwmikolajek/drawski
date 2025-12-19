import React, { useState } from 'react';
import { POWERUP_CONFIG } from '../../../../shared/constants';
import type { PowerupInventory, ActiveEffect } from '../../types';

interface PowerupBarProps {
  playerPowerups: PowerupInventory;
  activeEffects: ActiveEffect[];
  onActivate: (powerupId: string) => void;
  isDrawer: boolean;
}

export const PowerupBar: React.FC<PowerupBarProps> = ({
  playerPowerups,
  activeEffects,
  onActivate,
  isDrawer,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Filter powerups based on whether player is drawer or guesser
  const availablePowerups = Object.entries(playerPowerups)
    .filter(([powerupId, count]) => {
      const powerup = Object.values(POWERUP_CONFIG).find(p => p.id === powerupId);
      if (!powerup || count <= 0) return false;

      // Check if powerup can be used by current role
      if (powerup.usableBy === 'drawer' && !isDrawer) return false;
      if (powerup.usableBy === 'guesser' && isDrawer) return false;

      return true;
    });

  if (availablePowerups.length === 0 && activeEffects.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-24 right-8 z-40">
      {/* Toggle Button */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full w-14 h-14 flex items-center justify-center shadow-lg hover:scale-110 transition-transform mb-3"
      >
        <span className="text-2xl">{expanded ? '✕' : '⚡'}</span>
      </button>

      {/* Powerup Panel */}
      {expanded && (
        <div className="bg-white rounded-xl shadow-2xl p-4 w-64 max-h-96 overflow-y-auto">
          <h3 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
            <span>⚡</span>
            <span>Your Powerups</span>
          </h3>

          {/* Active Effects */}
          {activeEffects.length > 0 && (
            <div className="mb-4">
              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Active Effects</p>
              {activeEffects.map((effect, index) => {
                const powerup = Object.values(POWERUP_CONFIG).find(p => p.id === effect.type);
                if (!powerup) return null;

                return (
                  <div
                    key={index}
                    className="bg-green-50 border border-green-200 rounded-lg p-2 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{powerup.badge}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-800">{powerup.name}</p>
                        <p className="text-xs text-green-600">Active!</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Owned Powerups */}
          {availablePowerups.length > 0 ? (
            <div className="space-y-2">
              {availablePowerups.map(([powerupId, count]) => {
                const powerup = Object.values(POWERUP_CONFIG).find(p => p.id === powerupId);
                if (!powerup) return null;

                const isActive = activeEffects.some(e => e.type === powerupId);

                return (
                  <div
                    key={powerupId}
                    className="border-2 border-gray-200 rounded-lg p-3 hover:border-purple-300 transition-colors"
                  >
                    <div className="flex items-start gap-2 mb-2">
                      <span className="text-2xl">{powerup.badge}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-semibold text-sm text-gray-800">{powerup.name}</p>
                          <span className="bg-purple-100 text-purple-800 px-2 py-0.5 rounded-full text-xs font-bold">
                            ×{count}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600">{powerup.description}</p>
                      </div>
                    </div>

                    <button
                      onClick={() => onActivate(powerupId)}
                      disabled={isActive}
                      className={`w-full py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                        isActive
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {isActive ? 'Already Active' : 'Activate'}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-gray-500 text-center py-4">
              No powerups available right now
            </p>
          )}
        </div>
      )}
    </div>
  );
};
