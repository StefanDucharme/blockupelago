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
import {
  getScoreLocationId,
  getLineClearLocationId,
  getBoxClearLocationId,
  getPieceLocationId,
  getGemLocationId,
  MAX_GEM_CHECKS,
} from './useArchipelagoItems';

export type GameMode = 'free-play' | 'archipelago';

export function useBlockudoku() {
  // Game mode
  const gameMode = usePersistentRef<GameMode>('blockudoku_game_mode', 'free-play');

  // Game state
  const gridSize = usePersistentRef('blockudoku_grid_size', 9);
  const grid = usePersistentRef<BlockGrid>('blockudoku_grid', makeGrid(9, 9));
  const totalScore = usePersistentRef('blockudoku_total_score', 0);

  // Clearing animation state
  const clearingCells = ref<Set<string>>(new Set()); // Set of "row-col" strings

  // Collected gem check IDs that need to be sent to AP
  const collectedGemChecks = ref<number[]>([]);

  // Get and clear collected gem checks (for sending to AP)
  function getCollectedGemChecks(): number[] {
    const checks = [...collectedGemChecks.value];
    collectedGemChecks.value = [];
    return checks;
  }

  // Gem cells (Archipelago checks)
  const gemCells = ref<{ row: number; col: number; checkId: number }[]>([]);
  const gemSpawnChance = 0.3; // 30% chance to spawn a gem on piece restock
  const nextGemCheckId = ref(10000000); // Starting ID for gem checks

  // Statistics for Archipelago checks
  const totalLinesCleared = usePersistentRef('blockudoku_lines_cleared', 0);
  const totalBoxesCleared = usePersistentRef('blockudoku_boxes_cleared', 0);
  const totalCombos = usePersistentRef('blockudoku_combos', 0);
  const totalPiecesPlaced = usePersistentRef('blockudoku_pieces_placed', 0);
  const totalGemsCollected = usePersistentRef('blockudoku_gems_collected', 0);

  // Unlocked pieces (from Archipelago only)
  const unlockedPieceIds = usePersistentRef<string[]>('blockudoku_unlocked_pieces', []);

  // Initialize unlocked pieces if empty (for archipelago mode)
  if (unlockedPieceIds.value.length === 0 && gameMode.value === 'archipelago') {
    const shuffled = [...ALL_PIECES].sort(() => Math.random() - 0.5);
    unlockedPieceIds.value = shuffled.slice(0, 3).map((p) => p.id);
  }

  // Abilities
  const rotateUses = usePersistentRef('blockudoku_rotate_uses', 0);
  const undoUses = usePersistentRef('blockudoku_undo_uses', 1);
  const removeBlockUses = usePersistentRef('blockudoku_remove_uses', 0);
  const holdUses = usePersistentRef('blockudoku_hold_uses', 0);
  const heldPiece = usePersistentRef<Piece | null>('blockudoku_held_piece', null);

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
    // In free-play mode, all pieces are available
    if (gameMode.value === 'free-play') {
      return ALL_PIECES;
    }
    // In archipelago mode, only unlocked pieces are available
    return ALL_PIECES.filter((p) => unlockedPieceIds.value.includes(p.id));
  });

  // Check if game is over (no valid placements)
  function checkGameOver(): boolean {
    if (currentPieces.value.length === 0) {
      return false; // Will generate new pieces
    }
    return !canPlaceAnyPiece(grid.value, currentPieces.value);
  }

  // Helper function to rotate a piece shape
  function applyRotation(piece: Piece): Piece {
    const oldShape = piece.shape;
    const rows = oldShape.length;
    const cols = oldShape[0]?.length || 0;

    const newShape: BlockCell[][] = [];
    for (let c = 0; c < cols; c++) {
      const newRow: BlockCell[] = [];
      for (let r = rows - 1; r >= 0; r--) {
        newRow.push((oldShape[r]?.[c] || 0) as BlockCell);
      }
      newShape.push(newRow);
    }

    return { ...piece, shape: newShape };
  }

  // Generate new pieces
  function generateNewPieces() {
    if (availablePieces.value.length === 0) {
      console.error('No pieces unlocked!');
      return;
    }
    let pieces = generatePieces(availablePieces.value, maxPieceSlots.value);

    // Apply random rotation to each piece
    pieces = pieces.map((piece) => {
      const rotations = Math.floor(Math.random() * 4); // 0-3 rotations
      let rotatedPiece = piece;
      for (let i = 0; i < rotations; i++) {
        rotatedPiece = applyRotation(rotatedPiece);
      }
      return rotatedPiece;
    });

    currentPieces.value = pieces;

    // Random chance to spawn a gem on the grid
    if (Math.random() < gemSpawnChance) {
      spawnGem();
    }
  }

  // Spawn a gem in a random empty cell
  function spawnGem() {
    // Find all empty cells
    const emptyCells: { row: number; col: number }[] = [];
    for (let r = 0; r < grid.value.length; r++) {
      for (let c = 0; c < grid.value[r]!.length; c++) {
        if (grid.value[r]![c] === 0) {
          emptyCells.push({ row: r, col: c });
        }
      }
    }

    if (emptyCells.length === 0) return;

    // Pick a random empty cell
    const randomCell = emptyCells[Math.floor(Math.random() * emptyCells.length)];
    if (!randomCell) return;

    // Place gem and track it
    grid.value[randomCell.row]![randomCell.col] = 2;
    const checkId = nextGemCheckId.value++;
    gemCells.value.push({ row: randomCell.row, col: randomCell.col, checkId });
  }

  // Initialize game
  function initGame() {
    grid.value = makeGrid(gridSize.value, gridSize.value);
    isGameOver.value = false;
    lastMove.value = null;
    heldPiece.value = null;
    generateNewPieces();
  }

  // Reset all stats (for new game)
  function resetStats() {
    totalScore.value = 0;
    totalLinesCleared.value = 0;
    totalBoxesCleared.value = 0;
    totalCombos.value = 0;
    totalPiecesPlaced.value = 0;
    totalGemsCollected.value = 0;
    heldPiece.value = null;
    gemCells.value = [];

    // Free-play mode: no abilities, use gems instead
    if (gameMode.value === 'free-play') {
      rotateUses.value = 0;
      undoUses.value = 0;
      removeBlockUses.value = 0;
      holdUses.value = 0;
      scoreMultiplier.value = 1.0;
      maxPieceSlots.value = 3;
      // All pieces are available in free-play, no need to set unlockedPieceIds
      unlockedPieceIds.value = [];
    } else {
      // Archipelago mode starts with limited resources from AP
      rotateUses.value = 0;
      undoUses.value = 0;
      removeBlockUses.value = 0;
      holdUses.value = 0;
      scoreMultiplier.value = 1.0;
      maxPieceSlots.value = 3;

      // Reset to 3 random unique pieces (for archipelago mode)
      const shuffled = [...ALL_PIECES].sort(() => Math.random() - 0.5);
      unlockedPieceIds.value = shuffled.slice(0, 3).map((p) => p.id);
    }

    gridSize.value = 9;
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

    // Also clear from held piece if it matches
    if (heldPiece.value?.id === piece.id) {
      heldPiece.value = null;
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

        // Clear any gems in the cleared rows/cols/boxes
        const gemsToRemove: number[] = [];

        clearResult.clearedRows.forEach((row) => {
          for (let col = 0; col < gridSize.value; col++) {
            const gemIndex = gemCells.value.findIndex((g) => g.row === row && g.col === col);
            if (gemIndex !== -1 && gemCells.value[gemIndex]) {
              gemsToRemove.push(gemIndex);
            }
          }
        });

        clearResult.clearedCols.forEach((col) => {
          for (let row = 0; row < gridSize.value; row++) {
            const gemIndex = gemCells.value.findIndex((g) => g.row === row && g.col === col);
            if (gemIndex !== -1 && gemCells.value[gemIndex]) {
              gemsToRemove.push(gemIndex);
            }
          }
        });

        clearResult.clearedBoxes.forEach((boxIdx) => {
          const boxRow = Math.floor(boxIdx / 3);
          const boxCol = boxIdx % 3;
          for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
              const actualRow = boxRow * 3 + r;
              const actualCol = boxCol * 3 + c;
              const gemIndex = gemCells.value.findIndex((g) => g.row === actualRow && g.col === actualCol);
              if (gemIndex !== -1 && gemCells.value[gemIndex]) {
                gemsToRemove.push(gemIndex);
              }
            }
          }
        });

        // Remove gems (in reverse order to avoid index issues)
        const gemsCollected = [...new Set(gemsToRemove)];
        gemsCollected
          .sort((a, b) => b - a)
          .forEach((index) => {
            const gem = gemCells.value[index];
            if (gem && totalGemsCollected.value < MAX_GEM_CHECKS) {
              console.log('💎 Gem collected via line clear! Gem #' + (totalGemsCollected.value + 1));
              totalGemsCollected.value++;
              // Send individual gem check
              const gemCheckId = getGemLocationId(totalGemsCollected.value);
              if (gemCheckId) {
                collectedGemChecks.value.push(gemCheckId);
              }
            }
            gemCells.value.splice(index, 1);
          });

        // Update statistics
        totalLinesCleared.value += clearResult.clearedRows.length + clearResult.clearedCols.length;
        totalBoxesCleared.value += clearResult.clearedBoxes.length;

        // Count as combo and increase score multiplier if multiple clears
        if (clearResult.totalClears > 1) {
          totalCombos.value++;
          // Increase score multiplier by 2% per combo (0.02)
          scoreMultiplier.value += 0.02;
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
    if (!lastMove.value) return false;

    // In free-play mode, consume a gem instead of ability uses
    if (gameMode.value === 'free-play') {
      if (totalGemsCollected.value <= 0) return false;
      totalGemsCollected.value--;
    } else {
      // In archipelago mode, use ability uses
      if (undoUses.value <= 0) return false;
      undoUses.value--;
    }

    grid.value = lastMove.value.grid;
    currentPieces.value = lastMove.value.pieces;
    totalScore.value = lastMove.value.totalScore;
    lastMove.value = null;
    isGameOver.value = false;

    return true;
  }

  // Remove a single block from the grid
  function removeBlock(row: number, col: number): boolean {
    if (grid.value[row]?.[col] === 0) {
      return false;
    }

    // In free-play mode, consume a gem instead of ability uses
    if (gameMode.value === 'free-play') {
      if (totalGemsCollected.value <= 0) return false;
      totalGemsCollected.value--;
    } else {
      // In archipelago mode, use ability uses
      if (removeBlockUses.value <= 0) return false;
      removeBlockUses.value--;
    }

    grid.value = grid.value.map((r, rIdx) => r.map((cell, cIdx) => (rIdx === row && cIdx === col ? 0 : cell)));

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

  // Set grid size (user preference - requires new game to take effect)
  function setGridSize(size: number) {
    if (size !== gridSize.value) {
      resetStats();
      gridSize.value = size;
      applyGridSize();
      initGame();
    }
  }

  // Apply the grid size (called when starting a new game)
  function applyGridSize() {
    const size = gridSize.value;
    grid.value = makeGrid(size, size);
  }

  // Add abilities
  function addUndoAbility() {
    undoUses.value++;
  }

  function addRemoveBlock() {
    removeBlockUses.value++;
  }

  function addRotateAbility() {
    rotateUses.value++;
  }

  function addHoldAbility() {
    holdUses.value++;
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

  // Hold piece functionality
  function holdPiece(piece: Piece): boolean {
    // In free-play mode, consume a gem instead of ability uses
    if (gameMode.value === 'free-play') {
      if (totalGemsCollected.value <= 0) return false;
      totalGemsCollected.value--;
    } else {
      // In archipelago mode, use ability uses
      if (holdUses.value <= 0) return false;
      holdUses.value--;
    }

    // Swap the piece with the held piece
    const temp = heldPiece.value;
    heldPiece.value = piece;

    // Remove piece from current pieces
    const index = currentPieces.value.findIndex((p) => p === piece || p.id === piece.id);
    if (index > -1) {
      currentPieces.value = currentPieces.value.filter((_, i) => i !== index);
    }

    // If there was a held piece, add it back to current pieces
    if (temp) {
      currentPieces.value = [...currentPieces.value, temp];
    }

    return true;
  }

  // Rotate a piece 90 degrees clockwise
  function rotatePiece(piece: Piece) {
    // In free-play mode, consume a gem instead of ability uses
    if (gameMode.value === 'free-play') {
      if (totalGemsCollected.value <= 0) return;
      totalGemsCollected.value--;
    } else {
      // In archipelago mode, use ability uses
      if (rotateUses.value <= 0) return;
      rotateUses.value--;
    }

    const rotatedPiece = applyRotation(piece);

    // Update the piece in currentPieces
    const index = currentPieces.value.findIndex((p) => p.id === piece.id);
    if (index !== -1) {
      currentPieces.value = [...currentPieces.value.slice(0, index), rotatedPiece, ...currentPieces.value.slice(index + 1)];
    }

    // Update held piece if it's the one being rotated
    if (heldPiece.value?.id === piece.id) {
      heldPiece.value = rotatedPiece;
    }
  }

  // Watch for grid size changes
  watch(gridSize, () => {
    if (grid.value.length !== gridSize.value) {
      initGame();
    }
  });

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
    gemCells,

    // Mode
    gameMode,

    // Statistics
    totalLinesCleared,
    totalBoxesCleared,
    totalCombos,
    totalPiecesPlaced,
    totalGemsCollected,

    // Abilities
    rotateUses,
    undoUses,
    removeBlockUses,
    holdUses,
    heldPiece,
    scoreMultiplier,
    maxPieceSlots,

    // Actions
    initGame,
    resetStats,
    tryPlacePiece,
    undo,
    removeBlock,
    holdPiece,
    rotatePiece,
    spawnGem,
    checkMilestones,

    // Archipelago unlocks
    unlockPiece,
    setGridSize,
    getCollectedGemChecks,
    addUndoAbility,
    addRemoveBlock,
    addRotateAbility,
    addHoldAbility,
    addScoreMultiplier,
    addPieceSlot,
    unlockedPieceIds,
  };
}
