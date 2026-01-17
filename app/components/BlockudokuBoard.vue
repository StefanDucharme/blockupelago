<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
  import { canPlacePiece } from '~/utils/blockudoku';
  import type { GameMode, Piece, BlockGrid } from '~/utils/types';
  import { MOBILE_BREAKPOINT_PX, CELL_SIZE_MOBILE, CELL_SIZE_DESKTOP } from '~/utils/constants';
  import { canUseAbility, getAbilityDisplayText, canTransformPieceFree } from '~/utils/abilities';
  import GameGrid from './GameGrid.vue';
  import PieceCard from './PieceCard.vue';
  import GameControls from './GameControls.vue';

  const props = defineProps<{
    grid: BlockGrid;
    gridSize: number;
    currentPieces: Piece[];
    isGameOver: boolean;
    isPotentialGameOver: boolean;
    totalScore: number;
    clearingCells: Set<string>;
    gemCells: { row: number; col: number; checkId: number }[];
    undoUses: number;
    removeBlockUses: number;
    scoreMultiplier: number;
    rotateUses: number;
    holdUses: number;
    mirrorUses: number;
    shrinkUses: number;
    heldPiece: Piece | null;
    gameMode: 'free-play' | 'archipelago';
    totalGemsCollected: number;
    freeRotate?: boolean;
    freeUndo?: boolean;
    freeRemove?: boolean;
    freeHold?: boolean;
    freeMirror?: boolean;
    freeShrink?: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'place-piece', piece: Piece, row: number, col: number): void;
    (e: 'undo'): void;
    (e: 'remove-block', row: number, col: number): void;
    (e: 'new-game'): void;
    (e: 'hold-piece', piece: Piece): void;
    (e: 'rotate-piece', piece: Piece): void;
    (e: 'mirror-piece', piece: Piece): void;
    (e: 'shrink-piece', piece: Piece): void;
  }>();

  const selectedPiece = ref<Piece | null>(null);
  const hoveredCell = ref<{ row: number; col: number } | null>(null);
  const removeMode = ref(false);

  // Drag-and-drop state
  const isDragging = ref(false);
  const draggedPiece = ref<Piece | null>(null);
  const dragPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 });
  const isTouchDrag = ref(false); // Track if current drag is from touch
  const gridRef = ref<{ rootEl: HTMLElement | null } | null>(null);
  const holdAreaRef = ref<HTMLElement | null>(null);
  const isHoveringHoldArea = ref(false);

  // Calculate cell size based on grid size and screen size
  const cellSize = computed(() => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const isMobile = screenWidth < MOBILE_BREAKPOINT_PX;

    if (isMobile) {
      return CELL_SIZE_MOBILE[props.gridSize as keyof typeof CELL_SIZE_MOBILE] || CELL_SIZE_MOBILE[9];
    }
    return CELL_SIZE_DESKTOP[props.gridSize as keyof typeof CELL_SIZE_DESKTOP] || CELL_SIZE_DESKTOP[9];
  });

  // Check ability availability based on game mode
  const canUseUndo = computed(() => canUseAbility('undo', props.gameMode, props.undoUses, props.freeUndo || false, props.totalGemsCollected));

  const canUseRotate = computed(() => canUseAbility('rotate', props.gameMode, props.rotateUses, props.freeRotate || false, props.totalGemsCollected));

  const canUseMirror = computed(() => canUseAbility('mirror', props.gameMode, props.mirrorUses, props.freeMirror || false, props.totalGemsCollected));

  const canUseShrink = computed(() => canUseAbility('shrink', props.gameMode, props.shrinkUses, props.freeShrink || false, props.totalGemsCollected));

  const canUseHold = computed(() => canUseAbility('hold', props.gameMode, props.holdUses, props.freeHold || false, props.totalGemsCollected));

  const canUseRemoveBlock = computed(() =>
    canUseAbility('remove', props.gameMode, props.removeBlockUses, props.freeRemove || false, props.totalGemsCollected),
  );

  // Check if a specific piece can be rotated
  // A piece can be rotated if: user has rotate ability OR piece has already been rotated (making it free)
  function canRotatePiece(piece: Piece): boolean {
    return canUseRotate.value || piece.hasBeenRotated === true;
  }

  // Check if a specific piece can be mirrored
  // A piece can be mirrored if: user has mirror ability OR piece has already been mirrored (making it free)
  function canMirrorPiece(piece: Piece): boolean {
    return canUseMirror.value || piece.hasBeenMirrored === true;
  }

  // Check abilities for held piece
  const canRotateHeld = computed(() => {
    return props.heldPiece ? canRotatePiece(props.heldPiece) : false;
  });

  const canMirrorHeld = computed(() => {
    return props.heldPiece ? canMirrorPiece(props.heldPiece) : false;
  });

  // Check if a piece can be placed anywhere on the grid in its current state
  function isPiecePlaceable(piece: Piece): boolean {
    for (let r = 0; r < props.grid.length; r++) {
      for (let c = 0; c < (props.grid[0]?.length || 0); c++) {
        if (canPlacePiece(props.grid, piece, r, c)) {
          return true;
        }
      }
    }
    return false;
  }

  // Display text for ability counts
  const undoDisplayText = computed(() => getAbilityDisplayText(props.gameMode, props.freeUndo || false, props.undoUses));
  const rotateDisplayText = computed(() => getAbilityDisplayText(props.gameMode, props.freeRotate || false, props.rotateUses));
  const holdDisplayText = computed(() => getAbilityDisplayText(props.gameMode, props.freeHold || false, props.holdUses));
  const mirrorDisplayText = computed(() => getAbilityDisplayText(props.gameMode, props.freeMirror || false, props.mirrorUses));
  const shrinkDisplayText = computed(() => getAbilityDisplayText(props.gameMode, props.freeShrink || false, props.shrinkUses));
  const removeBlockDisplayText = computed(() => getAbilityDisplayText(props.gameMode, props.freeRemove || false, props.removeBlockUses));

  // Check if piece can be placed at hovered position
  const canPlaceAtHovered = computed(() => {
    if (!selectedPiece.value || !hoveredCell.value) return false;
    return canPlacePiece(props.grid, selectedPiece.value, hoveredCell.value.row, hoveredCell.value.col);
  });

  // Get preview cells for piece placement
  const previewCells = computed(() => {
    if (!selectedPiece.value || !hoveredCell.value || !canPlaceAtHovered.value) {
      return [];
    }

    const cells: { row: number; col: number }[] = [];
    const piece = selectedPiece.value;
    const { row: startRow, col: startCol } = hoveredCell.value;

    for (let r = 0; r < piece.shape.length; r++) {
      for (let c = 0; c < (piece.shape[r]?.length || 0); c++) {
        if (piece.shape[r]?.[c] === 1) {
          cells.push({ row: startRow + r, col: startCol + c });
        }
      }
    }

    return cells;
  });

  // Get cells that would be cleared if piece is placed at hovered position
  const cellsThatWouldClear = computed(() => {
    if (!selectedPiece.value || !hoveredCell.value || !canPlaceAtHovered.value) {
      return new Set<string>();
    }

    // Simulate placing the piece
    const simulatedGrid = placePiece(props.grid, selectedPiece.value, hoveredCell.value.row, hoveredCell.value.col);

    // Get cells that would clear
    return getCellsThatWouldClear(simulatedGrid);
  });

  // Calculate snapped position for drag preview
  const snappedDragPosition = computed(() => {
    if (!isDragging.value || !draggedPiece.value || !gridRef.value?.rootEl) {
      return dragPosition.value;
    }

    // Apply touch offset when not hovering over grid
    if (!hoveredCell.value) {
      const touchOffset = isTouchDrag.value ? 80 : 0;
      return {
        x: dragPosition.value.x,
        y: dragPosition.value.y - touchOffset,
      };
    }

    const gridRect = gridRef.value.rootEl.getBoundingClientRect();
    const cellPixelSize = gridRect.width / props.gridSize;

    // Calculate the top-left position of the hovered cell
    const snapX = gridRect.left + hoveredCell.value.col * cellPixelSize;
    const snapY = gridRect.top + hoveredCell.value.row * cellPixelSize;

    // Add offset to center the piece on the cell
    return {
      x: snapX + dragOffset.value.x,
      y: snapY + dragOffset.value.y,
    };
  });

  function selectPiece(piece: Piece) {
    selectedPiece.value = piece;
    removeMode.value = false;
  }

  // Clear selected piece when current pieces change (e.g., new game)
  watch(
    () => props.currentPieces,
    (newPieces, oldPieces) => {
      // If the selected piece is no longer in the current pieces, clear it
      if (selectedPiece.value && !newPieces.includes(selectedPiece.value)) {
        selectedPiece.value = null;
      }
    },
  );

  function handleCellClick(row: number, col: number) {
    if (removeMode.value) {
      emit('remove-block', row, col);
      return;
    }

    if (selectedPiece.value) {
      emit('place-piece', selectedPiece.value, row, col);
      selectedPiece.value = null;
    }
  }

  function handleCellHover(row: number, col: number) {
    hoveredCell.value = { row, col };
  }

  function clearHover() {
    hoveredCell.value = null;
  }

  function toggleRemoveMode() {
    removeMode.value = !removeMode.value;
    if (removeMode.value) {
      selectedPiece.value = null;
    }
  }

  // Drag-and-drop handlers
  function handleDragStart(event: MouseEvent | TouchEvent, piece: Piece) {
    isDragging.value = true;
    draggedPiece.value = piece;
    selectedPiece.value = piece;

    // Detect if this is a touch event
    isTouchDrag.value = 'touches' in event;

    const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
    const clientY = 'touches' in event ? (event.touches[0]?.clientY ?? 0) : event.clientY;

    // Calculate offset to center of the piece shape (in grid cell units)
    const pieceWidth = (piece.shape[0]?.length || 0) * cellSize.value;
    const pieceHeight = piece.shape.length * cellSize.value;

    dragOffset.value = {
      x: pieceWidth / 2,
      y: pieceHeight / 2,
    };

    dragPosition.value = { x: clientX, y: clientY };

    // Prevent default to avoid text selection
    event.preventDefault();
  }

  function handleDragMove(event: MouseEvent | TouchEvent) {
    if (!isDragging.value) return;

    const clientX = 'touches' in event ? (event.touches[0]?.clientX ?? 0) : event.clientX;
    const clientY = 'touches' in event ? (event.touches[0]?.clientY ?? 0) : event.clientY;

    dragPosition.value = { x: clientX, y: clientY };

    // Check if hovering over hold area (only if hold area is empty)
    if (holdAreaRef.value && draggedPiece.value && draggedPiece.value !== props.heldPiece && !props.heldPiece) {
      const holdRect = holdAreaRef.value.getBoundingClientRect();
      const isOverHoldArea = clientX >= holdRect.left && clientX <= holdRect.right && clientY >= holdRect.top && clientY <= holdRect.bottom;

      isHoveringHoldArea.value = isOverHoldArea;

      if (isOverHoldArea) {
        hoveredCell.value = null;
        event.preventDefault();
        return;
      }
    } else {
      isHoveringHoldArea.value = false;
    }

    // Update hovered cell based on drag position
    if (gridRef.value?.rootEl) {
      const gridRect = gridRef.value.rootEl.getBoundingClientRect();
      // Apply the same 80px offset for touch events so the ghost aligns with the visual piece
      const touchOffset = isTouchDrag.value ? 80 : 0;
      const relX = clientX - gridRect.left;
      const relY = clientY - gridRect.top - touchOffset;

      if (relX >= 0 && relX < gridRect.width && relY >= 0 && relY < gridRect.height) {
        const col = Math.floor((relX / gridRect.width) * props.gridSize);
        const row = Math.floor((relY / gridRect.height) * props.gridSize);

        if (row >= 0 && row < props.gridSize && col >= 0 && col < props.gridSize) {
          hoveredCell.value = { row, col };
        }
      } else {
        hoveredCell.value = null;
      }
    }

    event.preventDefault();
  }

  function handleDragEnd(event: MouseEvent | TouchEvent) {
    if (!isDragging.value || !draggedPiece.value) return;

    // Check if dropped on hold area (only if hold area is empty)
    if (isHoveringHoldArea.value && canUseHold.value && draggedPiece.value !== props.heldPiece && !props.heldPiece) {
      emit('hold-piece', draggedPiece.value);
    }
    // Try to place the piece at the hovered cell
    else if (hoveredCell.value && canPlaceAtHovered.value) {
      emit('place-piece', draggedPiece.value, hoveredCell.value.row, hoveredCell.value.col);
    }

    // Reset drag state
    isDragging.value = false;
    isTouchDrag.value = false;
    draggedPiece.value = null;
    selectedPiece.value = null;
    hoveredCell.value = null;
    isHoveringHoldArea.value = false;

    event.preventDefault();
  }

  // Add global listeners for drag on mount
  onMounted(() => {
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    document.addEventListener('touchmove', handleDragMove, { passive: false });
    document.addEventListener('touchend', handleDragEnd);
  });

  // Clean up listeners on unmount
  onUnmounted(() => {
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    document.removeEventListener('touchmove', handleDragMove);
    document.removeEventListener('touchend', handleDragEnd);
  });
