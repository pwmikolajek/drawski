import React from 'react';
import { POWERUP_CONFIG } from '../../../../shared/constants';
import type { PowerupInventory } from '../../types';

interface PowerupShopProps {
  playerScore: number;
  playerPowerups: PowerupInventory;
  onPurchase: (powerupId: string) => void;
  onClose: () => void;
}

export const PowerupShop: React.FC<PowerupShopProps> = ({
  playerScore,
  playerPowerups,
  onPurchase,
  onClose,
}) => {
  const powerups = Object.values(POWERUP_CONFIG);

  const canAfford = (cost: number) => playerScore >= cost;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[80vh] overflow-hidden">
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
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-140px)]">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {powerups.map((powerup) => {
              const owned = playerPowerups[powerup.id] || 0;
              const affordable = canAfford(powerup.cost);

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

                  {/* Content */}
                  <div className="pr-12">
                    <h3 className="font-bold text-lg text-gray-800 mb-1">{powerup.name}</h3>
                    <p className="text-sm text-gray-600 mb-3">{powerup.description}</p>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-purple-600 text-xl">{powerup.cost}</span>
                        <span className="text-gray-500 text-sm">pts</span>
                      </div>

                      {owned > 0 && (
                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">
                          Owned: {owned}
                        </div>
                      )}
                    </div>

                    {/* Purchase Button */}
                    <button
                      onClick={() => onPurchase(powerup.id)}
                      disabled={!affordable}
                      className={`w-full mt-3 py-2 rounded-lg font-semibold transition-colors ${
                        affordable
                          ? 'bg-purple-600 hover:bg-purple-700 text-white'
                          : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      }`}
                    >
                      {affordable ? 'Purchase' : 'Not Enough Points'}
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
            💡 <strong>Tip:</strong> Earn points by guessing correctly and use them to buy powerups!
          </p>
        </div>
      </div>
    </div>
  );
};
