<script setup lang="ts">
  import { computed, watch, ref } from 'vue';
  import BlockudokuBoard from '~/components/BlockudokuBoard.vue';
  import ThemePicker from '~/components/ThemePicker.vue';
  import { useBlockudoku } from '~/composables/useBlockudoku';
  import { useArchipelagoItems } from '~/composables/useArchipelagoItems';
  import { useArchipelago } from '~/composables/useArchipelago';

  // Tab management
  type TabType = 'archipelago' | 'settings' | 'shop' | 'debug';
  const activeTab = ref<TabType>('archipelago');

  const {
    grid,
    gridSize,
    score,
    totalScore,
    currentPieces,
    isGameOver,
    clearingCells,
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
    resetStats,
    tryPlacePiece,
    undo,
    removeBlock,
    checkMilestones,
    unlockPiece,
    unlockGridSize,
    addRotateAbility,
    addUndoAbility,
    addRemoveBlock,
    addHint,
    addScoreMultiplier,
    addPieceSlot,
  } = useBlockudoku();

  const { archipelagoMode, checkLocation, AP_ITEMS, ITEM_NAME_TO_ID } = useArchipelagoItems();

  const { host, port, slot, password, useSecureConnection, status, connect, disconnect, items, lastMessage } = useArchipelago();

  // Status indicator
  const statusMeta = computed(() => {
    switch (status.value) {
      case 'connected':
        return { label: 'Connected', dot: 'bg-lime-400', text: 'text-lime-300' };
      case 'connecting':
        return { label: 'Connecting…', dot: 'bg-amber-400', text: 'text-amber-300' };
      case 'error':
        return { label: 'Error', dot: 'bg-red-400', text: 'text-red-300' };
      default:
        return { label: 'Disconnected', dot: 'bg-neutral-500', text: 'text-neutral-300' };
    }
  });

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
    resetStats();
    initGame();
  }

  // Initialize game on mount
  initGame();
</script>

