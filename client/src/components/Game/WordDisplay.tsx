import React from 'react';

interface WordDisplayProps {
  word: string;
}

export const WordDisplay: React.FC<WordDisplayProps> = ({ word }) => {
  if (!word) return null;

  const letters = word.split('');

  return (
    <div className="flex items-center gap-2 bg-white px-4 py-3 rounded-lg shadow-sm">
      {letters.map((letter, index) => (
        <div
          key={index}
          className="w-10 h-12 flex items-center justify-center border-b-4 border-primary-500 text-2xl font-bold text-gray-800 bg-gray-50 rounded-t"
        >
          {letter === '_' ? '' : letter.toUpperCase()}
        </div>
      ))}
    </div>
  );
};
