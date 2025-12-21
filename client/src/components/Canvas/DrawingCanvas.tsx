import React, { useRef, useEffect, useState } from 'react';
import { useSocket } from '../../contexts/SocketContext';
import { drawingOptimizer } from '../../services/drawingOptimizer';
import type { DrawingEvent } from '../../types';

interface DrawingCanvasProps {
  isDrawer: boolean;
  width?: number;
  height?: number;
}

export const DrawingCanvas: React.FC<DrawingCanvasProps> = ({
  isDrawer,
  width = 800,
  height = 600,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { socket } = useSocket();
  const [isDrawing, setIsDrawing] = useState(false);
  const [context, setContext] = useState<CanvasRenderingContext2D | null>(null);

  // Current drawing tool
  const [color, setColor] = useState('#000000');
  const [size, setSize] = useState(5);

  // Initialize canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { willReadFrequently: false });
    if (!ctx) return;

    // Set canvas size
    canvas.width = width;
    canvas.height = height;

    // Configure context
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    setContext(ctx);
  }, [width, height]);

  // Setup socket listener for remote drawing
  useEffect(() => {
    if (!socket || !context) return;

    const handleDrawingBatch = (events: DrawingEvent[]) => {
      events.forEach((event) => {
        // Update tool if provided
        if (event.color) {
          context.strokeStyle = event.color;
        }
        if (event.size) {
          context.lineWidth = event.size;
        }

        if (event.type === 'move') {
          context.beginPath();
          context.moveTo(event.x, event.y);
        } else if (event.type === 'draw') {
          context.lineTo(event.x, event.y);
          context.stroke();
        }
      });
    };

    const handleClearCanvas = () => {
      if (context) {
        context.clearRect(0, 0, width, height);
      }
    };

    socket.on('drawing:batch', handleDrawingBatch);
    socket.on('drawing:clear', handleClearCanvas);

    return () => {
      socket.off('drawing:batch', handleDrawingBatch);
      socket.off('drawing:clear', handleClearCanvas);
    };
  }, [socket, context, width, height]);

  // Setup drawing optimizer
  useEffect(() => {
    if (!socket) return;

    drawingOptimizer.setSocket(socket);
    drawingOptimizer.startBatching();

    return () => {
      drawingOptimizer.stopBatching();
    };
  }, [socket]);

  // Update tool in optimizer
  useEffect(() => {
    drawingOptimizer.updateTool(color, size);
  }, [color, size]);

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;

    const rect = canvas.getBoundingClientRect();

    // Account for canvas scaling
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    return { x, y };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !context) return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const { x, y } = coords;

    setIsDrawing(true);
    drawingOptimizer.startDrawing();

    // Start path locally
    context.strokeStyle = color;
    context.lineWidth = size;
    context.beginPath();
    context.moveTo(x, y);

    // Add to optimizer
    drawingOptimizer.addEvent(x, y, 'move');
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isDrawer || !context) return;

    const coords = getCanvasCoordinates(e);
    if (!coords) return;

    const { x, y } = coords;

    // Draw locally (optimistic update)
    context.lineTo(x, y);
    context.stroke();

    // Add to optimizer for syncing
    drawingOptimizer.addEvent(x, y, 'draw');
  };

  const stopDrawing = () => {
    if (!isDrawing) return;

    setIsDrawing(false);
    drawingOptimizer.stopDrawing();

    if (context) {
      context.closePath();
    }
  };

  const clearCanvas = () => {
    if (!isDrawer || !context) return;

    context.clearRect(0, 0, width, height);

    if (socket) {
      socket.emit('drawing:clear');
    }
  };

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        className={`bg-white ${
          isDrawer ? 'cursor-crosshair' : 'cursor-not-allowed'
        }`}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ maxWidth: '100%', height: 'auto' }}
      />

      {isDrawer && (
        <div className="absolute bottom-4 left-4 right-4 bg-white/95 backdrop-blur-sm rounded p-3">
          <div className="flex items-center gap-4">
            {/* Color palette */}
            <div className="flex gap-2">
              {[
                '#000000', // Black
                '#FFFFFF', // White
                '#FF0000', // Red
                '#0000FF', // Blue
                '#00FF00', // Green
                '#FFFF00', // Yellow
                '#FF6B00', // Orange
                '#800080', // Purple
                '#FFC0CB', // Pink
                '#8B4513', // Brown
              ].map((c) => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  className={`w-8 h-8 rounded-full border-2 transition-all hover:scale-110 ${
                    color === c ? 'border-blue-500 ring-2 ring-blue-300' : 'border-gray-300'
                  }`}
                  style={{ backgroundColor: c }}
                  title={c}
                />
              ))}
              {/* Custom color picker */}
              <input
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="w-8 h-8 rounded-full cursor-pointer border-2 border-gray-300"
                title="Custom color"
              />
            </div>

            {/* Size slider */}
            <div className="flex items-center gap-2 flex-1">
              <span className="text-sm font-medium text-gray-700">Size:</span>
              <input
                type="range"
                min="1"
                max="50"
                value={size}
                onChange={(e) => setSize(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm text-gray-600 w-8">{size}</span>
            </div>

            {/* Clear button */}
            <button
              onClick={clearCanvas}
              className="btn-secondary text-sm"
            >
              Clear
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
