import { ref, computed, watch } from 'vue';
import {
  type BlockGrid,
  type Piece,
  ALL_PIECES,
  makeGrid,
  canPlacePiece,
  placePiece,
  clearCompleted,
  calculateScore,
  canPlaceAnyPiece,
  generatePieces,
} from '~/utils/blockudoku';
import { usePersistentRef } from './usePersistence';
import { getScoreLocationId, getLineClearLocationId, getBoxClearLocationId, getComboLocationId, getPieceLocationId } from './useArchipelagoItems';

export function useBlockudoku() {
  // Game mode
  const singlePlayerMode = usePersistentRef('blockudoku_single_player', true);
  const claimedMilestones = usePersistentRef<number[]>('blockudoku_claimed_milestones', []);

  // Game state
  const gridSize = usePersistentRef('blockudoku_grid_size', 6);
  const grid = usePersistentRef<BlockGrid>('blockudoku_grid', makeGrid(6, 6));
  const totalScore = usePersistentRef('blockudoku_total_score', 0);

  // Clearing animation state
  const clearingCells = ref<Set<string>>(new Set()); // Set of "row-col" strings

  // Statistics for Archipelago checks
  const totalLinesCleared = usePersistentRef('blockudoku_lines_cleared', 0);
  const totalBoxesCleared = usePersistentRef('blockudoku_boxes_cleared', 0);
  const totalCombos = usePersistentRef('blockudoku_combos', 0);
  const totalPiecesPlaced = usePersistentRef('blockudoku_pieces_placed', 0);

  // Unlocked pieces (from Archipelago)
  const unlockedPieceIds = usePersistentRef<string[]>('blockudoku_unlocked_pieces', []);

  // Initialize unlocked pieces if empty
  if (unlockedPieceIds.value.length === 0) {
    const shuffled = [...ALL_PIECES].sort(() => Math.random() - 0.5);
    unlockedPieceIds.value = shuffled.slice(0, 3).map((p) => p.id);
  }

  // Abilities
  const canRotate = usePersistentRef('blockudoku_can_rotate', false);
  const canUndo = usePersistentRef('blockudoku_can_undo', false);
  const rotateUses = usePersistentRef('blockudoku_rotate_uses', 0);
  const undoUses = usePersistentRef('blockudoku_undo_uses', 0);
  const removeBlockUses = usePersistentRef('blockudoku_remove_uses', 0);
  const hintUses = usePersistentRef('blockudoku_hint_uses', 0);

  // Score multiplier (from AP items)
  const scoreMultiplier = usePersistentRef('blockudoku_score_multiplier', 1.0);

  // Piece slots
  const maxPieceSlots = usePersistentRef('blockudoku_max_pieces', 3);
  const currentPieces = usePersistentRef<Piece[]>('blockudoku_current_pieces', []);

  // Game state
  const isGameOver = ref(false);
  const lastMove = ref<{ grid: BlockGrid; pieces: Piece[]; totalScore: number } | null>(null);

  // Available pieces based on what's unlocked
  const availablePieces = computed(() => {
    return ALL_PIECES.filter((p) => unlockedPieceIds.value.includes(p.id));
  });

  // Check if game is over (no valid placements)
  function checkGameOver(): boolean {
    if (currentPieces.value.length === 0) {
      return false; // Will generate new pieces
    }
    return !canPlaceAnyPiece(grid.value, currentPieces.value);
  }

  // Generate new pieces
  function generateNewPieces() {
    if (availablePieces.value.length === 0) {
      console.error('No pieces unlocked!');
      return;
    }
    currentPieces.value = generatePieces(availablePieces.value, maxPieceSlots.value);
  }

  // Initialize game
  function initGame() {
    grid.value = makeGrid(gridSize.value, gridSize.value);
    isGameOver.value = false;
    lastMove.value = null;
    generateNewPieces();
  }

  // Reset all stats (for new game)
  function resetStats() {
    totalScore.value = 0;
    totalLinesCleared.value = 0;
    totalBoxesCleared.value = 0;
    totalCombos.value = 0;
    totalPiecesPlaced.value = 0;

    // Reset to 3 random unique pieces
    const shuffled = [...ALL_PIECES].sort(() => Math.random() - 0.5);
    unlockedPieceIds.value = shuffled.slice(0, 3).map((p) => p.id);
  }

  // Place a piece
  function tryPlacePiece(piece: Piece, row: number, col: number): boolean {
    if (!canPlacePiece(grid.value, piece, row, col)) {
      return false;
    }

    // Save state for undo
    lastMove.value = {
      grid: grid.value.map((r) => [...r]),
      pieces: [...currentPieces.value],
      totalScore: totalScore.value,
    };

    // Place the piece
    grid.value = placePiece(grid.value, piece, row, col);

    // Remove the piece from current pieces (find by reference or ID)
    const index = currentPieces.value.findIndex((p) => p === piece || p.id === piece.id);
    if (index > -1) {
      currentPieces.value = currentPieces.value.filter((_, i) => i !== index);
    }

    totalPiecesPlaced.value++;

    // Check for clears
    const clearResult = clearCompleted(grid.value);
    if (clearResult.totalClears > 0) {
      // Mark cells as clearing for animation
      clearingCells.value = new Set();

      // Add all cells that will be cleared
      clearResult.clearedRows.forEach((row) => {
        for (let col = 0; col < gridSize.value; col++) {
          clearingCells.value.add(`${row}-${col}`);
        }
      });

      clearResult.clearedCols.forEach((col) => {
        for (let row = 0; row < gridSize.value; row++) {
          clearingCells.value.add(`${row}-${col}`);
        }
      });

      clearResult.clearedBoxes.forEach((boxIdx) => {
        const boxRow = Math.floor(boxIdx / 3);
        const boxCol = boxIdx % 3;
        for (let r = 0; r < 3; r++) {
          for (let c = 0; c < 3; c++) {
            clearingCells.value.add(`${boxRow * 3 + r}-${boxCol * 3 + c}`);
          }
        }
      });

      // Delay the actual clear to allow animation to play
      setTimeout(() => {
        grid.value = clearResult.newGrid;
        clearingCells.value = new Set();

        // Update statistics
        totalLinesCleared.value += clearResult.clearedRows.length + clearResult.clearedCols.length;
        totalBoxesCleared.value += clearResult.clearedBoxes.length;

        // Count as combo if multiple clears
        if (clearResult.totalClears > 1) {
          totalCombos.value++;
        }

        // Calculate score
        const comboMultiplier = clearResult.totalClears > 1 ? clearResult.totalClears : 1;
        const points = calculateScore(
          clearResult.clearedRows.length,
          clearResult.clearedCols.length,
          clearResult.clearedBoxes.length,
          comboMultiplier * scoreMultiplier.value,
        );

        totalScore.value += points;

        // Check for single player rewards
        checkSinglePlayerRewards();

        // Generate new pieces if all placed
        if (currentPieces.value.length === 0) {
          generateNewPieces();
        }

        // Check for game over after clearing
        if (checkGameOver()) {
          isGameOver.value = true;
        }
      }, 400); // Animation duration
    } else {
      // No clears, check immediately
      // Generate new pieces if all placed
      if (currentPieces.value.length === 0) {
        generateNewPieces();
      }

      // Check for game over
      if (checkGameOver()) {
        isGameOver.value = true;
      }
    }

    return true;
  }

  // Undo last move
  function undo() {
    if (!lastMove.value || undoUses.value <= 0) {
      return false;
    }

    grid.value = lastMove.value.grid;
    currentPieces.value = lastMove.value.pieces;
    totalScore.value = lastMove.value.totalScore;
    undoUses.value--;
    lastMove.value = null;
    isGameOver.value = false;

    return true;
  }

  // Remove a single block from the grid
  function removeBlock(row: number, col: number): boolean {
    if (removeBlockUses.value <= 0 || grid.value[row]?.[col] === 0) {
      return false;
    }

    grid.value = grid.value.map((r, rIdx) => r.map((cell, cIdx) => (rIdx === row && cIdx === col ? 0 : cell)));
    removeBlockUses.value--;

    // Re-check game over state
    if (isGameOver.value) {
      isGameOver.value = checkGameOver();
    }

    return true;
  }

  // Unlock a piece (from Archipelago)
  function unlockPiece(pieceName: string) {
    const piece = ALL_PIECES.find((p) => p.name === pieceName);
    if (piece && !unlockedPieceIds.value.includes(piece.id)) {
      unlockedPieceIds.value = [...unlockedPieceIds.value, piece.id];
    }
  }

  // Unlock grid size
  function unlockGridSize(size: number) {
    if (size > gridSize.value) {
      gridSize.value = size;
      // Recreate grid with new size (copy old content if possible)
      const newGrid = makeGrid(size, size);
      const oldSize = grid.value.length;
      for (let r = 0; r < Math.min(oldSize, size); r++) {
        for (let c = 0; c < Math.min(oldSize, size); c++) {
          const sourceRow = grid.value[r];
          const targetRow = newGrid[r];
          if (sourceRow && targetRow) {
            targetRow[c] = sourceRow[c] ?? 0;
          }
        }
      }
      grid.value = newGrid;
    }
  }

  // Add abilities
  function addRotateAbility() {
    canRotate.value = true;
    rotateUses.value++;
  }

  function addUndoAbility() {
    canUndo.value = true;
    undoUses.value++;
  }

  function addRemoveBlock() {
    removeBlockUses.value++;
  }

  function addHint() {
    hintUses.value++;
  }

  function addScoreMultiplier(amount: number) {
    scoreMultiplier.value += amount;
  }

  function addPieceSlot() {
    if (maxPieceSlots.value < 5) {
      maxPieceSlots.value++;
      // Add one more piece if currently playing
      if (currentPieces.value.length > 0 && currentPieces.value.length < maxPieceSlots.value) {
        currentPieces.value = [...currentPieces.value, ...generatePieces(availablePieces.value, 1)];
      }
    }
  }

  // Watch for grid size changes
  watch(gridSize, () => {
    if (grid.value.length !== gridSize.value) {
      initGame();
    }
  });

  // Single Player Mode Milestones
  const MILESTONES = [
    { id: 1, score: 100, reward: { type: 'piece', value: 1 }, description: 'Unlock 1 new piece' },
    { id: 2, score: 250, reward: { type: 'undo', value: 3 }, description: 'Unlock Undo (3 uses)' },
    { id: 3, score: 500, reward: { type: 'piece', value: 1 }, description: 'Unlock 1 new piece' },
    { id: 4, score: 750, reward: { type: 'slot', value: 1 }, description: 'Unlock 4th piece slot' },
    { id: 5, score: 1000, reward: { type: 'removeBlock', value: 2 }, description: 'Remove Block (2 uses)' },
    { id: 6, score: 1500, reward: { type: 'piece', value: 2 }, description: 'Unlock 2 new pieces' },
    { id: 7, score: 2000, reward: { type: 'multiplier', value: 0.1 }, description: '1.1x Score Multiplier' },
    { id: 8, score: 2500, reward: { type: 'gridSize', value: 7 }, description: 'Unlock 7x7 Grid' },
    { id: 9, score: 3000, reward: { type: 'piece', value: 2 }, description: 'Unlock 2 new pieces' },
    { id: 10, score: 4000, reward: { type: 'slot', value: 1 }, description: 'Unlock 5th piece slot' },
    { id: 11, score: 5000, reward: { type: 'multiplier', value: 0.25 }, description: '1.35x Score Multiplier' },
    { id: 12, score: 6000, reward: { type: 'removeBlock', value: 3 }, description: 'Remove Block (3 uses)' },
    { id: 13, score: 7500, reward: { type: 'piece', value: 3 }, description: 'Unlock 3 new pieces' },
    { id: 14, score: 10000, reward: { type: 'gridSize', value: 9 }, description: 'Unlock 9x9 Grid' },
  ];

  // Check and grant single player rewards
  function checkSinglePlayerRewards() {
    if (!singlePlayerMode.value) return [];

    const newRewards: typeof MILESTONES = [];

    for (const milestone of MILESTONES) {
      if (totalScore.value >= milestone.score && !claimedMilestones.value.includes(milestone.id)) {
        claimedMilestones.value = [...claimedMilestones.value, milestone.id];

        // Grant the reward
        switch (milestone.reward.type) {
          case 'piece':
            // Unlock random pieces
            const availableToUnlock = ALL_PIECES.filter((p) => !unlockedPieceIds.value.includes(p.id));
            const shuffled = [...availableToUnlock].sort(() => Math.random() - 0.5);
            const toUnlock = shuffled.slice(0, milestone.reward.value);
            toUnlock.forEach((piece) => unlockPiece(piece.name));
            break;
          case 'undo':
            addUndoAbility();
            undoUses.value += milestone.reward.value - 1;
            break;
          case 'removeBlock':
            addRemoveBlock();
            removeBlockUses.value += milestone.reward.value - 1;
            break;
          case 'slot':
            addPieceSlot();
            break;
          case 'multiplier':
            addScoreMultiplier(milestone.reward.value);
            break;
          case 'gridSize':
            unlockGridSize(milestone.reward.value);
            break;
        }

        newRewards.push(milestone);
      }
    }

    return newRewards;
  }

  // Check for milestone achievements and return location IDs to send to AP
  function checkMilestones(): number[] {
    const checks: number[] = [];

    // Check score milestones
    const scoreCheck = getScoreLocationId(totalScore.value);
    if (scoreCheck) checks.push(scoreCheck);

    // Check line clear milestones
    const lineCheck = getLineClearLocationId(totalLinesCleared.value);
    if (lineCheck) checks.push(lineCheck);

    // Check box clear milestones
    const boxCheck = getBoxClearLocationId(totalBoxesCleared.value);
    if (boxCheck) checks.push(boxCheck);

    // Check combo milestones
    const comboCheck = getComboLocationId(totalCombos.value);
    if (comboCheck) checks.push(comboCheck);

    // Check pieces placed milestones
    const pieceCheck = getPieceLocationId(totalPiecesPlaced.value);
    if (pieceCheck) checks.push(pieceCheck);

    return checks;
  }

  return {
    // State
    grid,
    gridSize,
    totalScore,
    currentPieces,
    isGameOver,
    availablePieces,
    clearingCells,

    // Mode
    singlePlayerMode,
    MILESTONES,
    claimedMilestones,

    // Statistics
    totalLinesCleared,
    totalBoxesCleared,
    totalCombos,
    totalPiecesPlaced,

    // Abilities
    canRotate,
    canUndo,
    rotateUses,
    undoUses,
    removeBlockUses,
    hintUses,
    scoreMultiplier,
    maxPieceSlots,

    // Actions
    initGame,
    resetStats,
    tryPlacePiece,
    undo,
    removeBlock,
    checkMilestones,
    checkSinglePlayerRewards,

    // Archipelago unlocks
    unlockPiece,
    unlockGridSize,
    addRotateAbility,
    addUndoAbility,
    addRemoveBlock,
    addHint,
    addScoreMultiplier,
    addPieceSlot,
    unlockedPieceIds,
  };
}
