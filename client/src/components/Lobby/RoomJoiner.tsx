import React, { useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { AvatarSelector } from './AvatarSelector';

interface RoomJoinerProps {
  onRoomJoined: (roomCode: string) => void;
}

export const RoomJoiner: React.FC<RoomJoinerProps> = ({ onRoomJoined }) => {
  const { socket } = useSocket();
  const [playerName, setPlayerName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState(1);
  const [roomCode, setRoomCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState('');

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();

    if (!playerName.trim()) {
      setError('Please enter your name');
      return;
    }

    if (!roomCode.trim()) {
      setError('Please enter a room code');
      return;
    }

    if (!socket) {
      setError('Not connected to server');
      return;
    }

    setError('');
    setIsJoining(true);

    // Listen for room joined event
    socket.once('room:joined', ({ roomCode: joinedCode }: { roomCode: string }) => {
      setIsJoining(false);
      onRoomJoined(joinedCode);
    });

    socket.once('room:error', ({ message }: { message: string }) => {
      setIsJoining(false);
      setError(message);
    });

    // Emit join room event
    socket.emit('room:join', {
      roomCode: roomCode.trim().toUpperCase(),
      playerName: playerName.trim(),
      avatar: selectedAvatar,
    });
  };

  const handleRoomCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Convert to uppercase and limit to 4 characters
    const value = e.target.value.toUpperCase().slice(0, 4);
    setRoomCode(value);
  };

  return (
    <div className="card max-w-md w-full">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">Join a Room</h2>

      <form onSubmit={handleJoinRoom} className="space-y-4">
        <div>
          <label htmlFor="joinPlayerName" className="block text-sm font-medium text-gray-700 mb-2">
            Your Name
          </label>
          <input
            type="text"
            id="joinPlayerName"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="input-field w-full"
            placeholder="Enter your name"
            maxLength={20}
            disabled={isJoining}
          />
        </div>

        <AvatarSelector
          selectedAvatar={selectedAvatar}
          onSelectAvatar={setSelectedAvatar}
        />

        <div>
          <label htmlFor="roomCode" className="block text-sm font-medium text-gray-700 mb-2">
            Room Code
          </label>
          <input
            type="text"
            id="roomCode"
            value={roomCode}
            onChange={handleRoomCodeChange}
            className="input-field w-full text-center text-2xl font-mono tracking-widest"
            placeholder="ABCD"
            maxLength={4}
            disabled={isJoining}
          />
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={isJoining || !playerName.trim() || roomCode.length !== 4}
          className="btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isJoining ? 'Joining...' : 'Join Room'}
        </button>
      </form>

      <p className="text-sm text-gray-500 mt-4 text-center">
        Enter the 4-character code shared by your friend
      </p>
    </div>
  );
};