</script>

<template>
  <div class="flex flex-col items-center gap-1 sm:gap-6 p-0 sm:p-4">
    <!-- New Game Button -->
    <div v-if="isGameOver || isPotentialGameOver" class="flex items-center justify-center w-full max-w-4xl">
      <button @click="emit('new-game')" class="px-4 sm:px-6 py-1.5 sm:py-2 bg-green-600 hover:bg-green-700 rounded font-bold text-xs sm:text-base">
        🎮 New Game
      </button>
    </div>

    <!-- Game Over Message -->
    <div class="flex items-center justify-center">
      <div v-if="isGameOver" class="text-sm sm:text-2xl font-bold text-red-500 animate-pulse">Game Over! No valid moves remaining.</div>
      <div v-else-if="isPotentialGameOver" class="text-xs sm:text-lg font-bold text-yellow-500 animate-pulse">
        ⚠️ No pieces can be placed as-is. Try using abilities or start a new game!
      </div>
    </div>

    <!-- Game Grid and Right Controls -->
    <div class="flex gap-2 sm:gap-4 items-start justify-center w-full">
      <!-- Game Grid -->
      <GameGrid
        ref="gridRef"
        :grid="grid"
        :grid-size="gridSize"
        :cell-size="cellSize"
        :clearing-cells="clearingCells"
        :gem-cells="gemCells"
        :selected-piece="selectedPiece"
        :hovered-cell="hoveredCell"
        :remove-mode="removeMode"
        @cell-click="handleCellClick"
        @cell-hover="handleCellHover"
        @clear-hover="clearHover"
      />

      <!-- Right Side Controls -->
      <GameControls
        :undo-uses="undoUses"
        :remove-block-uses="removeBlockUses"
        :hold-uses="holdUses"
        :held-piece="heldPiece"
        :remove-mode="removeMode"
        :can-use-undo="canUseUndo"
        :can-use-remove-block="canUseRemoveBlock"
        :can-use-hold="canUseHold"
        :undo-display-text="undoDisplayText"
        :remove-block-display-text="removeBlockDisplayText"
        :hold-display-text="holdDisplayText"
        :is-hovering-hold-area="isHoveringHoldArea"
        :is-dragging="isDragging"
        :dragged-piece="draggedPiece"
        :selected-piece="selectedPiece"
        :can-rotate-held="canRotateHeld"
        :can-mirror-held="canMirrorHeld"
        :can-shrink-held="canUseShrink"
        :rotate-display-text="rotateDisplayText"
        :mirror-display-text="mirrorDisplayText"
        :shrink-display-text="shrinkDisplayText"
        @undo="emit('undo')"
        @toggle-remove-mode="toggleRemoveMode"
        @select-held-piece="selectPiece(heldPiece!)"
        @drag-start-held="(e) => handleDragStart(e, heldPiece!)"
        @hold-area-ref="(ref) => (holdAreaRef = ref)"
        @rotate-held="heldPiece && emit('rotate-piece', heldPiece)"
        @mirror-held="heldPiece && emit('mirror-piece', heldPiece)"
        @shrink-held="heldPiece && emit('shrink-piece', heldPiece)"
      />
    </div>

    <!-- Available Pieces -->
    <div class="flex gap-1 sm:gap-4 items-start justify-center flex-wrap w-full px-1 sm:px-0 pt-2">
      <div
        v-for="(piece, idx) in currentPieces"
        :key="`piece-${idx}-${piece.id}`"
        data-piece-container
        class="flex flex-col gap-1 sm:gap-2 w-18 sm:w-30"
      >
        <PieceCard
          :piece="piece"
          :is-selected="selectedPiece === piece"
          :is-dragging="isDragging && draggedPiece === piece"
          :is-placeable="isPiecePlaceable(piece)"
          :can-rotate="canRotatePiece(piece)"
          :can-mirror="canMirrorPiece(piece)"
          :can-shrink="canUseShrink"
          :rotate-display-text="rotateDisplayText"
          :mirror-display-text="mirrorDisplayText"
          :shrink-display-text="shrinkDisplayText"
          @select="selectPiece(piece)"
          @drag-start="(e) => handleDragStart(e, piece)"
          @rotate="emit('rotate-piece', piece)"
          @mirror="emit('mirror-piece', piece)"
          @shrink="emit('shrink-piece', piece)"
        />
      </div>
    </div>

    <!-- Floating Piece During Drag -->
    <div
      v-if="isDragging && draggedPiece"
      :class="['fixed pointer-events-none z-50', hoveredCell ? 'transition-all duration-100 ease-out' : '']"
      :style="{
        left: `${snappedDragPosition.x - dragOffset.x}px`,
        top: `${snappedDragPosition.y - dragOffset.y}px`,
      }"
    >
      <div
        class="grid gap-0.5"
        :style="{
          gridTemplateColumns: `repeat(${draggedPiece.shape[0]?.length || 0}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${draggedPiece.shape.length}, ${cellSize}px)`,
        }"
      >
        <div v-for="(row, r) in draggedPiece.shape" :key="`drag-row-${r}`" class="contents">
          <div
            v-for="(cell, c) in row"
            :key="`drag-cell-${r}-${c}`"
            :class="cell === 1 ? 'bg-current shadow-xl border border-white/20' : 'bg-transparent'"
            :style="{ color: draggedPiece.color }"
            class="rounded-sm"
          />
        </div>
      </div>
    </div>
  </div>
</template>
