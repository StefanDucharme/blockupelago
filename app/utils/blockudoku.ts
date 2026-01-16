// Blockudoku game logic utilities

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
}

// All available piece types
export const ALL_PIECES: Piece[] = [
  {
    id: 'single',
    name: 'Single Block',
    shape: [[1]],
    color: '#ef4444',
  },
  {
    id: 'domino_i',
    name: 'Domino I',
    shape: [[1, 1]],
    color: '#f97316',
  },
  {
    id: 'tromino_i',
    name: 'Tromino I',
    shape: [[1, 1, 1]],
    color: '#f59e0b',
  },
  {
    id: 'tromino_l',
    name: 'Tromino L',
    shape: [
      [1, 0],
      [1, 1],
    ],
    color: '#eab308',
  },
  {
    id: 'tetromino_i',
    name: 'Tetromino I',
    shape: [[1, 1, 1, 1]],
    color: '#84cc16',
  },
  {
    id: 'tetromino_o',
    name: 'Tetromino O',
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#22c55e',
  },
  {
    id: 'tetromino_t',
    name: 'Tetromino T',
    shape: [
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: '#10b981',
  },
  {
    id: 'tetromino_l',
    name: 'Tetromino L',
    shape: [
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    color: '#14b8a6',
  },
  {
    id: 'tetromino_s',
    name: 'Tetromino S',
    shape: [
      [0, 1, 1],
      [1, 1, 0],
    ],
    color: '#06b6d4',
  },
  {
    id: 'pentomino_i',
    name: 'Pentomino I',
    shape: [[1, 1, 1, 1, 1]],
    color: '#0ea5e9',
  },
  {
    id: 'pentomino_l',
    name: 'Pentomino L',
    shape: [
      [1, 0],
      [1, 0],
      [1, 0],
      [1, 1],
    ],
    color: '#3b82f6',
  },
  {
    id: 'pentomino_p',
    name: 'Pentomino P',
    shape: [
      [1, 1],
      [1, 1],
      [1, 0],
    ],
    color: '#6366f1',
  },
  {
    id: 'pentomino_u',
    name: 'Pentomino U',
    shape: [
      [1, 0, 1],
      [1, 1, 1],
    ],
    color: '#8b5cf6',
  },
  {
    id: 'pentomino_w',
    name: 'Pentomino W',
    shape: [
      [1, 0, 0],
      [1, 1, 0],
      [0, 1, 1],
    ],
    color: '#a855f7',
  },
  {
    id: 'pentomino_plus',
    name: 'Pentomino Plus',
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: '#d946ef',
  },
  {
    id: 'corner_3x3',
    name: '3x3 Corner',
    shape: [
      [1, 1, 1],
      [1, 0, 0],
      [1, 0, 0],
    ],
    color: '#f43f5e',
  },
  {
    id: 't_shape_3x3',
    name: '3x3 T-Shape',
    shape: [
      [1, 1, 1],
      [0, 1, 0],
      [0, 1, 0],
    ],
    color: '#ef4444',
  },
  {
    id: 'cross_3x3',
    name: '3x3 Cross',
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 1, 0],
    ],
    color: '#dc2626',
  },
];

// Starter pieces that are always unlocked in Archipelago mode
// These should NOT be included in the Archipelago item pool
export const STARTER_PIECE_IDS = ['tromino_l', 'tetromino_t', 'tetromino_l'];

// Create an empty BlockGrid
export function makeGrid(rows: number, cols: number): BlockGrid {
  return Array(rows)
    .fill(0)
    .map(() => Array(cols).fill(0));
}

// Check if a piece can be placed at the given position
export function canPlacePiece(grid: BlockGrid, piece: Piece, row: number, col: number): boolean {
  const gridRows = grid.length;
  const gridCols = grid[0]?.length || 0;
  const pieceRows = piece.shape.length;
  const pieceCols = piece.shape[0]?.length || 0;

  // Check if piece fits within grid bounds
  if (row + pieceRows > gridRows || col + pieceCols > gridCols) {
    return false;
  }

  // Check if all cells where the piece would be placed are empty (or gems)
  for (let r = 0; r < pieceRows; r++) {
    for (let c = 0; c < pieceCols; c++) {
      if (piece.shape[r]?.[c] === 1) {
        const cellValue = grid[row + r]?.[col + c];
        // Only block if cell is filled (1), not if empty (0) or gem (2)
        if (cellValue === 1) {
          return false;
        }
      }
    }
  }

  return true;
}

