import React from 'react';
import type { WordWithDifficulty } from '../../types';

interface WordSelectionProps {
  wordOptions: WordWithDifficulty[];
  onSelectWord: (word: string) => void;
}

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return 'from-green-500 to-green-600 hover:from-green-600 hover:to-green-700';
    case 'medium':
      return 'from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700';
    case 'hard':
      return 'from-red-500 to-red-600 hover:from-red-600 hover:to-red-700';
    default:
      return 'from-primary-500 to-primary-600 hover:from-primary-600 hover:to-primary-700';
  }
};

const getDifficultyBadge = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return '🟢';
    case 'medium':
      return '🟡';
    case 'hard':
      return '🔴';
    default:
      return '⚪';
  }
};

const getDifficultyMultiplier = (difficulty: string) => {
  switch (difficulty) {
    case 'easy':
      return '1.0x';
    case 'medium':
      return '1.5x';
    case 'hard':
      return '2.0x';
    default:
      return '1.0x';
  }
};

export const WordSelection: React.FC<WordSelectionProps> = ({ wordOptions, onSelectWord }) => {
  return (
    <div className="card max-w-3xl w-full text-center p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-2">
          🎨 You're Drawing!
        </h2>
        <p className="text-lg text-gray-600">
          Choose your word wisely - harder words give more points!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {wordOptions.map((wordObj, index) => (
          <button
            key={index}
            onClick={() => onSelectWord(wordObj.word)}
            className={`relative bg-gradient-to-br ${getDifficultyColor(wordObj.difficulty)} text-white rounded-xl p-6 shadow-lg hover:shadow-xl hover:scale-105 transform transition-all duration-200`}
          >
            {/* Difficulty badge */}
            <div className="absolute top-2 right-2 text-2xl">
              {getDifficultyBadge(wordObj.difficulty)}
            </div>

            {/* Word */}
            <div className="text-2xl font-bold mb-2 capitalize">
              {wordObj.word}
            </div>

            {/* Difficulty label and multiplier */}
            <div className="flex items-center justify-center gap-2 text-sm opacity-90">
              <span className="capitalize font-semibold">{wordObj.difficulty}</span>
              <span>•</span>
              <span className="font-bold">{getDifficultyMultiplier(wordObj.difficulty)} points</span>
            </div>
          </button>
        ))}
      </div>

      <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <p className="text-sm text-blue-800">
          💡 <strong>Tip:</strong> Higher difficulty = More points for both you and the guessers!
        </p>
      </div>
    </div>
  );
};
