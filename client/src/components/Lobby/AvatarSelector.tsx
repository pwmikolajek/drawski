import React, { useState } from 'react';

interface AvatarSelectorProps {
  selectedAvatar: number;
  onSelectAvatar: (avatarNumber: number) => void;
}

const AVATARS = [1, 2, 3, 4, 5, 6, 7, 8];
const AVATARS_PER_PAGE = 4;
const TOTAL_PAGES = Math.ceil(AVATARS.length / AVATARS_PER_PAGE);

export const AvatarSelector: React.FC<AvatarSelectorProps> = ({ selectedAvatar, onSelectAvatar }) => {
  const [currentPage, setCurrentPage] = useState(() => {
    // Start on the page that contains the selected avatar
    return Math.floor((selectedAvatar - 1) / AVATARS_PER_PAGE);
  });

  const startIndex = currentPage * AVATARS_PER_PAGE;
  const visibleAvatars = AVATARS.slice(startIndex, startIndex + AVATARS_PER_PAGE);

  const goToPrevPage = () => {
    setCurrentPage((prev) => (prev > 0 ? prev - 1 : TOTAL_PAGES - 1));
  };

  const goToNextPage = () => {
    setCurrentPage((prev) => (prev < TOTAL_PAGES - 1 ? prev + 1 : 0));
  };

  return (
    <div className="py-2">
      <label className="block text-sm font-medium text-gray-700 mb-4">
        Choose Your Avatar
      </label>

      {/* Carousel Container */}
      <div className="relative">
        {/* Left Arrow */}
        {TOTAL_PAGES > 1 && (
          <button
            type="button"
            onClick={goToPrevPage}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-3 z-10 bg-white hover:bg-gray-50 text-gray-700 rounded-custom-radius p-2 shadow-custom-shadow hover:shadow-custom-shadow transition-all duration-200 hover:scale-110"
            aria-label="Previous avatars"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
        )}

        {/* Avatar Grid */}
        <div className="overflow-visible px-10 py-2">
          <div
            className="grid grid-cols-4 gap-3 transition-all duration-300 ease-in-out"
            style={{
              transform: `translateX(0)`,
            }}
          >
            {visibleAvatars.map((avatarNum) => (
              <button
                key={avatarNum}
                type="button"
                onClick={() => onSelectAvatar(avatarNum)}
                className={`relative aspect-square rounded-custom-radius overflow-hidden transition-all duration-200 transform ${
                  selectedAvatar === avatarNum
                    ? 'ring-4 ring-primary-500 ring-offset-2 scale-105 shadow-custom-shadow'
                    : 'ring-2 ring-gray-200 hover:ring-primary-300 hover:scale-102 shadow-custom-shadow'
                }`}
              >
                <img
                  src={`/avatars/avatar-${avatarNum}.jpg`}
                  alt={`Avatar ${avatarNum}`}
                  className="w-full h-full object-cover"
                />
                {selectedAvatar === avatarNum && (
                  <div className="absolute inset-0 bg-primary-500 bg-opacity-20 flex items-center justify-center">
                    <div className="bg-white rounded-custom-radius p-1.5 shadow-custom-shadow">
                      <svg
                        className="w-7 h-7 text-primary-500"
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

        {/* Right Arrow */}
        {TOTAL_PAGES > 1 && (
          <button
            type="button"
            onClick={goToNextPage}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-3 z-10 bg-white hover:bg-gray-50 text-gray-700 rounded-custom-radius p-2 shadow-custom-shadow hover:shadow-custom-shadow transition-all duration-200 hover:scale-110"
            aria-label="Next avatars"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Page Indicators */}
      {TOTAL_PAGES > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          {Array.from({ length: TOTAL_PAGES }).map((_, index) => (
            <button
              key={index}
              type="button"
              onClick={() => setCurrentPage(index)}
              className={`transition-all duration-200 rounded-custom-radius ${
                currentPage === index
                  ? 'w-8 h-2 bg-primary-500'
                  : 'w-2 h-2 bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Go to page ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
};
