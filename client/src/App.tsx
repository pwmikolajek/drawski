import { useState, useEffect, useRef } from 'react';
import { useSocket } from './contexts/SocketContext';
import { RoomCreator } from './components/Lobby/RoomCreator';
import { RoomJoiner } from './components/Lobby/RoomJoiner';
import { GameRoom } from './components/Game/GameRoom';
import type { Player, GameState } from './types';

type View = 'lobby' | 'game';

function App() {
  const { isConnected, socket } = useSocket();
  const [view, setView] = useState<View>('lobby');
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [initialPlayers, setInitialPlayers] = useState<Player[]>([]);
  const [initialGameState, setInitialGameState] = useState<GameState | null>(null);
  const [isMusicMuted, setIsMusicMuted] = useState(false);
  const [musicReady, setMusicReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize audio
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio('/sounds/bg-music.wav');
      audio.loop = true;
      audio.volume = 0.3; // 30% volume
      audioRef.current = audio;
    }
  }, []);

  // Background music control
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (view === 'lobby' && musicReady) {
      // Play music when in lobby
      audio.play().catch(error => {
        console.log('Audio play failed (autoplay blocked):', error);
      });
    } else {
      // Pause music when leaving lobby
      audio.pause();
    }

    return () => {
      // Cleanup on unmount
      audio.pause();
    };
  }, [view, musicReady]);

  // Mute/unmute control
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.muted = isMusicMuted;
    }
  }, [isMusicMuted]);

  useEffect(() => {
    if (!socket) return;

    // Listen for room created
    socket.on('room:created', ({ roomCode: code, players, isHost: host }: { roomCode: string; players: Player[]; isHost: boolean }) => {
      setRoomCode(code);
      setIsHost(host);
      setInitialPlayers(players || []);
      setView('game');
    });

    // Listen for room joined
    socket.on('room:joined', ({ roomCode: code, isHost: host, players, gameState }: { roomCode: string; isHost: boolean; players: Player[]; gameState?: GameState }) => {
      setRoomCode(code);
      setIsHost(host);
      setInitialPlayers(players || []);
      setInitialGameState(gameState || null);
      setView('game');
    });

    // Listen for room left
    socket.on('room:left', () => {
      setRoomCode(null);
      setIsHost(false);
      setView('lobby');
    });

    return () => {
      socket.off('room:created');
      socket.off('room:joined');
      socket.off('room:left');
    };
  }, [socket]);

  const handleRoomCreated = (_code: string) => {
    // This will be handled by the socket event listener
  };

  const handleRoomJoined = (_code: string) => {
    // This will be handled by the socket event listener
  };

  const handleLeaveRoom = () => {
    setRoomCode(null);
    setIsHost(false);
    setView('lobby');
    setShowJoin(false);
    setInitialPlayers([]);
    setInitialGameState(null);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
        <div className="card max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Connecting...</h2>
          <p className="text-gray-600">Connecting to server</p>
        </div>
      </div>
    );
  }

  if (view === 'game' && roomCode) {
    return (
      <GameRoom
        roomCode={roomCode}
        isHost={isHost}
        onLeaveRoom={handleLeaveRoom}
        initialPlayers={initialPlayers}
        initialGameState={initialGameState}
      />
    );
  }

  const handleMusicToggle = () => {
    if (!musicReady) {
      // First interaction - enable music
      setMusicReady(true);
      setIsMusicMuted(false);
    } else {
      // Toggle mute
      setIsMusicMuted(!isMusicMuted);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center p-4">
      {/* Music Toggle Button */}
      <button
        onClick={handleMusicToggle}
        className={`fixed top-4 right-4 bg-white hover:bg-gray-100 text-gray-800 p-3 rounded-full shadow-lg transition-all hover:scale-110 z-50 ${
          !musicReady ? 'animate-pulse' : ''
        }`}
        title={!musicReady ? 'Click to enable music' : isMusicMuted ? 'Unmute music' : 'Mute music'}
      >
        <span className="text-2xl">
          {!musicReady ? '🎵' : isMusicMuted ? '🔇' : '🔊'}
        </span>
      </button>

      <div className="max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <img
              src="/drawski-logo.png"
              alt="Drawski"
              className="h-12 w-auto"
            />
          </div>
          <p className="text-xl text-gray-600">
            Draw, guess, and have fun with friends!
          </p>
        </div>

        {/* Create or Join */}
        {!showJoin ? (
          <div className="space-y-6">
            <div className="flex justify-center">
              <RoomCreator onRoomCreated={handleRoomCreated} />
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowJoin(true)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                Or join an existing room →
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-center">
              <RoomJoiner onRoomJoined={handleRoomJoined} />
            </div>

            <div className="text-center">
              <button
                onClick={() => setShowJoin(false)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                ← Back to create room
              </button>
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Built with React, TypeScript, and Socket.IO</p>
        </div>
      </div>
    </div>
  );
}

export default App;
