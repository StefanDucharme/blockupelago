/**
 * Shared TypeScript type definitions
 * Centralized types for better type safety and reusability
 */

// Core game types
export type BlockCell = 0 | 1 | 2; // 0 = empty, 1 = filled, 2 = gem
export type BlockGrid = BlockCell[][];

// Gem cell info for Archipelago checks
export interface GemCell {
  row: number;
  col: number;
  checkId: number; // Archipelago location ID
}

// Polyomino piece definition
export interface Piece {
  id: string;
  name: string;
  shape: BlockCell[][];
  color: string;
  hasBeenRotated?: boolean; // Track if this piece has been rotated (for free subsequent rotations)
  hasBeenMirrored?: boolean; // Track if this piece has been mirrored (for free subsequent mirrors)
}

// Game mode types
export type GameMode = 'free-play' | 'archipelago';

// Archipelago connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

// Message log entry
export interface MessageLogEntry {
  time: Date;
  text: string;
  type: 'info' | 'item' | 'chat' | 'error';
}

// Ability types
export type AbilityType = 'rotate' | 'undo' | 'remove' | 'hold' | 'mirror' | 'shrink';

// Ability configuration for free-play mode
export interface FreePlayAbilities {
  freeRotate: boolean;
  freeUndo: boolean;
  freeRemove: boolean;
  freeHold: boolean;
  freeMirror: boolean;
  freeShrink: boolean;
}

// Game state snapshot for undo functionality
export interface GameStateSnapshot {
  grid: BlockGrid;
  pieces: Piece[];
  totalScore: number;
}

// Clear result from game logic
export interface ClearResult {
  newGrid: BlockGrid;
  totalClears: number;
  clearedRows: number[];
  clearedCols: number[];
  clearedBoxes: number[];
  scoreGained: number;
}

// Gem cell with check ID for Archipelago
export interface GemCellData {
  row: number;
  col: number;
  checkId: number;
}

// Cell position
export interface CellPosition {
  row: number;
  col: number;
}

// Drag state for drag-and-drop
export interface DragState {
  isDragging: boolean;
  draggedPiece: Piece | null;
  dragPosition: { x: number; y: number };
  dragOffset: { x: number; y: number };
  isTouchDrag: boolean;
}
