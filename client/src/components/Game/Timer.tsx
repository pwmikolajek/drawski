import React, { useState, useEffect } from 'react';

interface TimerProps {
  duration: number; // in milliseconds
  startTime: number; // timestamp
}

export const Timer: React.FC<TimerProps> = ({ duration, startTime }) => {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, duration - elapsed);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [duration, startTime]);

  const seconds = Math.ceil(timeLeft / 1000);
  const percentage = (timeLeft / duration) * 100;

  // Color based on time left
  const getColor = () => {
    if (percentage > 50) return 'bg-green-500';
    if (percentage > 20) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-lg shadow-sm whitespace-nowrap">
      <span className="text-sm font-medium text-gray-700">⏱️</span>
      <span className={`text-lg font-bold ${
        percentage <= 20 ? 'text-red-600 animate-pulse' :
        percentage <= 50 ? 'text-yellow-600' :
        'text-green-600'
      }`}>
        {seconds}s
      </span>
      <div className="w-24 bg-gray-200 rounded-full h-2">
        <div
          className={`${getColor()} h-2 rounded-full transition-all duration-100`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
