import React, { useEffect, useState } from 'react';

interface Bonus {
  type: string;
  amount: number;
  badge: string;
}

interface BonusNotificationProps {
  bonuses: Bonus[];
  totalBonus: number;
  baseScore: number;
  totalScore: number;
  onComplete: () => void;
}

export const BonusNotification: React.FC<BonusNotificationProps> = ({
  bonuses,
  totalBonus,
  baseScore,
  totalScore,
  onComplete,
}) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    // Auto-dismiss after 4 seconds
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(onComplete, 300); // Wait for fade out animation
    }, 4000);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div
      className={`fixed top-24 right-8 z-50 transition-all duration-300 ${
        visible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'
      }`}
    >
      <div className="bg-gradient-to-r from-yellow-400 to-orange-500 rounded-xl shadow-2xl p-6 max-w-sm animate-bounce-in">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="text-4xl">🎉</div>
          <div>
            <h3 className="text-white font-bold text-xl">Bonus Earned!</h3>
            <p className="text-yellow-100 text-sm">Great job!</p>
          </div>
        </div>

        {/* Bonuses List */}
        <div className="space-y-2 mb-4">
          {bonuses.map((bonus, index) => (
            <div
              key={index}
              className="flex items-center justify-between bg-white/20 backdrop-blur-sm rounded-lg p-3 animate-slide-in"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <div className="flex items-center gap-2">
                <span className="text-2xl">{bonus.badge}</span>
                <span className="text-white font-semibold">{bonus.type}</span>
              </div>
              <span className="text-white font-bold text-lg">+{bonus.amount}</span>
            </div>
          ))}
        </div>

        {/* Total Score */}
        <div className="border-t-2 border-white/30 pt-4">
          <div className="flex justify-between items-center text-white mb-2">
            <span className="font-medium">Base Score:</span>
            <span className="font-bold">{baseScore}</span>
          </div>
          <div className="flex justify-between items-center text-white mb-3">
            <span className="font-medium">Bonus:</span>
            <span className="font-bold text-yellow-200">+{totalBonus}</span>
          </div>
          <div className="flex justify-between items-center text-white text-xl border-t-2 border-white/30 pt-3">
            <span className="font-bold">Total:</span>
            <span className="font-extrabold text-2xl text-yellow-200">{totalScore}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
