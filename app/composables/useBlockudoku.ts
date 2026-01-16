import { ref, computed, watch } from 'vue';
import {
  ALL_PIECES,
  STARTER_PIECE_IDS,
  makeGrid,
  canPlacePiece,
  placePiece,
  clearCompleted,
  calculateScore,
  canPlaceAnyPiece,
  generatePieces,
  rotatePiece,
  mirrorPiece,
  shrinkPiece,
} from '~/utils/blockudoku';
import type { GameMode, GameStateSnapshot, BlockGrid, Piece } from '~/utils/types';
import {
  DEFAULT_GRID_SIZE,
  DEFAULT_PIECE_SLOTS,
  DEFAULT_SCORE_MULTIPLIER,
  COMBO_MULTIPLIER_INCREMENT,
  DEFAULT_GEM_SPAWN_RATIO,
  GEM_CHECK_ID_BASE,
  DEFAULT_PIECE_SIZE_RATIO,
  CLEAR_ANIMATION_DELAY_MS,
  MAX_PIECE_SLOTS,
} from '~/utils/constants';
import { consumeAbility } from '~/utils/abilities';
import { usePersistentRef, clearAllPersistence } from './usePersistence';
import {
  getScoreLocationId,
  getLineClearLocationId,
  getBoxClearLocationId,
  getPieceLocationId,
  getGemLocationId,
  MAX_GEM_CHECKS,
} from './useArchipelagoItems';

