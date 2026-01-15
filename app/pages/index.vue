<script setup lang="ts">
  import { computed, watch } from 'vue';
  import BlockudokuBoard from '~/components/BlockudokuBoard.vue';
  import { useBlockudoku } from '~/composables/useBlockudoku';
  import { useArchipelagoItems } from '~/composables/useArchipelagoItems';
  import { useArchipelago } from '~/composables/useArchipelago';

  const {
    grid,
    gridSize,
    score,
    totalScore,
    currentPieces,
    isGameOver,
    totalLinesCleared,
    totalBoxesCleared,
    totalCombos,
    totalPiecesPlaced,
    canRotate,
    canUndo,
    rotateUses,
    undoUses,
    removeBlockUses,
    hintUses,
    scoreMultiplier,
    initGame,
    tryPlacePiece,
    undo,
    removeBlock,
    checkMilestones,
    unlockPiece,
    unlockGridSize,
    addRotateAbility,
    addUndoAbility,
    addRemoveBlock,
    addScoreMultiplier,
    addPieceSlot,
  } = useBlockudoku();

  const { archipelagoMode, checkLocation, AP_ITEMS, ITEM_NAME_TO_ID } = useArchipelagoItems();

  const { host, port, slot, password, useSecureConnection, status, connect, disconnect, items } = useArchipelago();

  // Handle incoming Archipelago items
  watch(
    () => items.value,
    (newItems, oldItems) => {
      if (!newItems || !oldItems) return;

      // Find newly received items
      const oldCount = oldItems.length;
      const newCount = newItems.length;

      if (newCount > oldCount) {
        for (let i = oldCount; i < newCount; i++) {
          const item = newItems[i];
          if (!item) continue;

          // Handle the item based on its ID or name
          const itemId = typeof item === 'number' ? item : ITEM_NAME_TO_ID[item.name];

          switch (itemId) {
            // Piece unlocks
            case AP_ITEMS.SINGLE_BLOCK:
            case AP_ITEMS.DOMINO_I:
            case AP_ITEMS.TROMINO_I:
            case AP_ITEMS.TROMINO_L:
            case AP_ITEMS.TETROMINO_I:
            case AP_ITEMS.TETROMINO_O:
            case AP_ITEMS.TETROMINO_T:
            case AP_ITEMS.TETROMINO_L:
            case AP_ITEMS.TETROMINO_S:
            case AP_ITEMS.PENTOMINO_I:
            case AP_ITEMS.PENTOMINO_L:
            case AP_ITEMS.PENTOMINO_P:
            case AP_ITEMS.PENTOMINO_U:
            case AP_ITEMS.PENTOMINO_W:
            case AP_ITEMS.PENTOMINO_PLUS:
            case AP_ITEMS.BLOCK_3X3:
            case AP_ITEMS.CORNER_3X3:
            case AP_ITEMS.T_SHAPE_3X3:
            case AP_ITEMS.CROSS_3X3:
              unlockPiece(item.name);
              break;

            // Grid unlocks
            case AP_ITEMS.GRID_6X6:
              unlockGridSize(6);
              break;
            case AP_ITEMS.GRID_7X7:
              unlockGridSize(7);
              break;
            case AP_ITEMS.GRID_9X9:
              unlockGridSize(9);
              break;

            // Piece slots
            case AP_ITEMS.PIECE_SLOT_4:
            case AP_ITEMS.PIECE_SLOT_5:
              addPieceSlot();
              break;

            // Abilities
            case AP_ITEMS.ROTATE_ABILITY:
              addRotateAbility();
              break;
            case AP_ITEMS.UNDO_ABILITY:
              addUndoAbility();
              break;
            case AP_ITEMS.REMOVE_BLOCK:
              addRemoveBlock();
              break;
            case AP_ITEMS.PLACEMENT_HINT:
              addHint();
              break;

            // Score multipliers
            case AP_ITEMS.SCORE_MULT_10:
              addScoreMultiplier(0.1);
              break;
            case AP_ITEMS.SCORE_MULT_25:
              addScoreMultiplier(0.25);
              break;
            case AP_ITEMS.SCORE_MULT_50:
              addScoreMultiplier(0.5);
              break;
          }
        }
      }
    },
    { deep: true },
  );

  // Watch for milestone achievements and send checks
  watch([totalScore, totalLinesCleared, totalBoxesCleared, totalCombos, totalPiecesPlaced], () => {
    if (!archipelagoMode.value) return;

    const locationIds = checkMilestones();
    for (const locationId of locationIds) {
      if (checkLocation(locationId)) {
        // Send to AP server (handled by useArchipelago)
        console.log(`Sending check for location ${locationId}`);
      }
    }
  });

  function handlePlacePiece(piece: any, row: number, col: number) {
    tryPlacePiece(piece, row, col);
  }

  function handleNewGame() {
    initGame();
  }

  // Initialize game on mount
  initGame();
