import React from 'react';

interface AvatarSelectorProps {
  selectedAvatar: number;
  onSelectAvatar: (avatarNumber: number) => void;
}

const AVATARS = [1, 2, 3, 4];

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ selectedAvatar, onSelectAvatar }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Choose Your Avatar
      </label>
      <div className="grid grid-cols-4 gap-3">
        {AVATARS.map((avatarNum) => (
          <button
            key={avatarNum}
            type="button"
            onClick={() => onSelectAvatar(avatarNum)}
            className={`relative aspect-square rounded-xl overflow-hidden transition-all duration-200 ${
              selectedAvatar === avatarNum
                ? 'ring-4 ring-primary-500 ring-offset-2 scale-105 shadow-lg'
                : 'ring-2 ring-gray-200 hover:ring-primary-300 hover:scale-102'
            }`}
          >
            <img
              src={`/avatars/avatar-${avatarNum}.jpg`}
              alt={`Avatar ${avatarNum}`}
              className="w-full h-full object-cover"
            />
            {selectedAvatar === avatarNum && (
              <div className="absolute inset-0 bg-primary-500 bg-opacity-20 flex items-center justify-center">
                <div className="bg-white rounded-full p-1">
                  <svg
                    className="w-6 h-6 text-primary-500"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
};