export function useBlockudoku() {
  // Game mode
  const gameMode = usePersistentRef<GameMode>('blockudoku_game_mode', 'free-play');

  // Game state
  const gridSize = usePersistentRef('blockudoku_grid_size', DEFAULT_GRID_SIZE);
  const grid = usePersistentRef<BlockGrid>('blockudoku_grid', makeGrid(DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE));
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
  const gemSpawnRatio = usePersistentRef('blockudoku_gem_spawn_ratio', DEFAULT_GEM_SPAWN_RATIO);
  const nextGemCheckId = ref(GEM_CHECK_ID_BASE);

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
    unlockedPieceIds.value = [...STARTER_PIECE_IDS];
  }

  // Free-play settings
  const pieceSizeRatio = usePersistentRef('blockudoku_piece_size_ratio', DEFAULT_PIECE_SIZE_RATIO);
  const disabledShapeIds = usePersistentRef<string[]>('blockudoku_disabled_shapes', []);
  const freeRotate = usePersistentRef('blockudoku_free_rotate', false);
  const freeUndo = usePersistentRef('blockudoku_free_undo', false);
  const freeRemove = usePersistentRef('blockudoku_free_remove', false);
  const freeHold = usePersistentRef('blockudoku_free_hold', false);
  const freeMirror = usePersistentRef('blockudoku_free_mirror', false);
  const freeShrink = usePersistentRef('blockudoku_free_shrink', false);

  // Abilities
  const rotateUses = usePersistentRef('blockudoku_rotate_uses', 0);
  const undoUses = usePersistentRef('blockudoku_undo_uses', 0);
  const removeBlockUses = usePersistentRef('blockudoku_remove_uses', 0);
  const holdUses = usePersistentRef('blockudoku_hold_uses', 0);
  const mirrorUses = usePersistentRef('blockudoku_mirror_uses', 0);
  const shrinkUses = usePersistentRef('blockudoku_shrink_uses', 0);
  const heldPiece = usePersistentRef<Piece | null>('blockudoku_held_piece', null);

  // Score multiplier (from AP items)
  const scoreMultiplier = usePersistentRef('blockudoku_score_multiplier', DEFAULT_SCORE_MULTIPLIER);
  const baseMultiplier = usePersistentRef('blockudoku_base_multiplier', DEFAULT_SCORE_MULTIPLIER);

  // Piece slots
  const maxPieceSlots = usePersistentRef('blockudoku_max_pieces', DEFAULT_PIECE_SLOTS);
  const currentPieces = usePersistentRef<Piece[]>('blockudoku_current_pieces', []);

  // Game state
  const isGameOver = ref(false);
  const lastMove = ref<GameStateSnapshot | null>(null);

  // Available pieces based on what's unlocked
  const availablePieces = computed(() => {
    // In free-play mode, all pieces are available (minus disabled ones)
    if (gameMode.value === 'free-play') {
      return ALL_PIECES.filter((p) => !disabledShapeIds.value.includes(p.id));
    }
    // In archipelago mode, only unlocked pieces are available
    return ALL_PIECES.filter((p) => unlockedPieceIds.value.includes(p.id));
  });

  // Check if game is over (no valid placements and no helpful abilities)
  function checkGameOver(): boolean {
    if (currentPieces.value.length === 0) {
      return false; // Will generate new pieces
    }

    // If any piece can be placed, game continues
    if (canPlaceAnyPiece(grid.value, currentPieces.value)) {
      return false;
    }

    // Check if player has abilities that could help
    const hasUndo = gameMode.value === 'free-play' ? totalGemsCollected.value > 0 : undoUses.value > 0 && lastMove.value !== null;
    const hasRotate = gameMode.value === 'free-play' ? totalGemsCollected.value > 0 : rotateUses.value > 0;
    const hasRemove = gameMode.value === 'free-play' ? totalGemsCollected.value > 0 : removeBlockUses.value > 0;

    // If player has undo, they can always go back
    if (hasUndo) {
      return false;
    }

    // If player has rotate, check if rotating any piece would help
    if (hasRotate) {
      for (const piece of currentPieces.value) {
        const rotatedPiece = rotatePiece(piece);
        if (canPlaceAnyPiece(grid.value, [rotatedPiece])) {
          return false; // A rotation would make placement possible
        }
      }
    }

    // If player has remove block, there's a chance they could make space
    if (hasRemove) {
      return false;
    }

    // No valid moves and no helpful abilities
    return true;
  }

  // Check if game is potentially over (pieces can't be placed as-is, but abilities might help)
  const isPotentialGameOver = computed(() => {
    if (currentPieces.value.length === 0 || isGameOver.value) {
      return false;
    }
    return !canPlaceAnyPiece(grid.value, currentPieces.value);
  });

  // Generate new pieces
  function generateNewPieces() {
    if (availablePieces.value.length === 0) {
      console.error('No pieces unlocked!');
      return;
    }
    // Use size ratio for weighted piece selection
    let pieces = generatePieces(availablePieces.value, maxPieceSlots.value, pieceSizeRatio.value);

    // Apply random rotation and mirror to each piece
    pieces = pieces.map((piece) => {
      const rotations = Math.floor(Math.random() * 4); // 0-3 rotations
      let transformedPiece = piece;
      for (let i = 0; i < rotations; i++) {
        transformedPiece = rotatePiece(transformedPiece);
      }

      // Random 50% chance to mirror the piece
      if (Math.random() < 0.5) {
        transformedPiece = mirrorPiece(transformedPiece);
      }

      return transformedPiece;
    });

    currentPieces.value = pieces;

    // Random chance to spawn a gem on the grid
    if (Math.random() < gemSpawnRatio.value) {
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
    // Store received items before reset
    const { receivedItems } = useArchipelagoItems();
    const itemsToReapply = gameMode.value === 'archipelago' ? [...receivedItems.value] : [];

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
      mirrorUses.value = 0;
      scoreMultiplier.value = 1.0;
      baseMultiplier.value = 1.0;
      maxPieceSlots.value = 3;
      // All pieces are available in free-play, no need to set unlockedPieceIds
      unlockedPieceIds.value = [];
    } else {
      // Archipelago mode: reset stats but keep items
      // Combo bonus resets to 0
      scoreMultiplier.value = baseMultiplier.value;

      // Reset to fixed starter pieces (for archipelago mode)
      unlockedPieceIds.value = [...STARTER_PIECE_IDS];

      // Reapply all received Archipelago items
      reapplyArchipelagoItems(itemsToReapply);
    }

    gridSize.value = 9;
  }

  // Reset ALL progress - clears all persistence including Archipelago data
  function resetAllProgress() {
    // Clear all localStorage data
    clearAllPersistence();

    // Reinitialize to defaults (will be saved to localStorage automatically)
    totalScore.value = 0;
    totalLinesCleared.value = 0;
    totalBoxesCleared.value = 0;
    totalCombos.value = 0;
    totalPiecesPlaced.value = 0;
    totalGemsCollected.value = 0;
    heldPiece.value = null;
    gemCells.value = [];
    rotateUses.value = 0;
    undoUses.value = 0;
    removeBlockUses.value = 0;
    holdUses.value = 0;
    scoreMultiplier.value = 1.0;
    baseMultiplier.value = 1.0;
    maxPieceSlots.value = 3;
    unlockedPieceIds.value = [];
    gridSize.value = 9;
    gameMode.value = 'free-play';

    // Reinitialize game
    initGame();
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

    // Remove the piece from current pieces (find by exact reference only)
    const index = currentPieces.value.findIndex((p) => p === piece);
    if (index > -1) {
      currentPieces.value = currentPieces.value.filter((_, i) => i !== index);
    }

    // Also clear from held piece if it matches (by reference)
    if (heldPiece.value === piece) {
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
          // Increase score multiplier by combo increment on top of base
          scoreMultiplier.value = baseMultiplier.value + totalCombos.value * COMBO_MULTIPLIER_INCREMENT;
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

    if (!consumeAbility(gameMode.value, freeUndo.value, undoUses, totalGemsCollected)) {
      return false;
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

    if (!consumeAbility(gameMode.value, freeRemove.value, removeBlockUses, totalGemsCollected)) {
      return false;
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

  // Reapply all received Archipelago items (to persist through new games)
  function reapplyArchipelagoItems(receivedItemIds: number[]) {
    if (gameMode.value !== 'archipelago' || !receivedItemIds || receivedItemIds.length === 0) {
      return;
    }

    console.log('[Blockudoku] Reapplying', receivedItemIds.length, 'Archipelago items after reset');

    // Import item IDs
    const { AP_ITEMS } = useArchipelagoItems();

    // Count how many of each item type we have
    const itemCounts = new Map<number, number>();
    for (const itemId of receivedItemIds) {
      itemCounts.set(itemId, (itemCounts.get(itemId) || 0) + 1);
    }

    // Apply piece unlocks (pieces are unique, no duplicates)
    const pieceUnlocks = [
      { id: AP_ITEMS.SINGLE_BLOCK, name: 'Single Block' },
      { id: AP_ITEMS.DOMINO_I, name: 'Domino I' },
      { id: AP_ITEMS.TROMINO_I, name: 'Tromino I' },
      { id: AP_ITEMS.TROMINO_L, name: 'Tromino L' },
      { id: AP_ITEMS.TETROMINO_I, name: 'Tetromino I' },
      { id: AP_ITEMS.TETROMINO_O, name: 'Tetromino O' },
      { id: AP_ITEMS.TETROMINO_T, name: 'Tetromino T' },
      { id: AP_ITEMS.TETROMINO_L, name: 'Tetromino L' },
      { id: AP_ITEMS.TETROMINO_S, name: 'Tetromino S' },
      { id: AP_ITEMS.PENTOMINO_I, name: 'Pentomino I' },
      { id: AP_ITEMS.PENTOMINO_L, name: 'Pentomino L' },
      { id: AP_ITEMS.PENTOMINO_P, name: 'Pentomino P' },
      { id: AP_ITEMS.PENTOMINO_U, name: 'Pentomino U' },
      { id: AP_ITEMS.PENTOMINO_W, name: 'Pentomino W' },
      { id: AP_ITEMS.PENTOMINO_PLUS, name: 'Pentomino Plus' },
      { id: AP_ITEMS.CORNER_3X3, name: '3x3 Corner' },
      { id: AP_ITEMS.T_SHAPE_3X3, name: '3x3 T-Shape' },
      { id: AP_ITEMS.CROSS_3X3, name: '3x3 Cross' },
    ];

    for (const { id, name } of pieceUnlocks) {
      if (itemCounts.has(id)) {
        unlockPiece(name);
      }
    }

    // Apply piece slots (count how many we should have)
    const slot4Count = itemCounts.get(AP_ITEMS.PIECE_SLOT_4) || 0;
    const slot5Count = itemCounts.get(AP_ITEMS.PIECE_SLOT_5) || 0;
    const totalExtraSlots = slot4Count + slot5Count;
    maxPieceSlots.value = Math.min(3 + totalExtraSlots, 5); // Base 3, max 5

    // Apply abilities (set to count, not increment)
    rotateUses.value = itemCounts.get(AP_ITEMS.ROTATE_ABILITY) || 0;
    undoUses.value = itemCounts.get(AP_ITEMS.UNDO_ABILITY) || 0;
    removeBlockUses.value = itemCounts.get(AP_ITEMS.REMOVE_BLOCK) || 0;
    holdUses.value = itemCounts.get(AP_ITEMS.HOLD_ABILITY) || 0;
    mirrorUses.value = itemCounts.get(AP_ITEMS.MIRROR_ABILITY) || 0;
    shrinkUses.value = itemCounts.get(AP_ITEMS.SHRINK_ABILITY) || 0;

    // Apply score multipliers (set to total, not increment)
    const mult10Count = itemCounts.get(AP_ITEMS.SCORE_MULT_10) || 0;
    const mult25Count = itemCounts.get(AP_ITEMS.SCORE_MULT_25) || 0;
    const mult50Count = itemCounts.get(AP_ITEMS.SCORE_MULT_50) || 0;
    const calculatedBase = 1.0 + mult10Count * 0.1 + mult25Count * 0.25 + mult50Count * 0.5;

    // Set both base and current multiplier
    baseMultiplier.value = calculatedBase;
    scoreMultiplier.value = calculatedBase; // Reset to base (no combo bonus yet)

    console.log('[Blockudoku] Reapplied items. Pieces:', unlockedPieceIds.value.length, 'Abilities:', {
      rotate: rotateUses.value,
      undo: undoUses.value,
      remove: removeBlockUses.value,
      hold: holdUses.value,
      mirror: mirrorUses.value,
      shrink: shrinkUses.value,
      multiplier: scoreMultiplier.value,
      slots: maxPieceSlots.value,
    });
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

  function addMirrorAbility() {
    mirrorUses.value++;
  }

  function addShrinkAbility() {
    shrinkUses.value++;
  }

  function addScoreMultiplier(amount: number) {
    baseMultiplier.value += amount;
    scoreMultiplier.value = baseMultiplier.value + totalCombos.value * COMBO_MULTIPLIER_INCREMENT;
  }

  function addPieceSlot() {
    if (maxPieceSlots.value < MAX_PIECE_SLOTS) {
      maxPieceSlots.value++;
      // Add one more piece if currently playing
      if (currentPieces.value.length > 0 && currentPieces.value.length < maxPieceSlots.value) {
        currentPieces.value = [...currentPieces.value, ...generatePieces(availablePieces.value, 1)];
      }
    }
  }

  // Hold piece functionality
  function holdPiece(piece: Piece): boolean {
    if (!consumeAbility(gameMode.value, freeHold.value, holdUses, totalGemsCollected)) {
      return false;
    }

    // Swap the piece with the held piece
    const temp = heldPiece.value;
    heldPiece.value = piece;

    // Remove piece from current pieces (by exact reference)
    const index = currentPieces.value.findIndex((p) => p === piece);
    if (index > -1) {
      currentPieces.value = currentPieces.value.filter((_, i) => i !== index);
    }

    // If there was a held piece, add it back to current pieces
    if (temp) {
      currentPieces.value = [...currentPieces.value, temp];
    }

    // Generate new pieces if all pieces are gone (after swap)
    if (currentPieces.value.length === 0) {
      generateNewPieces();
    }

    return true;
  }

  // Rotate a piece 90 degrees clockwise
  function rotatePieceInGame(piece: Piece) {
    // Only charge for the first rotation of this piece
    if (!piece.hasBeenRotated) {
      if (!consumeAbility(gameMode.value, freeRotate.value, rotateUses, totalGemsCollected)) {
        return;
      }
    }

    const rotatedPiece = rotatePiece(piece);

    // Update the piece in currentPieces (by reference)
    const index = currentPieces.value.findIndex((p) => p === piece);
    if (index !== -1) {
      currentPieces.value = [...currentPieces.value.slice(0, index), rotatedPiece, ...currentPieces.value.slice(index + 1)];
    }

    // Update held piece if it's the one being rotated
    if (heldPiece.value === piece) {
      heldPiece.value = rotatedPiece;
    }
  }

  // Mirror/flip a piece horizontally
  function mirrorPieceInGame(piece: Piece) {
    // Only charge for the first mirror of this piece
    if (!piece.hasBeenMirrored) {
      if (!consumeAbility(gameMode.value, freeMirror.value, mirrorUses, totalGemsCollected)) {
        return;
      }
    }

    const mirroredPiece = mirrorPiece(piece);

    // Update the piece in currentPieces (by reference)
    const index = currentPieces.value.findIndex((p) => p === piece);
    if (index !== -1) {
      currentPieces.value = [...currentPieces.value.slice(0, index), mirroredPiece, ...currentPieces.value.slice(index + 1)];
    }

    // Update held piece if it's the one being mirrored
    if (heldPiece.value === piece) {
      heldPiece.value = mirroredPiece;
    }
  }

  // Shrink a piece to a single block
  function shrinkPieceInGame(piece: Piece) {
    if (!consumeAbility(gameMode.value, freeShrink.value, shrinkUses, totalGemsCollected)) {
      return;
    }

    // Find the single block piece
    const singleBlockPiece = ALL_PIECES.find((p) => p.id === 'single');
    if (!singleBlockPiece) return;

    // Create a new single block piece with the original piece's color
    const shrunkPiece: Piece = {
      ...singleBlockPiece,
      color: piece.color,
    };

    // Update the piece in currentPieces (by reference)
    const index = currentPieces.value.findIndex((p) => p === piece);
    if (index !== -1) {
      currentPieces.value = [...currentPieces.value.slice(0, index), shrunkPiece, ...currentPieces.value.slice(index + 1)];
    }

    // Update held piece if it's the one being shrunk
    if (heldPiece.value === piece) {
      heldPiece.value = shrunkPiece;
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
    isPotentialGameOver,
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
    mirrorUses,
    shrinkUses,
    heldPiece,
    scoreMultiplier,
    baseMultiplier,
    maxPieceSlots,

    // Free-play settings
    pieceSizeRatio,
    disabledShapeIds,
    gemSpawnRatio,
    freeRotate,
    freeUndo,
    freeRemove,
    freeHold,
    freeMirror,
    freeShrink,

    // Actions
    initGame,
    resetStats,
    resetAllProgress,
    tryPlacePiece,
    undo,
    removeBlock,
    holdPiece,
    rotatePiece: rotatePieceInGame,
    mirrorPiece: mirrorPieceInGame,
    shrinkPiece: shrinkPieceInGame,
    spawnGem,
    checkMilestones,

    // Archipelago unlocks
    unlockPiece,
    reapplyArchipelagoItems,
    setGridSize,
    getCollectedGemChecks,
    addUndoAbility,
    addRemoveBlock,
    addRotateAbility,
    addHoldAbility,
    addMirrorAbility,
    addShrinkAbility,
    addScoreMultiplier,
    addPieceSlot,
    unlockedPieceIds,
  };
}
