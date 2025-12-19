import { Socket } from 'socket.io-client';
import type { DrawingEvent, Point } from '../types';

class DrawingOptimizer {
  private socket: Socket | null = null;
  private eventQueue: DrawingEvent[] = [];
  private batchInterval: number = 16; // 60fps
  private intervalId: number | null = null;
  private lastPoint: Point | null = null;
  private currentTool: { color: string; size: number } = {
    color: '#000000',
    size: 5,
  };
  private isDrawing: boolean = false;

  setSocket(socket: Socket) {
    this.socket = socket;
  }

  startBatching() {
    if (this.intervalId) return;

    this.intervalId = window.setInterval(() => {
      this.sendBatch();
    }, this.batchInterval);
  }

  stopBatching() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.sendBatch(); // Send any remaining events
  }

  addEvent(x: number, y: number, type: 'draw' | 'move') {
    const event: DrawingEvent = {
      x,
      y,
      type,
    };

    // Only include tool info on first event or when tool changes
    if (this.eventQueue.length === 0) {
      event.color = this.currentTool.color;
      event.size = this.currentTool.size;
    }

    this.eventQueue.push(event);
    this.lastPoint = { x, y };
  }

  updateTool(color: string, size: number) {
    this.currentTool = { color, size };

    // If we're currently drawing, add the tool change to the next event
    if (this.isDrawing && this.eventQueue.length === 0) {
      // Force sending tool info on next event
      this.lastPoint = null;
    }
  }

  startDrawing() {
    this.isDrawing = true;
    this.lastPoint = null;
  }

  stopDrawing() {
    this.isDrawing = false;
    this.sendBatch(); // Send remaining events immediately
    this.lastPoint = null;
  }

  private sendBatch() {
    if (this.eventQueue.length === 0 || !this.socket) return;

    // Compress events if there are many
    const events = this.compress(this.eventQueue);

    this.socket.emit('drawing:batch', events);
    this.eventQueue = [];
  }

  private compress(events: DrawingEvent[]): DrawingEvent[] {
    if (events.length <= 2) return events;

    // Simple compression: keep start, end, and points that change direction significantly
    const compressed: DrawingEvent[] = [events[0]]; // Always keep first

    for (let i = 1; i < events.length - 1; i++) {
      const prev = events[i - 1];
      const curr = events[i];
      const next = events[i + 1];

      // Calculate direction change
      const dx1 = curr.x - prev.x;
      const dy1 = curr.y - prev.y;
      const dx2 = next.x - curr.x;
      const dy2 = next.y - curr.y;

      // Keep point if direction changes significantly (using dot product)
      const dotProduct = dx1 * dx2 + dy1 * dy2;
      const mag1 = Math.sqrt(dx1 * dx1 + dy1 * dy1);
      const mag2 = Math.sqrt(dx2 * dx2 + dy2 * dy2);

      if (mag1 === 0 || mag2 === 0) {
        compressed.push(curr);
        continue;
      }

      const cosAngle = dotProduct / (mag1 * mag2);

      // Keep points with angle change > 10 degrees (cos < 0.98)
      if (cosAngle < 0.98) {
        compressed.push(curr);
      }
    }

    compressed.push(events[events.length - 1]); // Always keep last

    return compressed;
  }

  clear() {
    this.eventQueue = [];
    this.lastPoint = null;
  }
}

export const drawingOptimizer = new DrawingOptimizer();
