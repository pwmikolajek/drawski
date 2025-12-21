import React, { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { AvatarSelector } from './AvatarSelector';

interface RoomCreatorProps {
  onRoomCreated: (roomCode: string) => void;
}

export const RoomCreator: React.FC<RoomCreatorProps> = ({ onRoomCreated }) => {
  const { socket } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!socket) {
      setError('Not connected to server');
      return;
    }

    setError('');
    setIsCreating(true);

    // Listen for room created event
    socket.once('room:created', ({ roomCode }: { roomCode: string }) => {
      setIsCreating(false);
      onRoomCreated(roomCode);
    });

    socket.once('room:error', ({ message }: { message: string }) => {
      setIsCreating(false);
      setError(message);
    });

    // Emit create room event
    socket.emit('room:create', { playerName: playerName.trim(), avatar: selectedAvatar });
  };

  return (
    <div className="card max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Create a Room</h2>

      <form onSubmit={handleCreateRoom} className="space-y-4">
        <div>
          <label htmlFor="playerName" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <input
            type="text"
            id="playerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="input-field w-full"
            placeholder="Enter your name"
            maxLength={20}
            disabled={isCreating}
          />
        </div>

        <AvatarSelector
          selectedAvatar={selectedAvatar}
          onSelectAvatar={setSelectedAvatar}
        />

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isCreating || !playerName.trim()}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isCreating ? 'Creating...' : 'Create Room'}
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-4 text-center">
        You'll get a room code to share with friends
      </p>
    </div>
  );
};
