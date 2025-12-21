import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../contexts/SocketContext';

interface ChatMessage {
  playerName: string;
  message: string;
  isCorrect: boolean;
  isClose: boolean;
  timestamp: number;
}

interface ChatProps {
  isDrawer: boolean;
}

export const Chat: React.FC<ChatProps> = ({ isDrawer }) => {
  const { socket } = useSocket();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!socket) return;

    // Listen for chat messages
    const handleChatReceived = (data: ChatMessage) => {
      setMessages(prev => [...prev, { ...data, isClose: data.isClose ?? false }]);
    };

    // Listen for correct guesses
    const handleCorrectGuess = ({ message }: { message: string }) => {
      setMessages(prev => [...prev, {
        playerName: 'System',
        message,
        isCorrect: true,
        isClose: false,
        timestamp: Date.now(),
      }]);
    };

    // Listen for close guesses
    const handleCloseGuess = ({ message }: { message: string }) => {
      setMessages(prev => [...prev, {
        playerName: 'System',
        message,
        isCorrect: false,
        isClose: true,
        timestamp: Date.now(),
      }]);
    };

    socket.on('chat:received', handleChatReceived);
    socket.on('guess:correct', handleCorrectGuess);
    socket.on('guess:close', handleCloseGuess);

    return () => {
      socket.off('chat:received', handleChatReceived);
      socket.off('guess:correct', handleCorrectGuess);
      socket.off('guess:close', handleCloseGuess);
    };
  }, [socket]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!socket || !inputMessage.trim()) return;

    // Send message to server
    socket.emit('chat:message', { message: inputMessage.trim() });
    setInputMessage('');
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-lg shadow-md">
      {/* Chat Header */}
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-800">
          {isDrawer ? 'Chat (You\'re Drawing)' : 'Chat & Guessing'}
        </h3>
        {!isDrawer && (
          <p className="text-sm text-gray-600">Type your guess below!</p>
        )}
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 min-h-0">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            {isDrawer ? 'Messages will appear here' : 'Start guessing!'}
          </div>
        ) : (
          messages.map((msg, index) => (
            <div
              key={index}
              className={`p-2 rounded-lg ${
                msg.isCorrect
                  ? 'bg-green-100 border border-green-300'
                  : msg.isClose
                  ? 'bg-yellow-100 border border-yellow-300'
                  : msg.playerName === 'System'
                  ? 'bg-blue-50 border border-blue-200'
                  : 'bg-gray-50'
              }`}
            >
              <div className="flex justify-between items-start">
                <span className={`font-semibold text-sm ${
                  msg.isCorrect ? 'text-green-700' : msg.isClose ? 'text-yellow-700' : 'text-gray-700'
                }`}>
                  {msg.playerName}
                </span>
                <span className="text-xs text-gray-400">
                  {formatTime(msg.timestamp)}
                </span>
              </div>
              <p className={`text-sm mt-1 ${
                msg.isCorrect ? 'text-green-800 font-medium' : msg.isClose ? 'text-yellow-800' : 'text-gray-800'
              }`}>
                {msg.message}
              </p>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      {!isDrawer && (
        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 flex-shrink-0 rounded-b-lg bg-white">
          <div className="flex gap-2">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Type your guess..."
              maxLength={100}
              className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim()}
              className="flex-shrink-0 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm"
            >
              Send
            </button>
          </div>
        </form>
      )}

      {isDrawer && (
        <div className="p-4 border-t border-gray-200 bg-gray-50 text-center text-gray-600 text-sm flex-shrink-0 rounded-b-lg">
          🎨 You cannot send messages while drawing
        </div>
      )}
    </div>
  );
};
