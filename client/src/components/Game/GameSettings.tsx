import React, { useState } from 'react';

interface GameConfig {
  rounds: number;
  roundDuration: number;
}

interface GameSettingsProps {
  onStartGame: (config: GameConfig) => void;
  onCancel: () => void;
}

export const GameSettings: React.FC<GameSettingsProps> = ({ onStartGame, onCancel }) => {
  const [rounds, setRounds] = useState(3);
  const [roundDuration, setRoundDuration] = useState(80000);

  const handleStartGame = () => {
    onStartGame({ rounds, roundDuration });
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6">Game Settings</h2>

        <div className="space-y-4">
          {/* Number of Rounds */}
          <div>
            <label htmlFor="rounds" className="block text-sm font-medium text-gray-700 mb-2">
              Number of Rounds
            </label>
            <select
              id="rounds"
              value={rounds}
              onChange={(e) => setRounds(Number(e.target.value))}
              className="input-field w-full"
            >
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                <option key={num} value={num}>
                  {num} {num === 1 ? 'round' : 'rounds'} {num === 3 && '(default)'}
                </option>
              ))}
            </select>
          </div>

          {/* Round Duration */}
          <div>
            <label htmlFor="duration" className="block text-sm font-medium text-gray-700 mb-2">
              Round Duration
            </label>
            <select
              id="duration"
              value={roundDuration}
              onChange={(e) => setRoundDuration(Number(e.target.value))}
              className="input-field w-full"
            >
              <option value={30000}>30 seconds - Quick</option>
              <option value={60000}>60 seconds - Standard</option>
              <option value={80000}>80 seconds - Extended (default)</option>
              <option value={120000}>120 seconds - Long</option>
            </select>
          </div>
        </div>

        {/* Buttons */}
        <div className="flex gap-3 mt-6">
          <button
            onClick={onCancel}
            className="btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            onClick={handleStartGame}
            className="btn-primary flex-1"
          >
            Start Game
          </button>
        </div>
      </div>
    </div>
  );
};