</script>

<template>
  <div class="min-h-screen bg-gray-900 text-white">
    <div class="container mx-auto px-4 py-8">
      <h1 class="text-4xl font-bold text-center mb-2">Blockupelago</h1>
      <p class="text-center text-gray-400 mb-8">Place pieces to fill rows, columns, and 3x3 boxes!</p>

      <!-- Archipelago Connection Panel -->
      <div v-if="archipelagoMode" class="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 class="text-xl font-bold mb-4">Archipelago Connection</h2>

        <div v-if="status === 'disconnected'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm mb-1">Host</label>
              <input v-model="host" type="text" class="w-full px-3 py-2 bg-gray-700 rounded" placeholder="archipelago.gg" />
            </div>
            <div>
              <label class="block text-sm mb-1">Port</label>
              <input v-model.number="port" type="number" class="w-full px-3 py-2 bg-gray-700 rounded" placeholder="38281" />
            </div>
            <div>
              <label class="block text-sm mb-1">Slot Name</label>
              <input v-model="slot" type="text" class="w-full px-3 py-2 bg-gray-700 rounded" placeholder="Player1" />
            </div>
            <div>
              <label class="block text-sm mb-1">Password</label>
              <input v-model="password" type="password" class="w-full px-3 py-2 bg-gray-700 rounded" placeholder="(optional)" />
            </div>
          </div>

          <button @click="connect" class="px-6 py-2 bg-green-600 hover:bg-green-700 rounded font-bold">Connect to Archipelago</button>
        </div>

        <div v-else class="flex items-center justify-between">
          <div>
            <span class="text-green-400 font-bold">● Connected</span>
            <span class="text-gray-400 ml-2">{{ slot }} @ {{ host }}:{{ port }}</span>
          </div>
          <button @click="disconnect" class="px-4 py-2 bg-red-600 hover:bg-red-700 rounded">Disconnect</button>
        </div>
      </div>

      <!-- Stats Panel -->
      <div class="mb-8 p-4 bg-gray-800 rounded-lg">
        <h2 class="text-xl font-bold mb-4">Statistics</h2>
        <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
          <div>
            <div class="text-2xl font-bold text-blue-400">{{ totalScore.toLocaleString() }}</div>
            <div class="text-sm text-gray-400">Total Score</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-green-400">{{ totalLinesCleared }}</div>
            <div class="text-sm text-gray-400">Lines Cleared</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-purple-400">{{ totalBoxesCleared }}</div>
            <div class="text-sm text-gray-400">Boxes Cleared</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-yellow-400">{{ totalCombos }}</div>
            <div class="text-sm text-gray-400">Combos</div>
          </div>
          <div>
            <div class="text-2xl font-bold text-orange-400">{{ totalPiecesPlaced }}</div>
            <div class="text-sm text-gray-400">Pieces Placed</div>
          </div>
        </div>
      </div>

      <!-- Game Board -->
      <BlockudokuBoard
        :grid="grid"
        :grid-size="gridSize"
        :current-pieces="currentPieces"
        :is-game-over="isGameOver"
        :score="score"
        :can-undo="canUndo"
        :undo-uses="undoUses"
        :remove-block-uses="removeBlockUses"
        :hint-uses="hintUses"
        :score-multiplier="scoreMultiplier"
        @place-piece="handlePlacePiece"
        @undo="undo"
        @remove-block="removeBlock"
        @new-game="handleNewGame"
      />
    </div>
  </div>
</template>
