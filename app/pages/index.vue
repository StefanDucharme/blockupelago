<script setup lang="ts">
  import { computed, watch, ref } from 'vue';
  import BlockudokuBoard from '~/components/BlockudokuBoard.vue';
  import ThemePicker from '~/components/ThemePicker.vue';
  import { useBlockudoku } from '~/composables/useBlockudoku';
  import { useArchipelagoItems } from '~/composables/useArchipelagoItems';
  import { useArchipelago } from '~/composables/useArchipelago';
  import { clearAllPersistence } from '~/composables/usePersistence';
  import { ALL_PIECES, STARTER_PIECE_IDS } from '~/utils/blockudoku';
  import { TABLET_BREAKPOINT_PX } from '~/utils/constants';

  // Tab management
  type MobileTab = 'game' | 'archipelago' | 'checks' | 'chat' | 'settings' | 'debug';
  type RightTab = 'archipelago' | 'checks' | 'chat' | 'settings' | 'debug';
  const activeTab = ref<RightTab>('archipelago');
  const activeMobileTab = ref<MobileTab>('game');

  // Track if we're on mobile
  const isMobile = ref(false);

  // Track if mobile stats are expanded
  const mobileStatsExpanded = ref(false);

  onMounted(() => {
    const checkMobile = () => {
      isMobile.value = window.innerWidth < TABLET_BREAKPOINT_PX;
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
    isPotentialGameOver,
    clearingCells,
    gemCells,
    totalLinesCleared,
    totalBoxesCleared,
    totalCombos,
    totalPiecesPlaced,
    totalGemsCollected,
    rotateUses,
    undoUses,
    removeBlockUses,
    holdUses,
    mirrorUses,
    heldPiece,
    rotatePiece,
    mirrorPiece,
    scoreMultiplier,
    gameMode,
    maxPieceSlots,
    unlockedPieceIds,
    pieceSizeRatio,
    disabledShapeIds,
    gemSpawnRatio,
    freeRotate,
    freeUndo,
    freeRemove,
    freeHold,
    freeMirror,
    freeShrink,
    shrinkUses,
    shrinkPiece,
    initGame,
    resetStats,
    resetAllProgress,
    tryPlacePiece,
    undo,
    removeBlock,
    holdPiece,
    spawnGem,
    checkMilestones,
    unlockPiece,
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
    reapplyArchipelagoItems,
  } = useBlockudoku();

  const {
    archipelagoMode,
    checkLocation,
    isLocationCompleted,
    completedChecks,
    AP_ITEMS,
    ITEM_NAME_TO_ID,
    getItemName,
    SCORE_MILESTONES,
    LINE_CLEAR_MILESTONES,
    BOX_CLEAR_MILESTONES,
    PIECE_MILESTONES,
    getScoreLocationId,
    getLineClearLocationId,
    getBoxClearLocationId,
    getPieceLocationId,
  } = useArchipelagoItems();

  const {
    host,
    port,
    slot,
    password,
    useSecureConnection,
    status,
    connect,
    disconnect,
    autoReconnect,
    syncItems,
    resetArchipelagoState,
    items,
    lastMessage,
    messageLog,
    addLogMessage,
    checkLocations,
    checkGoalCompletion,
    debugCompleteCheck,
  } = useArchipelago();

  // Auto-reconnect on page load if previously connected
  onMounted(() => {
    autoReconnect();
  });

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
  // Track the last processed item count (resets on page refresh to allow re-processing)
  const lastProcessedItemCount = ref(0);

  watch(
    () => items.receivedItems.value,
    (newItems) => {
      if (!newItems) return;

      // Only process items we haven't seen before
      const currentCount = newItems.length;
      if (currentCount <= lastProcessedItemCount.value) {
        // No new items, skip processing
        return;
      }

      // Process only the newly added items
      for (let i = lastProcessedItemCount.value; i < currentCount; i++) {
        const itemId = newItems[i];
        if (!itemId) continue;

        console.log('[DEBUG] Processing received item:', itemId, getItemName(itemId));

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
          case AP_ITEMS.ROTATE_ABILITY:
            addRotateAbility();
            break;
          case AP_ITEMS.UNDO_ABILITY:
            addUndoAbility();
            break;
          case AP_ITEMS.REMOVE_BLOCK:
            addRemoveBlock();
            break;
          case AP_ITEMS.HOLD_ABILITY:
            addHoldAbility();
            break;
          case AP_ITEMS.MIRROR_ABILITY:
            addMirrorAbility();
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

      // Update the last processed count
      lastProcessedItemCount.value = currentCount;
    },
    { deep: true },
  );

  // Debug: selected item for giving
  const debugSelectedItem = ref<number | ''>('');

  // Debug: location check controls
  const debugLocationCategory = ref<'score' | 'lines' | 'boxes' | 'pieces'>('score');
  const debugLocationIndex = ref<number>(0);

  // Debug: Give an AP item
  function giveDebugItem() {
    if (!debugSelectedItem.value) return;
    const itemId = debugSelectedItem.value as number;
    const itemName = getItemName(itemId);

    // Simulate receiving the item
    items.receiveItem(itemId);
    addLogMessage(`🎁 Debug: Gave ${itemName}`, 'info');

    // Manually trigger the item handling logic
    switch (itemId) {
      // Pieces
      case AP_ITEMS.SINGLE_BLOCK:
        unlockPiece('single');
        break;
      case AP_ITEMS.DOMINO_I:
        unlockPiece('domino_i');
        break;
      case AP_ITEMS.TROMINO_I:
        unlockPiece('tromino_i');
        break;
      case AP_ITEMS.TROMINO_L:
        unlockPiece('tromino_l');
        break;
      case AP_ITEMS.TETROMINO_I:
        unlockPiece('tetromino_i');
        break;
      case AP_ITEMS.TETROMINO_O:
        unlockPiece('tetromino_o');
        break;
      case AP_ITEMS.TETROMINO_T:
        unlockPiece('tetromino_t');
        break;
      case AP_ITEMS.TETROMINO_L:
        unlockPiece('tetromino_l');
        break;
      case AP_ITEMS.TETROMINO_S:
        unlockPiece('tetromino_s');
        break;
      case AP_ITEMS.PENTOMINO_I:
        unlockPiece('pentomino_i');
        break;
      case AP_ITEMS.PENTOMINO_L:
        unlockPiece('pentomino_l');
        break;
      case AP_ITEMS.PENTOMINO_P:
        unlockPiece('pentomino_p');
        break;
      case AP_ITEMS.PENTOMINO_U:
        unlockPiece('pentomino_u');
        break;
      case AP_ITEMS.PENTOMINO_W:
        unlockPiece('pentomino_w');
        break;
      case AP_ITEMS.PENTOMINO_PLUS:
        unlockPiece('pentomino_plus');
        break;
      case AP_ITEMS.CORNER_3X3:
        unlockPiece('corner_3x3');
        break;
      case AP_ITEMS.T_SHAPE_3X3:
        unlockPiece('t_shape_3x3');
        break;
      case AP_ITEMS.CROSS_3X3:
        unlockPiece('cross_3x3');
        break;
      // Slots
      case AP_ITEMS.PIECE_SLOT_4:
        addPieceSlot();
        break;
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
      case AP_ITEMS.HOLD_ABILITY:
        addHoldAbility();
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

    debugSelectedItem.value = '';
  }

  // Helper function to handle grid size change with confirmation
  function handleGridSizeChange(size: number) {
    if (size !== gridSize.value && confirm('Changing grid size will start a new game. Continue?')) {
      setGridSize(size);
    }
  }

  // Toggle a shape on/off in free-play mode
  function toggleShape(shapeId: string) {
    const index = disabledShapeIds.value.indexOf(shapeId);
    if (index > -1) {
      // Enable the shape
      disabledShapeIds.value = disabledShapeIds.value.filter((id) => id !== shapeId);
    } else {
      // Disable the shape (but ensure at least 3 shapes remain enabled)
      if (ALL_PIECES.length - disabledShapeIds.value.length > 3) {
        disabledShapeIds.value = [...disabledShapeIds.value, shapeId];
      } else {
        alert('You must keep at least 3 shapes enabled!');
      }
    }
  }

  // Debug: Send a location check
  async function debugSendCheck() {
    const category = debugLocationCategory.value;
    const index = debugLocationIndex.value;

    let locationId: number | null = null;

    if (category === 'score' && index < SCORE_MILESTONES.length) {
      const score = SCORE_MILESTONES[index];
      if (score !== undefined) {
        locationId = getScoreLocationId(score);
      }
    } else if (category === 'lines' && index < LINE_CLEAR_MILESTONES.length) {
      const clears = LINE_CLEAR_MILESTONES[index];
      if (clears !== undefined) {
        locationId = getLineClearLocationId(clears);
      }
    } else if (category === 'boxes' && index < BOX_CLEAR_MILESTONES.length) {
      const clears = BOX_CLEAR_MILESTONES[index];
      if (clears !== undefined) {
        locationId = getBoxClearLocationId(clears);
      }
    } else if (category === 'pieces' && index < PIECE_MILESTONES.length) {
      const pieces = PIECE_MILESTONES[index];
      if (pieces !== undefined) {
        locationId = getPieceLocationId(pieces);
      }
    }

    if (locationId) {
      await debugCompleteCheck(locationId);
    }
  }

  // Helper function to handle game mode change
  function handleGameModeChange(newMode: 'free-play' | 'archipelago') {
    // Don't allow archipelago mode if not connected
    if (newMode === 'archipelago' && status.value !== 'connected') {
      alert('You must be connected to an Archipelago server to use Archipelago mode.');
      return;
    }

    // Always start a new game when switching modes
    if (newMode !== gameMode.value) {
      const modeNames = {
        'free-play': 'Free Play',
        archipelago: 'Archipelago',
      };

      if (confirm(`Switch to ${modeNames[newMode]} mode? This will reset all progress and start a fresh game.`)) {
        // Clear ALL persistence data (including Archipelago checks and items)
        clearAllPersistence();

        // Reset Archipelago state (item processing index)
        resetArchipelagoState();

        // Reset item processing counter
        lastProcessedItemCount.value = 0;

        // Set the new mode first (before init so it saves correctly)
        gameMode.value = newMode;

        // Sync archipelago mode flag
        archipelagoMode.value = newMode === 'archipelago';

        // Reset all game state
        totalScore.value = 0;
        totalLinesCleared.value = 0;
        totalBoxesCleared.value = 0;
        totalCombos.value = 0;
        totalPiecesPlaced.value = 0;
        totalGemsCollected.value = 0;
        rotateUses.value = 0;
        undoUses.value = 0;
        removeBlockUses.value = 0;
        holdUses.value = 0;
        mirrorUses.value = 0;
        heldPiece.value = null;
        scoreMultiplier.value = 1.0;
        maxPieceSlots.value = 3;

        // In archipelago mode, initialize with starter pieces; free-play gets all pieces
        if (newMode === 'archipelago') {
          unlockedPieceIds.value = [...STARTER_PIECE_IDS];
        } else {
          unlockedPieceIds.value = [];
        }

        // Initialize the game with a fresh grid
        initGame();
      }
    }
  }

  // Watch for connection to Archipelago and auto-switch to archipelago mode
  watch(status, (newStatus, oldStatus) => {
    if (newStatus === 'connected' && gameMode.value !== 'archipelago') {
      // Auto-switch to archipelago mode on connection
      gameMode.value = 'archipelago';
      archipelagoMode.value = true;
      resetStats();
      initGame();
      addLogMessage('Connected to Archipelago server', 'info');
    } else if (newStatus === 'connected' && oldStatus !== 'connected') {
      // Reconnecting while already in archipelago mode - reapply items
      if (gameMode.value === 'archipelago') {
        reapplyArchipelagoItems(items.receivedItems.value);
      }
      addLogMessage('Connected to Archipelago server', 'info');
    } else if (newStatus === 'disconnected' && oldStatus === 'connected') {
      addLogMessage('Disconnected from Archipelago server', 'info');
    }
  });

  // Watch for archipelago messages
  watch(lastMessage, (newMsg, oldMsg) => {
    if (newMsg && newMsg !== oldMsg) {
      addLogMessage(newMsg, 'chat');
    }
  });

  // Watch for milestone achievements and send checks
  watch([totalScore, totalLinesCleared, totalBoxesCleared, totalCombos, totalPiecesPlaced], () => {
    if (!archipelagoMode.value) return;

    const locationIds = checkMilestones();
    const newChecks: number[] = [];
    for (const locationId of locationIds) {
      if (checkLocation(locationId)) {
        // This is a new check, add to list to send
        newChecks.push(locationId);
      }
    }

    // Send all new checks to AP server
    if (newChecks.length > 0) {
      console.log('[AP] Sending checks:', newChecks);
      addLogMessage(`Sent ${newChecks.length} location check(s)`, 'info');
      checkLocations(newChecks);
    }

    // Check goal completion
    checkGoalCompletion(totalScore.value);
  });

  // Watch for gem collections and send checks
  watch(totalGemsCollected, () => {
    if (!archipelagoMode.value) return;

    const gemChecks = getCollectedGemChecks();
    if (gemChecks.length > 0) {
      console.log('[AP] Sending gem checks:', gemChecks);
      addLogMessage(`Collected ${gemChecks.length} gem(s)`, 'info');
      checkLocations(gemChecks);
    }
  });

  function handlePlacePiece(piece: any, row: number, col: number) {
    tryPlacePiece(piece, row, col);
  }

  function handleNewGame() {
    resetStats();
    initGame();
  }

  function handleResetAllProgress() {
    if (confirm('This will permanently delete ALL progress including Archipelago items and stats. Are you sure?')) {
      // Reset Archipelago state first
      resetArchipelagoState();
      // Reset item processing counter
      lastProcessedItemCount.value = 0;
      // Set archipelago mode to false (switching to free-play)
      archipelagoMode.value = false;
      // Then reset all game progress
      resetAllProgress();
    }
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
      <button
        v-if="gameMode === 'archipelago'"
        class="tab-button flex-1 min-w-0 px-2"
        :class="{ active: activeMobileTab === 'checks' }"
        @click="activeMobileTab = 'checks'"
      >
        <span class="text-xs">✅</span>
      </button>
      <button
        v-if="gameMode === 'archipelago'"
        class="tab-button flex-1 min-w-0 px-2"
        :class="{ active: activeMobileTab === 'chat' }"
        @click="activeMobileTab = 'chat'"
      >
        <span class="text-xs">💬</span>
      </button>
      <button class="tab-button flex-1 min-w-0 px-2" :class="{ active: activeMobileTab === 'settings' }" @click="activeMobileTab = 'settings'">
        <span class="text-xs">⚙️</span>
      </button>
      <button class="tab-button flex-1 min-w-0 px-2" :class="{ active: activeMobileTab === 'debug' }" @click="activeMobileTab = 'debug'">
        <span class="text-xs">🐛</span>
      </button>
    </div>

    <!-- Main Container -->
    <div class="flex flex-col lg:flex-row flex-1 min-h-0 overflow-hidden">
      <!-- LEFT: Main Game Area - hidden on mobile when not on game tab -->
      <div class="flex-1 px-0 sm:px-6 py-1 sm:py-4 min-h-0 overflow-y-auto" :class="{ 'hidden lg:block': activeMobileTab !== 'game' }">
        <!-- Stats Panel -->
        <div class="mb-1 sm:mb-4 mx-1 sm:mx-0 p-1 sm:p-3 bg-neutral-800/30 rounded-lg border border-neutral-700">
          <div class="flex items-center justify-between gap-1 sm:gap-2">
            <div class="flex items-center gap-1 sm:gap-2 min-w-0">
              <h2 class="text-xs sm:text-base font-semibold whitespace-nowrap">Blockupelago</h2>
              <span
                :class="[
                  'text-2xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium whitespace-nowrap',
                  gameMode === 'free-play' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400',
                ]"
              >
                {{ gameMode === 'free-play' ? '🎮' : '🏝️'
                }}<span class="hidden sm:inline">{{ gameMode === 'free-play' ? ' Free Play' : ' Archipelago' }}</span>
              </span>
            </div>
            <div class="flex items-center gap-1 sm:gap-3 text-2xs sm:text-xs overflow-x-auto scrollbar-none">
              <div class="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                <span class="sm:hidden">🏆</span>
                <span class="font-bold text-blue-400">{{ totalScore }}</span>
                <span class="text-neutral-400 hidden sm:inline">Score</span>
                <span v-if="scoreMultiplier > 1" class="text-green-400 font-semibold ml-0.5">(×{{ scoreMultiplier.toFixed(2) }})</span>
              </div>
              <div class="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                <span class="sm:hidden">💎</span>
                <span class="font-bold text-pink-400">{{ totalGemsCollected }}</span>
                <span class="text-neutral-400 hidden sm:inline">Gems</span>
              </div>
              <button
                @click="mobileStatsExpanded = !mobileStatsExpanded"
                class="sm:hidden flex items-center gap-0.5 text-neutral-400 hover:text-neutral-200 transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path v-if="mobileStatsExpanded" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                  <path v-else stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <!-- Expandable stats on mobile, always visible on desktop -->
              <template v-if="mobileStatsExpanded || !isMobile">
                <div class="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                  <span class="sm:hidden">📊</span>
                  <span class="font-bold text-green-400">{{ totalLinesCleared }}</span>
                  <span class="text-neutral-400 hidden sm:inline">Lines</span>
                </div>
                <div class="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                  <span class="sm:hidden">📦</span>
                  <span class="font-bold text-purple-400">{{ totalBoxesCleared }}</span>
                  <span class="text-neutral-400 hidden sm:inline">Boxes</span>
                </div>
                <div class="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                  <span class="sm:hidden">⚡</span>
                  <span class="font-bold text-yellow-400">{{ totalCombos }}</span>
                  <span class="text-neutral-400 hidden sm:inline">Combos</span>
                </div>
                <div class="flex items-center gap-0.5 sm:gap-1 whitespace-nowrap">
                  <span class="sm:hidden">🧩</span>
                  <span class="font-bold text-orange-400">{{ totalPiecesPlaced }}</span>
                  <span class="text-neutral-400 hidden sm:inline">Pieces</span>
                </div>
              </template>
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
          :is-potential-game-over="isPotentialGameOver"
          :total-score="totalScore"
          :clearing-cells="clearingCells"
          :gem-cells="gemCells"
          :undo-uses="undoUses"
          :remove-block-uses="removeBlockUses"
          :score-multiplier="scoreMultiplier"
          :rotate-uses="rotateUses"
          :hold-uses="holdUses"
          :mirror-uses="mirrorUses"
          :shrink-uses="shrinkUses"
          :held-piece="heldPiece"
          :game-mode="gameMode"
          :total-gems-collected="totalGemsCollected"
          :free-rotate="freeRotate"
          :free-undo="freeUndo"
          :free-remove="freeRemove"
          :free-hold="freeHold"
          :free-mirror="freeMirror"
          :free-shrink="freeShrink"
          @place-piece="handlePlacePiece"
          @undo="undo"
          @remove-block="removeBlock"
          @new-game="handleNewGame"
          @hold-piece="holdPiece"
          @rotate-piece="rotatePiece"
          @mirror-piece="mirrorPiece"
          @shrink-piece="shrinkPiece"
        />
      </div>

      <!-- RIGHT: Sidebar with Tabs - hidden on mobile when game tab active -->
      <div
        class="w-full lg:w-1/3 lg:shrink-0 bg-neutral-900/95 backdrop-blur-lg border-t lg:border-t-0 lg:border-l border-neutral-700 flex flex-col min-h-0 overflow-hidden flex-1 lg:flex-initial"
        :class="{ 'hidden lg:flex': activeMobileTab === 'game' }"
      >
        <!-- Tab Bar (desktop only) -->
        <div class="hidden lg:flex border-b border-neutral-700/50 shrink-0 overflow-x-auto">
          <button class="tab-button whitespace-nowrap" :class="{ active: activeTab === 'archipelago' }" @click="activeTab = 'archipelago'">
            Archipelago
          </button>
          <button
            v-if="gameMode === 'archipelago'"
            class="tab-button whitespace-nowrap"
            :class="{ active: activeTab === 'checks' }"
            @click="activeTab = 'checks'"
          >
            Checks
          </button>
          <button
            v-if="gameMode === 'archipelago'"
            class="tab-button whitespace-nowrap"
            :class="{ active: activeTab === 'chat' }"
            @click="activeTab = 'chat'"
          >
            Chat
          </button>
          <button class="tab-button whitespace-nowrap" :class="{ active: activeTab === 'settings' }" @click="activeTab = 'settings'">Settings</button>
          <button class="tab-button whitespace-nowrap" :class="{ active: activeTab === 'debug' }" @click="activeTab = 'debug'">Debug</button>
        </div>

        <!-- Tab Content -->
        <div class="p-3 sm:p-4 flex-1 overflow-y-auto min-h-0 custom-scrollbar">
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

              <div v-if="status === 'connected'" class="pt-2">
                <button
                  class="btn-secondary w-full text-xs"
                  @click="syncItems()"
                  title="Reprocess all items from server (use if local data was cleared)"
                >
                  🔄 Resync Items
                </button>
              </div>

              <div v-if="lastMessage" class="mt-4 p-3 bg-neutral-900/50 rounded-lg border border-neutral-600">
                <div class="text-xs text-neutral-300">{{ lastMessage }}</div>
              </div>
            </div>
          </div>

          <!-- CHECKS TAB -->
          <div v-else-if="isTabVisible('checks')" class="space-y-6">
            <div>
              <h2 class="font-semibold text-neutral-100 mb-1">Location Checks</h2>
              <p class="text-xs text-neutral-400">Track your progress</p>
            </div>

            <!-- Score Milestones -->
            <section class="space-y-3">
              <h3 class="section-heading">Score Milestones</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4">
                <div class="space-y-2">
                  <div v-for="(score, idx) in SCORE_MILESTONES" :key="score" class="flex items-center justify-between text-xs">
                    <span class="text-neutral-300">{{ score.toLocaleString() }} Points</span>
                    <span v-if="isLocationCompleted(getScoreLocationId(score) || 0)" class="text-green-400">✓</span>
                    <span v-else-if="totalScore >= score" class="text-yellow-400">⏳</span>
                    <span v-else class="text-neutral-600">○</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Line Clears -->
            <section class="space-y-3">
              <h3 class="section-heading">Line Clears</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4">
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="clears in LINE_CLEAR_MILESTONES" :key="clears" class="flex items-center justify-between text-xs">
                    <span class="text-neutral-300">{{ clears }} Line{{ clears > 1 ? 's' : '' }}</span>
                    <span v-if="isLocationCompleted(getLineClearLocationId(clears) || 0)" class="text-green-400">✓</span>
                    <span v-else-if="totalLinesCleared >= clears" class="text-yellow-400">⏳</span>
                    <span v-else class="text-neutral-600">○</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Box Clears -->
            <section class="space-y-3">
              <h3 class="section-heading">Box Clears</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4">
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="clears in BOX_CLEAR_MILESTONES" :key="clears" class="flex items-center justify-between text-xs">
                    <span class="text-neutral-300">{{ clears }} Box{{ clears > 1 ? 'es' : '' }}</span>
                    <span v-if="isLocationCompleted(getBoxClearLocationId(clears) || 0)" class="text-green-400">✓</span>
                    <span v-else-if="totalBoxesCleared >= clears" class="text-yellow-400">⏳</span>
                    <span v-else class="text-neutral-600">○</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Pieces Placed -->
            <section class="space-y-3">
              <h3 class="section-heading">Pieces Placed</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4">
                <div class="grid grid-cols-2 gap-2">
                  <div v-for="pieces in PIECE_MILESTONES" :key="pieces" class="flex items-center justify-between text-xs">
                    <span class="text-neutral-300">{{ pieces }} Piece{{ pieces > 1 ? 's' : '' }}</span>
                    <span v-if="isLocationCompleted(getPieceLocationId(pieces) || 0)" class="text-green-400">✓</span>
                    <span v-else-if="totalPiecesPlaced >= pieces" class="text-yellow-400">⏳</span>
                    <span v-else class="text-neutral-600">○</span>
                  </div>
                </div>
              </div>
            </section>

            <!-- Summary -->
            <div class="bg-neutral-800/30 rounded-sm p-4">
              <div class="text-center space-y-2">
                <div class="text-2xl font-bold text-green-400">
                  {{ completedChecks.size || 0 }}
                </div>
                <div class="text-xs text-neutral-400">Total Checks Completed</div>
              </div>
            </div>
          </div>

          <!-- CHAT TAB -->
          <div v-else-if="isTabVisible('chat')" class="space-y-6">
            <div>
              <h2 class="font-semibold text-neutral-100 mb-1">Message Log</h2>
              <p class="text-xs text-neutral-400">Archipelago communications</p>
            </div>

            <div class="bg-neutral-800/30 rounded-sm p-4 space-y-3 max-h-150 overflow-y-auto">
              <div v-if="messageLog.length === 0" class="text-center text-neutral-500 py-8">No messages yet</div>
              <div v-else class="space-y-2">
                <div
                  v-for="(message, index) in messageLog"
                  :key="index"
                  class="p-3 rounded text-sm"
                  :class="{
                    'bg-blue-500/10 border border-blue-500/30': message.type === 'chat',
                    'bg-green-500/10 border border-green-500/30': message.type === 'item',
                    'bg-red-500/10 border border-red-500/30': message.type === 'error',
                    'bg-neutral-700/30 border border-neutral-600/30': message.type === 'info',
                  }"
                >
                  <div class="flex items-start justify-between gap-2 mb-1">
                    <span
                      class="text-xs font-semibold"
                      :class="{
                        'text-blue-400': message.type === 'chat',
                        'text-green-400': message.type === 'item',
                        'text-red-400': message.type === 'error',
                        'text-neutral-400': message.type === 'info',
                      }"
                    >
                      {{
                        message.type === 'chat' ? '💬 Chat' : message.type === 'item' ? '📦 Item' : message.type === 'error' ? '❌ Error' : 'ℹ️ Info'
                      }}
                    </span>
                    <span class="text-2xs text-neutral-500">
                      {{ message.time.toLocaleTimeString() }}
                    </span>
                  </div>
                  <div class="text-neutral-200">{{ message.text }}</div>
                </div>
              </div>
            </div>

            <button
              @click="messageLog = []"
              class="w-full px-4 py-2 bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300 rounded text-sm transition-colors"
            >
              Clear Log
            </button>
          </div>

          <!-- SETTINGS TAB -->
          <div v-else-if="isTabVisible('settings')" class="space-y-6">
            <div>
              <h2 class="font-semibold text-neutral-100 mb-1">Game Settings</h2>
              <p class="text-xs text-neutral-400">Customize your gameplay</p>
            </div>

            <section class="space-y-4">
              <h3 class="section-heading">Game Mode</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-3">
                <p class="text-xs text-neutral-400 mb-3">Choose your gameplay style</p>

                <!-- Free Play Mode -->
                <button
                  @click="handleGameModeChange('free-play')"
                  :class="[
                    'w-full text-left px-4 py-3 rounded-lg border-2 transition-all',
                    gameMode === 'free-play' ? 'border-blue-500 bg-blue-500/20' : 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600',
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-sm font-medium text-neutral-100">🎮 Free Play</div>
                      <div class="text-xs text-neutral-400 mt-1">All pieces unlocked • Abilities cost gems</div>
                    </div>
                    <div v-if="gameMode === 'free-play'" class="text-blue-400 text-lg">✓</div>
                  </div>
                </button>

                <!-- Archipelago Mode -->
                <button
                  @click="handleGameModeChange('archipelago')"
                  :disabled="status !== 'connected'"
                  :class="[
                    'w-full text-left px-4 py-3 rounded-lg border-2 transition-all',
                    gameMode === 'archipelago'
                      ? 'border-purple-500 bg-purple-500/20'
                      : status === 'connected'
                        ? 'border-neutral-700 bg-neutral-800/50 hover:border-neutral-600'
                        : 'border-neutral-800 bg-neutral-900/50 opacity-50 cursor-not-allowed',
                  ]"
                >
                  <div class="flex items-center justify-between">
                    <div>
                      <div class="text-sm font-medium text-neutral-100">🏝️ Archipelago</div>
                      <div class="text-xs text-neutral-400 mt-1">
                        {{ status === 'connected' ? 'Pieces & abilities from multiworld' : 'Connect to AP server first' }}
                      </div>
                    </div>
                    <div v-if="gameMode === 'archipelago'" class="text-purple-400 text-lg">✓</div>
                  </div>
                </button>

                <!-- Mode Description -->
                <div class="mt-4 p-3 bg-neutral-900/50 rounded text-xs text-neutral-400">
                  <template v-if="gameMode === 'free-play'">
                    <span class="text-blue-400">Free Play:</span> All {{ ALL_PIECES.length }} pieces available! Collect gems to use undo, rotate, and
                    hold abilities.
                  </template>
                  <template v-else-if="gameMode === 'archipelago'">
                    <span class="text-purple-400">Archipelago:</span> Unlock pieces and abilities through the Archipelago multiworld server. Gems are
                    AP items!
                  </template>
                </div>
              </div>
            </section>

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
                      @click="handleGridSizeChange(size)"
                      :class="[
                        'flex-1 px-3 py-2 text-xs rounded transition-colors',
                        gridSize === size ? 'bg-blue-600 text-white' : 'bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600/50',
                      ]"
                    >
                      {{ size }}x{{ size }}
                    </button>
                  </div>
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
              <h3 class="section-heading">
                {{ gameMode === 'free-play' ? 'Ability Settings' : 'Unlocked Abilities' }}
              </h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-2 text-sm">
                <div v-if="gameMode === 'free-play'" class="mb-3 p-2 bg-pink-500/10 border border-pink-500/30 rounded text-xs text-pink-300">
                  💎 You have {{ totalGemsCollected }} gems
                </div>

                <!-- Free-play mode: toggleable abilities -->
                <template v-if="gameMode === 'free-play'">
                  <div class="flex items-center justify-between py-1">
                    <span class="text-neutral-300">🔄 Rotate Pieces</span>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <span class="text-xs" :class="'text-pink-400'"> 1 gem </span>
                      <input type="checkbox" v-model="freeRotate" class="toggle-checkbox toggle-checkbox-pink" />
                      <span class="text-xs" :class="'text-green-400'"> Free </span>
                    </label>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-neutral-300">↶ Undo</span>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <span class="text-xs" :class="'text-pink-400'"> 1 gem </span>
                      <input type="checkbox" v-model="freeUndo" class="toggle-checkbox toggle-checkbox-pink" />
                      <span class="text-xs" :class="'text-green-400'"> Free </span>
                    </label>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-neutral-300">🗑️ Remove Block</span>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <span class="text-xs" :class="'text-pink-400'"> 1 gem </span>
                      <input type="checkbox" v-model="freeRemove" class="toggle-checkbox toggle-checkbox-pink" />
                      <span class="text-xs" :class="'text-green-400'"> Free </span>
                    </label>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-neutral-300">📦 Hold Piece</span>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <span class="text-xs" :class="'text-pink-400'"> 1 gem </span>
                      <input type="checkbox" v-model="freeHold" class="toggle-checkbox toggle-checkbox-pink" />
                      <span class="text-xs" :class="'text-green-400'"> Free </span>
                    </label>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-neutral-300"><span class="text-cyan-400">↔️</span> Mirror Piece</span>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <span class="text-xs" :class="'text-pink-400'"> 1 gem </span>
                      <input type="checkbox" v-model="freeMirror" class="toggle-checkbox toggle-checkbox-pink" />
                      <span class="text-xs" :class="'text-green-400'"> Free </span>
                    </label>
                  </div>
                  <div class="flex items-center justify-between py-1">
                    <span class="text-neutral-300">⬇️ Shrink to 1 Block</span>
                    <label class="flex items-center gap-2 cursor-pointer">
                      <span class="text-xs" :class="'text-pink-400'"> 1 gem </span>
                      <input type="checkbox" v-model="freeShrink" class="toggle-checkbox toggle-checkbox-pink" />
                      <span class="text-xs" :class="'text-green-400'"> Free </span>
                    </label>
                  </div>
                </template>

                <!-- Archipelago mode: show ability counts -->
                <template v-else>
                  <div class="flex items-center justify-between">
                    <span class="text-neutral-300">🔄 Rotate Pieces</span>
                    <span :class="rotateUses > 0 ? 'text-green-400' : 'text-neutral-500'">
                      {{ rotateUses }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-neutral-300">↶ Undo</span>
                    <span :class="undoUses > 0 ? 'text-green-400' : 'text-neutral-500'">
                      {{ undoUses }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-neutral-300">🗑️ Remove Block</span>
                    <span :class="removeBlockUses > 0 ? 'text-green-400' : 'text-neutral-500'">
                      {{ removeBlockUses }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-neutral-300">📦 Hold Piece</span>
                    <span :class="holdUses > 0 ? 'text-green-400' : 'text-neutral-500'">
                      {{ holdUses }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-neutral-300"><span class="text-cyan-400">↔️</span> Mirror Piece</span>
                    <span :class="mirrorUses > 0 ? 'text-green-400' : 'text-neutral-500'">
                      {{ mirrorUses }}
                    </span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-neutral-300">⬇️ Shrink to 1 Block</span>
                    <span :class="shrinkUses > 0 ? 'text-green-400' : 'text-neutral-500'">
                      {{ shrinkUses }}
                    </span>
                  </div>
                </template>
              </div>
            </section>

            <section class="space-y-4">
              <h3 class="section-heading">Piece Generation Settings</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-4">
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-neutral-300">Piece Size Preference</span>
                    <span class="text-xs text-blue-400 font-mono">{{ pieceSizeRatio.toFixed(2) }}</span>
                  </div>
                  <input
                    type="range"
                    v-model.number="pieceSizeRatio"
                    min="0"
                    max="1"
                    step="0.01"
                    class="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div class="flex justify-between text-2xs text-neutral-500 mt-1">
                    <span>Small (1-2 blocks)</span>
                    <span>Balanced</span>
                    <span>Large (4-5 blocks)</span>
                  </div>
                  <p class="text-2xs text-neutral-400 mt-2">Controls the probability of generating smaller vs larger pieces when restocking.</p>
                </div>
                <div>
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-sm text-neutral-300">Gem Spawn Chance</span>
                    <span class="text-xs text-pink-400 font-mono">{{ (gemSpawnRatio * 100).toFixed(0) }}%</span>
                  </div>
                  <input
                    type="range"
                    v-model.number="gemSpawnRatio"
                    min="0"
                    max="1"
                    step="0.05"
                    class="w-full h-2 bg-neutral-700 rounded-lg appearance-none cursor-pointer slider"
                  />
                  <div class="flex justify-between text-2xs text-neutral-500 mt-1">
                    <span>Never</span>
                    <span>Sometimes</span>
                    <span>Always</span>
                  </div>
                  <p class="text-2xs text-neutral-400 mt-2">Probability that a gem will spawn on the grid when new pieces are generated.</p>
                </div>
              </div>
            </section>

            <section v-if="gameMode === 'free-play'" class="space-y-4">
              <h3 class="section-heading">Enabled Shapes ({{ ALL_PIECES.length - disabledShapeIds.length }} / {{ ALL_PIECES.length }})</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4">
                <p class="text-xs text-neutral-400 mb-3">Toggle shapes on/off for piece generation</p>
                <div class="grid grid-cols-2 gap-2 max-h-96 overflow-y-auto">
                  <button
                    v-for="piece in ALL_PIECES"
                    :key="piece.id"
                    @click="toggleShape(piece.id)"
                    :class="[
                      'text-left p-2 rounded transition-all border',
                      disabledShapeIds.includes(piece.id)
                        ? 'bg-neutral-900/30 border-neutral-800 opacity-50'
                        : 'bg-neutral-900/50 border-neutral-700 hover:border-blue-500',
                    ]"
                  >
                    <div class="flex items-center justify-between mb-1">
                      <span class="text-xs text-neutral-300">{{ piece.name }}</span>
                      <span v-if="!disabledShapeIds.includes(piece.id)" class="text-green-400 text-xs">✓</span>
                      <span v-else class="text-neutral-600 text-xs">✗</span>
                    </div>
                    <div class="flex items-center justify-center">
                      <div class="inline-grid gap-0.5">
                        <div v-for="(row, i) in piece.shape" :key="i" class="flex gap-0.5">
                          <div
                            v-for="(cell, j) in row"
                            :key="j"
                            :style="{ backgroundColor: cell ? piece.color : 'transparent' }"
                            class="w-3 h-3 rounded-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </section>

            <section v-if="gameMode === 'archipelago'" class="space-y-4">
              <h3 class="section-heading">
                Unlocked Pieces ({{ unlockedPieceIds.length }} / {{ ALL_PIECES.length }})
                <span class="text-2xs text-purple-400 ml-2">via Archipelago</span>
              </h3>
              <div class="bg-neutral-800/30 rounded-sm p-4">
                <div class="grid grid-cols-2 gap-3">
                  <div
                    v-for="piece in ALL_PIECES.filter((p) => unlockedPieceIds.includes(p.id))"
                    :key="piece.id"
                    class="bg-neutral-900/50 rounded p-2"
                  >
                    <div class="text-xs text-neutral-300 mb-2">{{ piece.name }}</div>
                    <div class="flex items-center justify-center">
                      <div class="inline-grid gap-0.5">
                        <div v-for="(row, i) in piece.shape" :key="i" class="flex gap-0.5">
                          <div
                            v-for="(cell, j) in row"
                            :key="j"
                            :style="{ backgroundColor: cell ? piece.color : 'transparent' }"
                            class="w-4 h-4 rounded-sm"
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
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
                <button type="button" class="btn-destructive w-full" @click="handleResetAllProgress()">Reset All Progress</button>
              </div>
            </section>

            <section class="space-y-3">
              <h3 class="section-heading">Grant Rewards</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-2">
                <button type="button" class="btn-secondary w-full text-xs" @click="totalScore += 100">📊 +100 Score</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="totalScore += 1000">📊 +1000 Score</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addRotateAbility()">+ Rotate (1 use)</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addUndoAbility()">+ Undo (1 use)</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addRemoveBlock()">+ Remove Block (1 use)</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addHoldAbility()">+ Hold (1 use)</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addMirrorAbility()">+ Mirror (1 use)</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addShrinkAbility()">+ Shrink (1 use)</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="totalGemsCollected++">💎 Give Gem</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="spawnGem()">💎 Spawn Gem</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addPieceSlot()">+ Piece Slot</button>
                <button type="button" class="btn-secondary w-full text-xs" @click="addScoreMultiplier(0.1)">+ 0.1x Score Multiplier</button>
              </div>
            </section>

            <section v-if="gameMode === 'archipelago'" class="space-y-3">
              <h3 class="section-heading">Give AP Item</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-2">
                <select
                  v-model="debugSelectedItem"
                  class="w-full px-3 py-2 bg-neutral-700/50 text-neutral-200 rounded text-xs border border-neutral-600"
                >
                  <option value="" disabled>Select an item...</option>
                  <option v-for="(itemId, itemName) in ITEM_NAME_TO_ID" :key="itemName" :value="itemId">
                    {{ itemName }}
                  </option>
                </select>
                <button type="button" class="btn-secondary w-full text-xs" @click="giveDebugItem" :disabled="!debugSelectedItem">
                  🎁 Give Selected Item
                </button>
              </div>
            </section>

            <section v-if="status === 'connected'" class="space-y-3">
              <h3 class="section-heading">Complete Location Checks</h3>
              <div class="bg-neutral-800/30 rounded-sm p-4 space-y-3">
                <p class="text-xs text-neutral-400">Manually complete location checks for testing</p>

                <div class="space-y-2">
                  <div class="flex gap-2">
                    <select v-model="debugLocationCategory" class="flex-1 bg-neutral-800 text-neutral-200 px-3 py-2 rounded text-xs">
                      <option value="score">Score Milestone</option>
                      <option value="lines">Line Clears</option>
                      <option value="boxes">Box Clears</option>
                      <option value="pieces">Pieces Placed</option>
                    </select>
                    <select v-model="debugLocationIndex" class="flex-1 bg-neutral-800 text-neutral-200 px-3 py-2 rounded text-xs">
                      <option v-if="debugLocationCategory === 'score'" v-for="(score, idx) in SCORE_MILESTONES" :key="idx" :value="idx">
                        {{ score.toLocaleString() }} Points
                      </option>
                      <option v-if="debugLocationCategory === 'lines'" v-for="(clears, idx) in LINE_CLEAR_MILESTONES" :key="idx" :value="idx">
                        {{ clears }} Lines
                      </option>
                      <option v-if="debugLocationCategory === 'boxes'" v-for="(clears, idx) in BOX_CLEAR_MILESTONES" :key="idx" :value="idx">
                        {{ clears }} Boxes
                      </option>
                      <option v-if="debugLocationCategory === 'pieces'" v-for="(pieces, idx) in PIECE_MILESTONES" :key="idx" :value="idx">
                        {{ pieces }} Pieces
                      </option>
                    </select>
                  </div>
                  <button @click="debugSendCheck" class="btn-secondary w-full text-xs">✓ Complete & Send Check</button>
                </div>
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
      <div class="px-2 sm:px-6 py-0.5 sm:py-3">
        <div class="flex items-center gap-1 sm:gap-4">
          <div class="status-indicator shrink-0">
            <span class="status-dot" :class="statusMeta.dot"></span>
            <span class="text-neutral-400 font-medium text-2xs sm:text-sm hidden sm:inline">Archipelago</span>
            <span :class="statusMeta.text" class="font-semibold text-2xs sm:text-sm">{{ statusMeta.label }}</span>
          </div>
          <div class="text-xs text-white/70 hidden lg:block truncate">Click and drag pieces onto the grid</div>
          <div>
            <button
              type="button"
              data-sleek
              class="px-1.5 sm:px-3 !py-0.5 sm:!py-1.5 rounded text-xs transition-colors bg-fuchsia-500/20 text-fuchsia-300 hover:bg-fuchsia-500/30"
            >
              <span class="sm:hidden">💬</span>
              <span class="hidden sm:inline">Give Feedback</span>
            </button>
          </div>
          <div v-if="lastMessage" class="text-2xs sm:text-xs text-neutral-400 truncate ml-auto hidden sm:block">
            Latest Message: {{ lastMessage }}
          </div>
          <div class="text-xs text-neutral-400 truncate ml-auto">v0.1.4</div>
        </div>
      </div>
    </footer>
  </div>
</template>
