import React, { useState, useEffect } from 'react';
import { POWERUP_CONFIG } from '../../../../shared/constants';
import type { PowerupInventory, ActiveEffect, PlayerCooldowns } from '../../types';

interface PowerupBarProps {
  playerPowerups: PowerupInventory;
  activeEffects: ActiveEffect[];
  cooldowns: PlayerCooldowns;
  onActivate: (powerupId: string) => void;
  isDrawer: boolean;
}

export const PowerupBar: React.FC<PowerupBarProps> = ({
  playerPowerups,
  activeEffects,
  cooldowns,
  onActivate,
  isDrawer,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [now, setNow] = useState(Date.now());

  // Update current time every second for cooldown display
  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Calculate remaining cooldown time
  const getCooldownRemaining = (powerupId: string): number => {
    const cooldown = cooldowns[powerupId];
    if (!cooldown) return 0;

    const remaining = Math.max(0, cooldown.canUseAgainAt - now);
    return Math.ceil(remaining / 1000); // Convert to seconds
  };

  // Check if powerup is on cooldown
  const isOnCooldown = (powerupId: string): boolean => {
    return getCooldownRemaining(powerupId) > 0;
  };

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
        className="bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-custom-radius w-14 h-14 flex items-center justify-center shadow-custom-shadow hover:scale-110 transition-transform mb-3 relative"
      >
        <span className="text-2xl">{expanded ? '✕' : '⚡'}</span>
        {availablePowerups.length > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {availablePowerups.length}
          </span>
        )}
      </button>

      {/* Powerup Panel */}
      {expanded && (
        <div className="bg-white rounded-custom-radius shadow-custom-shadow p-4 w-72 max-h-96 overflow-y-auto">
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

                const remaining = effect.expiresAt ? Math.max(0, Math.ceil((effect.expiresAt - now) / 1000)) : null;

                return (
                  <div
                    key={index}
                    className="bg-green-50 border border-green-200 rounded-custom-radius p-2 mb-2"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{powerup.badge}</span>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-green-800">{powerup.name}</p>
                        {remaining !== null && remaining > 0 ? (
                          <p className="text-xs text-green-600">{remaining}s remaining</p>
                        ) : (
                          <p className="text-xs text-green-600">Active!</p>
                        )}
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
                const cooldownSeconds = getCooldownRemaining(powerupId);
                const onCooldown = isOnCooldown(powerupId);

                return (
                  <div
                    key={powerupId}
                    className={`border-2 rounded-custom-radius p-3 transition-colors ${
                      onCooldown || isActive
                        ? 'border-gray-200 opacity-60'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
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
                        <p className="text-xs text-gray-600 line-clamp-2">{powerup.description}</p>
                        {onCooldown && (
                          <p className="text-xs text-orange-600 font-semibold mt-1">
                            ⏱️ {cooldownSeconds}s cooldown
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={() => onActivate(powerupId)}
                      disabled={isActive || onCooldown}
                      className={`w-full py-1.5 rounded-custom-radius text-sm font-semibold transition-colors ${
                        isActive || onCooldown
                          ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                          : 'bg-purple-600 hover:bg-purple-700 text-white'
                      }`}
                    >
                      {isActive ? 'Already Active' : onCooldown ? `Cooldown: ${cooldownSeconds}s` : 'Activate'}
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