<template>
  <div class="h-screen bg-neutral-950 text-neutral-100 flex flex-col overflow-hidden">
    <!-- Main Container -->
    <div class="flex flex-1 min-h-0 overflow-hidden">
      <!-- LEFT: Main Game Area -->
      <div class="flex-1 px-6 py-4 overflow-y-auto">
        <!-- Header -->

        <!-- Stats Panel -->
        <div class="mb-6 p-4 bg-neutral-800/30 rounded-lg border border-neutral-700">
          <div class="flex items-center justify-between mb-2">
            <h2 class="text-lg font-semibold">Blockupelago</h2>
            <ThemePicker />
          </div>
          <div class="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
            <div>
              <div class="text-2xl font-bold text-blue-400">{{ totalScore.toLocaleString() }}</div>
              <div class="text-sm text-neutral-400">Total Score</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-green-400">{{ totalLinesCleared }}</div>
              <div class="text-sm text-neutral-400">Lines</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-purple-400">{{ totalBoxesCleared }}</div>
              <div class="text-sm text-neutral-400">Boxes</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-yellow-400">{{ totalCombos }}</div>
              <div class="text-sm text-neutral-400">Combos</div>
            </div>
            <div>
              <div class="text-2xl font-bold text-orange-400">{{ totalPiecesPlaced }}</div>
              <div class="text-sm text-neutral-400">Pieces</div>
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
          :clearing-cells="clearingCells"
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

      <!-- RIGHT: Sidebar with Tabs -->
      <div class="w-1/3 shrink-0 bg-neutral-900/95 backdrop-blur-lg border-l border-neutral-700 flex flex-col min-h-0">
        <!-- Tab Bar -->
        <div class="flex border-b border-neutral-700/50 shrink-0 overflow-x-auto">
          <button class="tab-button" :class="{ active: activeTab === 'archipelago' }" @click="activeTab = 'archipelago'">Archipelago</button>
          <button class="tab-button" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">Settings</button>
          <button class="tab-button" :class="{ active: activeTab === 'shop' }" @click="activeTab = 'shop'">Shop</button>
          <button class="tab-button" :class="{ active: activeTab === 'debug' }" @click="activeTab = 'debug'">Debug</button>
        </div>

        <!-- Tab Content -->
        <div class="p-4 flex-1 overflow-y-auto min-h-0">
          <!-- ARCHIPELAGO TAB -->
          <div v-if="activeTab === 'archipelago'" class="space-y-6">
            <div>
              <h2 class="font-semibold text-neutral-100 mb-1">Archipelago Connection</h2>
              <p class="text-xs text-neutral-400">Connect to multiplayer server</p>
            </div>

            <div class="bg-neutral-800/30 rounded-sm p-4 space-y-4">
              <p class="text-xs text-neutral-400">Enter your server details</p>

              <div class="space-y-3">
                <div class="space-y-1">
                  <label class="text-xs font-medium text-neutral-300">Host</label>
                  <input v-model="host" class="input-field" placeholder="archipelago.gg" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-medium text-neutral-300">Port</label>
                  <input v-model.number="port" class="input-field" placeholder="38281" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-medium text-neutral-300">Player Name</label>
                  <input v-model="slot" class="input-field" placeholder="Your player name" />
                </div>
                <div class="space-y-1">
                  <label class="text-xs font-medium text-neutral-300">Password</label>
                  <input v-model="password" type="password" class="input-field" placeholder="Optional password" />
                </div>
                <div class="flex items-center gap-3 pt-2">
                  <input type="checkbox" v-model="useSecureConnection" class="checkbox-field" id="secure-connection" />
                  <label for="secure-connection" class="text-xs text-neutral-300 cursor-pointer">
                    Use secure connection
                    <span class="text-neutral-500 text-2xs ml-1">(uncheck for local servers)</span>
                  </label>
                </div>
              </div>

              <div class="flex gap-3 pt-2">
                <button class="btn-primary flex-1" @click="connect()" :disabled="status === 'connected' || status === 'connecting'">
                  {{ status === 'connecting' ? 'Connecting…' : 'Connect' }}
                </button>
                <button class="btn-secondary" @click="disconnect()" :disabled="status !== 'connected'">Disconnect</button>
              </div>

              <div v-if="lastMessage" class="mt-4 p-3 bg-neutral-900/50 rounded-lg border border-neutral-600">
                <div class="text-xs text-neutral-300">
                  {{ lastMessage }}
                </div>
              </div>
            </div>
          </div>

          <!-- SETTINGS TAB -->
          <div v-else-if="activeTab === 'settings'" class="space-y-6">
            <div>
              <h2 class="font-semibold text-neutral-100 mb-1">Game Settings</h2>
              <p class="text-xs text-neutral-400">Customize your gameplay</p>
            </div>

            <section class="space-y-4">
              <h3 class="section-heading">Game Info</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-3">
                <div class="flex items-center justify-between">
                  <span class="text-sm text-neutral-300">Grid Size</span>
                  <span class="text-sm font-bold text-blue-400">{{ gridSize }}x{{ gridSize }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-neutral-300">Score Multiplier</span>
                  <span class="text-sm font-bold text-yellow-400">{{ scoreMultiplier.toFixed(2) }}x</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-neutral-300">Available Piece Slots</span>
                  <span class="text-sm font-bold text-purple-400">{{ currentPieces.length }}</span>
                </div>
              </div>
            </section>
          </div>

          <!-- SHOP TAB -->
          <div v-else-if="activeTab === 'shop'" class="space-y-6">
            <div>
              <h2 class="font-semibold text-neutral-100 mb-1">Shop & Abilities</h2>
              <p class="text-xs text-neutral-400">Use your unlocked abilities</p>
            </div>

            <section class="space-y-3">
              <h3 class="section-heading">Available Abilities</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-3">
                <button
                  class="w-full px-4 py-3 rounded text-sm font-medium transition-colors flex items-center justify-between"
                  :class="
                    canUndo && undoUses > 0
                      ? 'bg-blue-500/20 text-blue-300 hover:bg-blue-500/30'
                      : 'bg-neutral-700/30 text-neutral-500 cursor-not-allowed'
                  "
                  :disabled="!canUndo || undoUses <= 0"
                  @click="undo"
                >
                  <span>↶ Undo Last Move</span>
                  <span class="text-xs opacity-70">{{ undoUses }} available</span>
                </button>

                <button
                  class="w-full px-4 py-3 rounded text-sm font-medium transition-colors flex items-center justify-between"
                  :class="
                    removeBlockUses > 0 ? 'bg-red-500/20 text-red-300 hover:bg-red-500/30' : 'bg-neutral-700/30 text-neutral-500 cursor-not-allowed'
                  "
                  :disabled="removeBlockUses <= 0"
                >
                  <span>🗑️ Remove Block</span>
                  <span class="text-xs opacity-70">{{ removeBlockUses }} available</span>
                </button>

                <button
                  class="w-full px-4 py-3 rounded text-sm font-medium transition-colors flex items-center justify-between"
                  :class="
                    hintUses > 0 ? 'bg-purple-500/20 text-purple-300 hover:bg-purple-500/30' : 'bg-neutral-700/30 text-neutral-500 cursor-not-allowed'
                  "
                  :disabled="hintUses <= 0"
                >
                  <span>💡 Placement Hint</span>
                  <span class="text-xs opacity-70">{{ hintUses }} available</span>
                </button>
              </div>
            </section>
          </div>

          <!-- DEBUG TAB -->
          <div v-else-if="activeTab === 'debug'" class="space-y-6">
            <div>
              <h2 class="font-semibold text-neutral-100 mb-1">Debug Tools</h2>
              <p class="text-xs text-neutral-400">Development and testing</p>
            </div>

            <section class="space-y-3">
              <h3 class="section-heading">Actions</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-3">
                <button type="button" class="btn-secondary w-full" @click="handleNewGame()">New Game</button>
                <button type="button" class="btn-destructive w-full" @click="handleNewGame()">Reset All Progress</button>
              </div>
            </section>

            <section class="space-y-3">
              <h3 class="section-heading">Game State</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-neutral-400">Current Score:</span>
                  <span class="text-neutral-200">{{ score }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-400">Game Over:</span>
                  <span class="text-neutral-200">{{ isGameOver ? 'Yes' : 'No' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-400">Can Rotate:</span>
                  <span class="text-neutral-200">{{ canRotate ? 'Yes' : 'No' }}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Footer/Status Bar -->
    <footer class="shrink-0 border-t border-neutral-700/50 bg-neutral-950/90 backdrop-blur-lg">
      <div class="px-6 py-3">
        <div class="flex items-center justify-between">
          <!-- Left side: Status indicator -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <span class="status-dot" :class="statusMeta.dot"></span>
              <span class="text-neutral-400 text-sm">Archipelago</span>
              <span :class="statusMeta.text" class="font-semibold text-sm">{{ statusMeta.label }}</span>
            </div>
            <div class="text-xs text-white/70 hidden lg:block">
              Click and drag pieces onto the grid. Complete rows, columns, or 3x3 boxes to clear them
            </div>
          </div>

          <!-- Right side: Version info -->
          <div class="text-xs text-neutral-400">
            <span class="opacity-50">v0.1.0</span>
          </div>
        </div>
      </div>
    </footer>
  </div>
</template>
