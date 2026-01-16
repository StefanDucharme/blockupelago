<script setup lang="ts">
  import { computed, watch, ref } from 'vue';
  import BlockudokuBoard from '~/components/BlockudokuBoard.vue';
  import ThemePicker from '~/components/ThemePicker.vue';
  import { useBlockudoku } from '~/composables/useBlockudoku';
  import { useArchipelagoItems } from '~/composables/useArchipelagoItems';
  import { useArchipelago } from '~/composables/useArchipelago';

  // Tab management
  type MobileTab = 'game' | 'archipelago' | 'settings' | 'shop' | 'debug';
  type RightTab = 'archipelago' | 'settings' | 'shop' | 'debug';
  const activeTab = ref<RightTab>('archipelago');
  const activeMobileTab = ref<MobileTab>('game');

  // Track if we're on mobile
  const isMobile = ref(false);

  onMounted(() => {
    const checkMobile = () => {
      isMobile.value = window.innerWidth < 1024;
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);

    onUnmounted(() => {
      window.removeEventListener('resize', checkMobile);
    });
  });

  // Check if a tab is visible based on device type
  const isTabVisible = (tab: RightTab) => {
    if (isMobile.value) {
      return activeMobileTab.value === tab;
    }
    return activeTab.value === tab;
  };

  const {
    grid,
    gridSize,
    totalScore,
    currentPieces,
    isGameOver,
    clearingCells,
    gemCells,
    totalLinesCleared,
    totalBoxesCleared,
    totalCombos,
    totalPiecesPlaced,
    totalGemsCollected,
    rotateUses,
    canUndo,
    undoUses,
    removeBlockUses,
    holdUses,
    heldPiece,
    rotatePiece,
    scoreMultiplier,
    singlePlayerMode,
    MILESTONES,
    claimedMilestones,
    maxPieceSlots,
    unlockedPieceIds,
    initGame,
    resetStats,
    tryPlacePiece,
    undo,
    removeBlock,
    holdPiece,
    spawnGem,
    checkMilestones,
    unlockPiece,
    setGridSize,
    addUndoAbility,
    addRemoveBlock,
    addRotateAbility,
    addHoldAbility,
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
    () => items.receivedItems.value,
    (newItems, oldItems) => {
      if (!newItems || !oldItems) return;

      // Find newly received items
      const oldCount = oldItems.length;
      const newCount = newItems.length;

      if (newCount > oldCount) {
        for (let i = oldCount; i < newCount; i++) {
          const itemId = newItems[i];
          if (!itemId) continue;

          // Handle the item based on its ID
          switch (itemId) {
            // Piece unlocks
            case AP_ITEMS.SINGLE_BLOCK:
              unlockPiece('Single Block');
              break;
            case AP_ITEMS.DOMINO_I:
              unlockPiece('Domino I');
              break;
            case AP_ITEMS.TROMINO_I:
              unlockPiece('Tromino I');
              break;
            case AP_ITEMS.TROMINO_L:
              unlockPiece('Tromino L');
              break;
            case AP_ITEMS.TETROMINO_I:
              unlockPiece('Tetromino I');
              break;
            case AP_ITEMS.TETROMINO_O:
              unlockPiece('Tetromino O');
              break;
            case AP_ITEMS.TETROMINO_T:
              unlockPiece('Tetromino T');
              break;
            case AP_ITEMS.TETROMINO_L:
              unlockPiece('Tetromino L');
              break;
            case AP_ITEMS.TETROMINO_S:
              unlockPiece('Tetromino S');
              break;
            case AP_ITEMS.PENTOMINO_I:
              unlockPiece('Pentomino I');
              break;
            case AP_ITEMS.PENTOMINO_L:
              unlockPiece('Pentomino L');
              break;
            case AP_ITEMS.PENTOMINO_P:
              unlockPiece('Pentomino P');
              break;
            case AP_ITEMS.PENTOMINO_U:
              unlockPiece('Pentomino U');
              break;
            case AP_ITEMS.PENTOMINO_W:
              unlockPiece('Pentomino W');
              break;
            case AP_ITEMS.PENTOMINO_PLUS:
              unlockPiece('Pentomino Plus');
              break;
            case AP_ITEMS.BLOCK_3X3:
              unlockPiece('3x3 Block');
              break;
            case AP_ITEMS.CORNER_3X3:
              unlockPiece('3x3 Corner');
              break;
            case AP_ITEMS.T_SHAPE_3X3:
              unlockPiece('3x3 T-Shape');
              break;
            case AP_ITEMS.CROSS_3X3:
              unlockPiece('3x3 Cross');
              break;

            // Piece slots
            case AP_ITEMS.PIECE_SLOT_4:
            case AP_ITEMS.PIECE_SLOT_5:
              addPieceSlot();
              break;

            // Abilities
            case AP_ITEMS.UNDO_ABILITY:
              addUndoAbility();
              break;
            case AP_ITEMS.REMOVE_BLOCK:
              addRemoveBlock();
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
    <!-- Mobile Tab Bar (visible only on mobile) -->
    <div class="lg:hidden flex border-b border-neutral-700/50 bg-neutral-900/95 shrink-0 overflow-x-auto">
      <button class="tab-button flex-1 min-w-0 px-2" :class="{ active: activeMobileTab === 'game' }" @click="activeMobileTab = 'game'">
        <span class="text-xs">🎮</span>
      </button>
      <button class="tab-button flex-1 min-w-0 px-2" :class="{ active: activeMobileTab === 'archipelago' }" @click="activeMobileTab = 'archipelago'">
        <span class="text-xs">🏝️</span>
      </button>
      <button class="tab-button flex-1 min-w-0 px-2" :class="{ active: activeMobileTab === 'settings' }" @click="activeMobileTab = 'settings'">
        <span class="text-xs">⚙️</span>
      </button>
      <button class="tab-button flex-1 min-w-0 px-2" :class="{ active: activeMobileTab === 'shop' }" @click="activeMobileTab = 'shop'">
        <span class="text-xs">🛒</span>
      </button>
      <button class="tab-button flex-1 min-w-0 px-2" :class="{ active: activeMobileTab === 'debug' }" @click="activeMobileTab = 'debug'">
        <span class="text-xs">🐛</span>
      </button>
    </div>

    <!-- Main Container -->
    <div class="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
      <!-- LEFT: Main Game Area - hidden on mobile when not on game tab -->
      <div class="flex-1 px-3 sm:px-6 py-2 sm:py-4 min-h-0 overflow-y-auto" :class="{ 'hidden lg:block': activeMobileTab !== 'game' }">
        <!-- Stats Panel -->
        <div class="mb-2 sm:mb-4 p-2 sm:p-3 bg-neutral-800/30 rounded-lg border border-neutral-700">
          <div class="flex items-center justify-between gap-2 flex-wrap">
            <h2 class="text-sm sm:text-base font-semibold whitespace-nowrap">Blockupelago</h2>
            <div class="flex items-center gap-2 sm:gap-3 flex-wrap text-xs">
              <div class="flex items-center gap-1">
                <span class="font-bold text-blue-400">{{ totalScore }}</span>
                <span class="text-neutral-400">Score</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="font-bold text-green-400">{{ totalLinesCleared }}</span>
                <span class="text-neutral-400">Lines</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="font-bold text-purple-400">{{ totalBoxesCleared }}</span>
                <span class="text-neutral-400">Boxes</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="font-bold text-yellow-400">{{ totalCombos }}</span>
                <span class="text-neutral-400">Combos</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="font-bold text-orange-400">{{ totalPiecesPlaced }}</span>
                <span class="text-neutral-400">Pieces</span>
              </div>
              <div class="flex items-center gap-1">
                <span class="font-bold text-pink-400">{{ totalGemsCollected }}</span>
                <span class="text-neutral-400">Gems</span>
              </div>
            </div>
            <ThemePicker />
          </div>
        </div>

        <!-- Game Board -->
        <BlockudokuBoard
          :grid="grid"
          :grid-size="gridSize"
          :current-pieces="currentPieces"
          :is-game-over="isGameOver"
          :total-score="totalScore"
          :clearing-cells="clearingCells"
          :gem-cells="gemCells"
          :can-undo="canUndo"
          :undo-uses="undoUses"
          :remove-block-uses="removeBlockUses"
          :score-multiplier="scoreMultiplier"
          :rotate-uses="rotateUses"
          :hold-uses="holdUses"
          :held-piece="heldPiece"
          @place-piece="handlePlacePiece"
          @undo="undo"
          @remove-block="removeBlock"
          @new-game="handleNewGame"
          @hold-piece="holdPiece"
          @rotate-piece="rotatePiece"
        />
      </div>

      <!-- RIGHT: Sidebar with Tabs - hidden on mobile when game tab active -->
      <div
        class="w-full lg:w-1/3 shrink-0 bg-neutral-900/95 backdrop-blur-lg border-t lg:border-t-0 lg:border-l border-neutral-700 flex flex-col min-h-0"
        :class="{ 'hidden lg:flex': activeMobileTab === 'game' }"
      >
        <!-- Tab Bar (desktop only) -->
        <div class="hidden lg:flex border-b border-neutral-700/50 shrink-0 overflow-x-auto">
          <button class="tab-button whitespace-nowrap" :class="{ active: activeTab === 'archipelago' }" @click="activeTab = 'archipelago'">
            Archipelago
          </button>
          <button class="tab-button whitespace-nowrap" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">Settings</button>
          <button class="tab-button whitespace-nowrap" :class="{ active: activeTab === 'shop' }" @click="activeTab = 'shop'">Shop</button>
          <button class="tab-button whitespace-nowrap" :class="{ active: activeTab === 'debug' }" @click="activeTab = 'debug'">Debug</button>
        </div>

        <!-- Tab Content -->
        <div class="p-3 sm:p-4 flex-1 overflow-y-auto min-h-0">
          <!-- ARCHIPELAGO TAB -->
          <div v-if="isTabVisible('archipelago')" class="space-y-6">
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
                <div class="text-xs text-neutral-300">{{ lastMessage }}</div>
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
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-neutral-300">Grid Size</span>
                    <span class="text-sm font-bold text-blue-400">{{ gridSize }}x{{ gridSize }}</span>
                  </div>
                  <div class="flex gap-2">
                    <button
                      v-for="size in [6, 9, 12]"
                      :key="size"
                      @click="setGridSize(size)"
                      :class="[
                        'flex-1 px-3 py-2 text-xs rounded transition-colors',
                        gridSize === size ? 'bg-blue-600 text-white' : 'bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/50',
                      ]"
                    >
                      {{ size }}x{{ size }}
                    </button>
                  </div>
                  <p class="text-xs text-neutral-500 mt-2">⚠️ Changes take effect on next new game</p>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-neutral-300">Score Multiplier</span>
                  <span class="text-sm font-bold text-yellow-400">{{ scoreMultiplier.toFixed(2) }}x</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-sm text-neutral-300">Available Piece Slots</span>
                  <span class="text-sm font-bold text-purple-400">{{ maxPieceSlots }}</span>
                </div>
              </div>
            </section>

            <section class="space-y-4">
              <h3 class="section-heading">Unlocked Abilities</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-2 text-sm">
                <div class="flex items-center justify-between">
                  <span class="text-neutral-300">🔄 Rotate Pieces</span>
                  <span :class="rotateUses > 0 ? 'text-green-400' : 'text-neutral-500'">
                    {{ rotateUses > 0 ? `✓ (${rotateUses} uses)` : '✗ No uses' }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-neutral-300">↶ Undo</span>
                  <span :class="canUndo ? 'text-green-400' : 'text-neutral-500'">
                    {{ canUndo ? `✓ (${undoUses} uses)` : '✗ Locked' }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-neutral-300">🗑️ Remove Block</span>
                  <span :class="removeBlockUses > 0 ? 'text-green-400' : 'text-neutral-500'">
                    {{ removeBlockUses > 0 ? `✓ (${removeBlockUses} uses)` : '✗ No uses' }}
                  </span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-neutral-300">📦 Hold Piece</span>
                  <span :class="holdUses > 0 ? 'text-green-400' : 'text-neutral-500'">
                    {{ holdUses > 0 ? `✓ (${holdUses} uses)` : '✗ No uses' }}
                  </span>
                </div>
              </div>
            </section>

            <section v-if="singlePlayerMode" class="space-y-4">
              <h3 class="section-heading">Unlocked Pieces ({{ unlockedPieceIds.length }})</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 text-xs text-neutral-300">
                {{ unlockedPieceIds.join(', ') }}
              </div>
            </section>

            <section v-if="singlePlayerMode" class="space-y-4">
              <h3 class="section-heading">Milestones Progress</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-3 max-h-80 overflow-y-auto">
                <div v-for="milestone in MILESTONES" :key="milestone.id" class="flex items-center justify-between text-xs">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span :class="claimedMilestones.includes(milestone.id) ? 'text-green-400' : 'text-neutral-400'">
                        {{ claimedMilestones.includes(milestone.id) ? '✓' : '○' }}
                      </span>
                      <span class="text-neutral-300">{{ milestone.score.toLocaleString() }} pts</span>
                    </div>
                    <div class="text-neutral-400 ml-5">{{ milestone.description }}</div>
                  </div>
                  isTabVisible('shop')
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
              </div>
            </section>
          </div>

          <!-- DEBUG TAB -->
          <div v-else-if="isTabVisible('debug')" class="space-y-6">
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
              <h3 class="section-heading">Grant Rewards</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-2">
                <button type="button" class="btn-secondary w-full text-xs" @click="addRotateAbility()">+ Rotate (1 use)</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addUndoAbility()">+ Undo (1 use)</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addRemoveBlock()">+ Remove Block (1 use)</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addHoldAbility()">+ Hold (1 use)</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="spawnGem()">💎 Spawn Gem</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addPieceSlot()">+ Piece Slot</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addScoreMultiplier(0.1)">+ 0.1x Score Multiplier</button>
              </div>
            </section>

            <section class="space-y-3">
              <h3 class="section-heading">Game State</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-2 text-xs">
                <div class="flex justify-between">
                  <span class="text-neutral-400">Total Score:</span>
                  <span class="text-neutral-200">{{ totalScore }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-400">Game Over:</span>
                  <span class="text-neutral-200">{{ isGameOver ? 'Yes' : 'No' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-400">Rotate Uses:</span>
                  <span class="text-neutral-200">{{ rotateUses }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-neutral-400">Unlocked Pieces:</span>
                  <span class="text-neutral-200">{{ unlockedPieceIds.length }}</span>
                </div>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>

    <!-- Bottom Footer/Status Bar -->
    <footer class="shrink-0 border-t border-neutral-700/50 bg-neutral-950/90 backdrop-blur-lg">
      <div class="px-3 sm:px-6 py-2 sm:py-3">
        <div class="flex items-center gap-2 sm:gap-4">
          <div class="status-indicator shrink-0">
            <span class="status-dot" :class="statusMeta.dot"></span>
            <span class="text-neutral-400 font-medium text-xs sm:text-sm">Archipelago</span>
            <span :class="statusMeta.text" class="font-semibold text-xs sm:text-sm">{{ statusMeta.label }}</span>
          </div>
          <div class="text-xs text-white/70 hidden lg:block truncate">Click and drag pieces onto the grid</div>
          <div v-if="lastMessage" class="text-xs text-neutral-400 truncate ml-auto">{{ lastMessage }}</div>
        </div>
      </div>
    </footer>
  </div>
</template>