// Place a piece on the grid (returns new grid)
export function placePiece(grid: BlockGrid, piece: Piece, row: number, col: number): BlockGrid {
  const newGrid = grid.map((r) => [...r]);
  const pieceRows = piece.shape.length;
  const pieceCols = piece.shape[0]?.length || 0;

  for (let r = 0; r < pieceRows; r++) {
    for (let c = 0; c < pieceCols; c++) {
      if (piece.shape[r]?.[c] === 1) {
        const targetRow = newGrid[row + r];
        if (targetRow) {
          // Always set to filled (1), gems are tracked separately in gemCells
          targetRow[col + c] = 1;
        }
      }
    }
  }

  return newGrid;
}

// Check which rows are complete (all filled)
export function getCompleteRows(grid: BlockGrid): number[] {
  const completeRows: number[] = [];
  for (let r = 0; r < grid.length; r++) {
    if (grid[r]?.every((cell) => cell === 1)) {
      completeRows.push(r);
    }
  }
  return completeRows;
}

// Check which columns are complete (all filled)
export function getCompleteCols(grid: BlockGrid): number[] {
  const completeCols: number[] = [];
  const cols = grid[0]?.length || 0;

  for (let c = 0; c < cols; c++) {
    let isComplete = true;
    for (let r = 0; r < grid.length; r++) {
      if (grid[r]?.[c] !== 1) {
        isComplete = false;
        break;
      }
    }
    if (isComplete) {
      completeCols.push(c);
    }
  }
  return completeCols;
}

// Check which 3x3 boxes are complete (for 9x9 grid)
export function getCompleteBoxes(grid: BlockGrid): number[] {
  const gridSize = grid.length;
  if (gridSize !== 9) return []; // Boxes only apply to 9x9 grid

  const completeBoxes: number[] = [];

  for (let boxRow = 0; boxRow < 3; boxRow++) {
    for (let boxCol = 0; boxCol < 3; boxCol++) {
      let isComplete = true;

      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 3; c++) {
          if (grid[boxRow * 3 + r]?.[boxCol * 3 + c] !== 1) {
            isComplete = false;
            break;
          }
        }
        if (!isComplete) break;
      }

      if (isComplete) {
        completeBoxes.push(boxRow * 3 + boxCol);
      }
    }
  }

  return completeBoxes;
}

// Clear complete rows, columns, and boxes (returns new grid and clear info)
export function clearCompleted(grid: BlockGrid): {
  newGrid: BlockGrid;
  clearedRows: number[];
  clearedCols: number[];
  clearedBoxes: number[];
  totalClears: number;
} {
  const rows = getCompleteRows(grid);
  const cols = getCompleteCols(grid);
  const boxes = getCompleteBoxes(grid);

  let newGrid = grid.map((r) => [...r]);

  // Clear rows
  for (const r of rows) {
    const row = newGrid[r];
    if (row) {
      for (let c = 0; c < row.length; c++) {
        row[c] = 0;
      }
    }
  }

  // Clear columns
  for (const c of cols) {
    for (let r = 0; r < newGrid.length; r++) {
      const row = newGrid[r];
      if (row) row[c] = 0;
    }
  }

  // Clear boxes (for 9x9 grid)
  for (const boxIndex of boxes) {
    const boxRow = Math.floor(boxIndex / 3);
    const boxCol = boxIndex % 3;

    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 3; c++) {
        const row = newGrid[boxRow * 3 + r];
        if (row) row[boxCol * 3 + c] = 0;
      }
    }
  }

  return {
    newGrid,
    clearedRows: rows,
    clearedCols: cols,
    clearedBoxes: boxes,
    totalClears: rows.length + cols.length + boxes.length,
  };
}

// Calculate score for a placement and clears
export function calculateScore(clearedRows: number, clearedCols: number, clearedBoxes: number, comboMultiplier: number): number {
  const rowScore = clearedRows * 10;
  const colScore = clearedCols * 10;
  const boxScore = clearedBoxes * 30;
  const baseScore = rowScore + colScore + boxScore;

  // Combo multiplier for multiple clears at once
  return Math.floor(baseScore * comboMultiplier);
}

// Check if any piece can be placed anywhere on the grid
export function canPlaceAnyPiece(grid: BlockGrid, pieces: Piece[]): boolean {
  for (const piece of pieces) {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < (grid[0]?.length || 0); c++) {
        if (canPlacePiece(grid, piece, r, c)) {
          return true;
        }
      }
    }
  }
  return false;
}

// Get a random piece from available pieces
export function getRandomPiece(availablePieces: Piece[]): Piece {
  const piece = availablePieces[Math.floor(Math.random() * availablePieces.length)];
  if (!piece) throw new Error('No pieces available');
  return piece;
}

// Generate a set of random pieces
export function generatePieces(availablePieces: Piece[], count: number): Piece[] {
  const pieces: Piece[] = [];
  for (let i = 0; i < count; i++) {
    pieces.push(getRandomPiece(availablePieces));
  }
  return pieces;
}
