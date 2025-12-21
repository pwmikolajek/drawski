import React, { useState, useEffect } from 'react';
import { POWERUP_CONFIG } from '../../../../shared/constants';
import type { PowerupInventory, Player } from '../../types';
import { useSocket } from '../../contexts/SocketContext';

interface PowerupShopProps {
  playerScore: number;
  playerPowerups: PowerupInventory;
  players: Player[];
  currentSocketId: string;
  onPurchase: (powerupId: string, targetSocketId?: string) => void;
  onClose: () => void;
}

export const PowerupShop: React.FC<PowerupShopProps> = ({
  playerScore,
  playerPowerups,
  players,
  currentSocketId,
  onPurchase,
  onClose,
}) => {
  const socket = useSocket();
  const powerups = Object.values(POWERUP_CONFIG);

  // State for dynamic pricing
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [selectedPowerup, setSelectedPowerup] = useState<string | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  // Request dynamic prices on mount
  useEffect(() => {
    if (!socket) return;

    // Request prices for all powerups
    powerups.forEach(powerup => {
      socket.emit('powerup:get_price', { powerupId: powerup.id });
    });

    // Listen for price updates
    const handlePriceUpdate = (data: { powerupId: string; price: number }) => {
      setPrices(prev => ({ ...prev, [data.powerupId]: data.price }));
    };

    socket.on('powerup:price_update', handlePriceUpdate);

    return () => {
      socket.off('powerup:price_update', handlePriceUpdate);
    };
  }, [socket]);

  const canAfford = (powerupId: string) => {
    const price = prices[powerupId] ?? POWERUP_CONFIG[powerupId.toUpperCase() as keyof typeof POWERUP_CONFIG]?.basePrice ?? 0;
    return playerScore >= price;
  };

  const handlePurchaseClick = (powerupId: string) => {
    const powerup = powerups.find(p => p.id === powerupId);
    if (!powerup) return;

    // Check if powerup requires target
    if (powerup.requiresTarget) {
      setSelectedPowerup(powerupId);
    } else {
      onPurchase(powerupId);
    }
  };

  const handleTargetSelect = (targetSocketId: string) => {
    if (selectedPowerup) {
      onPurchase(selectedPowerup, targetSocketId);
      setSelectedPowerup(null);
      setSelectedTarget(null);
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'hint':
      case 'tactical':
        return 'bg-blue-100 text-blue-800';
      case 'self_help':
        return 'bg-green-100 text-green-800';
      case 'competitive':
        return 'bg-red-100 text-red-800';
      case 'drawing':
        return 'bg-purple-100 text-purple-800';
      case 'defensive':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-3xl font-bold mb-2">🛒 Powerup Shop</h2>
                <p className="text-purple-100">Your Score: <span className="font-bold text-2xl">{playerScore}</span> pts</p>
              </div>
              <button
                onClick={onClose}
                className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
              >
                <span className="text-2xl">✕</span>
              </button>
            </div>
          </div>

          {/* Powerups Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-180px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {powerups.map((powerup) => {
                const owned = playerPowerups[powerup.id] || 0;
                const price = prices[powerup.id] ?? powerup.basePrice;
                const affordable = canAfford(powerup.id);
                const priceLoaded = prices[powerup.id] !== undefined;

                return (
                  <div
                    key={powerup.id}
                    className={`relative border-2 rounded-xl p-4 transition-all ${
                      affordable
                        ? 'border-purple-300 hover:border-purple-500 hover:shadow-lg'
                        : 'border-gray-200 opacity-60'
                    }`}
                  >
                    {/* Badge */}
                    <div className="absolute top-3 right-3 text-4xl">{powerup.badge}</div>

                    {/* Type indicator */}
                    <div className="mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full ${getTypeColor(powerup.type)}`}>
                        {powerup.type.replace('_', ' ')}
                      </span>
                      {powerup.requiresTarget && (
                        <span className="ml-1 text-xs px-2 py-1 rounded-full bg-orange-100 text-orange-800">
                          Requires Target
                        </span>
                      )}
                    </div>

                    {/* Content */}
                    <div className="pr-12">
                      <h3 className="font-bold text-lg text-gray-800 mb-1">{powerup.name}</h3>
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{powerup.description}</p>

                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {priceLoaded ? (
                            <>
                              <span className="font-bold text-purple-600 text-xl">{price}</span>
                              {price !== powerup.basePrice && (
                                <span className="text-xs text-gray-400 line-through">{powerup.basePrice}</span>
                              )}
                            </>
                          ) : (
                            <span className="text-gray-400 text-sm">Loading...</span>
                          )}
                          <span className="text-gray-500 text-sm">pts</span>
                        </div>

                        {owned > 0 && (
                          <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                            x{owned}
                          </div>
                        )}
                      </div>

                      {/* Purchase Button */}
                      <button
                        onClick={() => handlePurchaseClick(powerup.id)}
                        disabled={!affordable || !priceLoaded}
                        className={`w-full py-2 rounded-lg font-semibold transition-colors text-sm ${
                          affordable && priceLoaded
                            ? 'bg-purple-600 hover:bg-purple-700 text-white'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        }`}
                      >
                        {!priceLoaded ? 'Loading...' : affordable ? (powerup.requiresTarget ? 'Select Target' : 'Purchase') : 'Not Enough Points'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-50 p-4 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              💡 <strong>Tip:</strong> Prices change dynamically based on your position and round time!
            </p>
          </div>
        </div>
      </div>

      {/* Target Selection Modal */}
      {selectedPowerup && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h3 className="text-2xl font-bold mb-4">Select Target</h3>
            <p className="text-gray-600 mb-4">Choose which player to target with this powerup:</p>

            <div className="space-y-2 max-h-64 overflow-y-auto mb-4">
              {players
                .filter(p => p.socketId !== currentSocketId && p.isConnected)
                .map(player => (
                  <button
                    key={player.socketId}
                    onClick={() => handleTargetSelect(player.socketId)}
                    onMouseEnter={() => setSelectedTarget(player.socketId)}
                    onMouseLeave={() => setSelectedTarget(null)}
                    className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                      selectedTarget === player.socketId
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden shadow-sm ring-2 ring-white">
                          <img
                            src={`/avatars/avatar-${player.avatar || 1}.jpg`}
                            alt={player.name}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <span className="font-semibold">{player.name}</span>
                      </div>
                      <span className="text-purple-600 font-bold">{player.score} pts</span>
                    </div>
                  </button>
                ))}
            </div>

            <button
              onClick={() => {
                setSelectedPowerup(null);
                setSelectedTarget(null);
              }}
              className="w-full py-2 rounded-lg border-2 border-gray-300 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
};
