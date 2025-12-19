export interface DrawingEvent {
  x: number;
  y: number;
  type: 'draw' | 'move';
  color?: string;
  size?: number;
}

export interface DrawingTool {
  type: 'pen' | 'eraser';
  color: string;
  size: number;
}

export interface Point {
  x: number;
  y: number;
}
