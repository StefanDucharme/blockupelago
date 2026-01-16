<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted } from 'vue';
  import type { Piece, BlockGrid } from '~/utils/blockudoku';
  import { canPlacePiece } from '~/utils/blockudoku';

  const props = defineProps<{
    grid: BlockGrid;
    gridSize: number;
    currentPieces: Piece[];
    isGameOver: boolean;
    totalScore: number;
    clearingCells: Set<string>;
    gemCells: { row: number; col: number; checkId: number }[];
    undoUses: number;
    removeBlockUses: number;
    scoreMultiplier: number;
    rotateUses: number;
    holdUses: number;
    heldPiece: Piece | null;
    gameMode: 'free-play' | 'archipelago';
    totalGemsCollected: number;
  }>();

  const emit = defineEmits<{
    (e: 'place-piece', piece: Piece, row: number, col: number): void;
    (e: 'undo'): void;
    (e: 'remove-block', row: number, col: number): void;
    (e: 'new-game'): void;
    (e: 'hold-piece', piece: Piece): void;
    (e: 'rotate-piece', piece: Piece): void;
  }>();

  const selectedPiece = ref<Piece | null>(null);
  const hoveredCell = ref<{ row: number; col: number } | null>(null);
  const removeMode = ref(false);

  // Drag-and-drop state
  const isDragging = ref(false);
  const draggedPiece = ref<Piece | null>(null);
  const dragPosition = ref<{ x: number; y: number }>({ x: 0, y: 0 });
  const dragOffset = ref<{ x: number; y: number }>({ x: 0, y: 0 });
  const gridRef = ref<HTMLElement | null>(null);

  // Calculate cell size based on grid size and screen size
  const cellSize = computed(() => {
    const screenWidth = typeof window !== 'undefined' ? window.innerWidth : 1024;
    const isMobile = screenWidth < 640;

    if (isMobile) {
      // On mobile, make cells smaller to fit
      if (props.gridSize === 6) return 30;
      if (props.gridSize === 7) return 25;
      return 20; // 9x9
    }

    const maxSize = 40;
    const minSize = 25;
    if (props.gridSize === 6) return maxSize;
    if (props.gridSize === 7) return 35;
    return minSize; // 9x9
  });

  // Check ability availability based on game mode
  const canUseUndo = computed(() => {
    if (props.gameMode === 'free-play') {
      return props.totalGemsCollected > 0;
    }
    return props.undoUses > 0;
  });

  const canUseRotate = computed(() => {
    if (props.gameMode === 'free-play') {
      return props.totalGemsCollected > 0;
    }
    return props.rotateUses > 0;
  });

  const canUseHold = computed(() => {
    if (props.gameMode === 'free-play') {
      return props.totalGemsCollected > 0;
    }
    return props.holdUses > 0;
  });

  const canUseRemoveBlock = computed(() => {
    if (props.gameMode === 'free-play') {
      return props.totalGemsCollected > 0;
    }
    return props.removeBlockUses > 0;
  });

  // Display text for ability counts
  const undoDisplayText = computed(() => {
    if (props.gameMode === 'free-play') {
      return `💎`;
    }
    return props.undoUses;
  });

  const rotateDisplayText = computed(() => {
    if (props.gameMode === 'free-play') {
      return `💎`;
    }
    return props.rotateUses;
  });

  const holdDisplayText = computed(() => {
    if (props.gameMode === 'free-play') {
      return `💎`;
    }
    return props.holdUses;
  });

  const removeBlockDisplayText = computed(() => {
    if (props.gameMode === 'free-play') {
      return `💎`;
    }
    return props.removeBlockUses;
  });

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

  // Calculate snapped position for drag preview
  const snappedDragPosition = computed(() => {
    if (!isDragging.value || !draggedPiece.value || !gridRef.value || !hoveredCell.value) {
      return dragPosition.value;
    }

    const gridRect = gridRef.value.getBoundingClientRect();
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

  function isPreviewCell(row: number, col: number): boolean {
    return previewCells.value.some((cell) => cell.row === row && cell.col === col);
  }

  function getCellClass(row: number, col: number): string {
    const isBox = props.gridSize === 9;
    const isTopBoxBorder = isBox && row % 3 === 0 && row !== 0;
    const isLeftBoxBorder = isBox && col % 3 === 0 && col !== 0;
    const cellValue = props.grid[row]?.[col];
    const isClearing = props.clearingCells.has(`${row}-${col}`);

    // Gems no longer affect background, just use normal cell coloring
    let bgColor = cellValue === 1 ? 'bg-blue-500' : 'bg-gray-800';

    return `
        ${bgColor}
        border-gray-700
        ${isTopBoxBorder ? 'border-t-2 border-t-gray-400' : ''}
        ${isLeftBoxBorder ? 'border-l-2 border-l-gray-400' : ''}
        ${isPreviewCell(row, col) ? (canPlaceAtHovered.value ? 'bg-green-400 border-green-500' : 'bg-red-400 border-red-500') : ''}
        ${removeMode.value && cellValue === 1 ? 'hover:bg-red-500' : ''}
        ${isClearing ? 'clearing-cell' : ''}
      `;
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

    const clientX = 'touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
    const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY;

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

    const clientX = 'touches' in event ? event.touches[0]?.clientX ?? 0 : event.clientX;
    const clientY = 'touches' in event ? event.touches[0]?.clientY ?? 0 : event.clientY;

    dragPosition.value = { x: clientX, y: clientY };

    // Update hovered cell based on drag position
    if (gridRef.value) {
      const gridRect = gridRef.value.getBoundingClientRect();
      const relX = clientX - gridRect.left;
      const relY = clientY - gridRect.top;

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

    // Try to place the piece at the hovered cell
    if (hoveredCell.value && canPlaceAtHovered.value) {
      emit('place-piece', draggedPiece.value, hoveredCell.value.row, hoveredCell.value.col);
    }

    // Reset drag state
    isDragging.value = false;
    draggedPiece.value = null;
    selectedPiece.value = null;
    hoveredCell.value = null;

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
  <div class="flex flex-col items-center gap-4 sm:gap-6 p-2 sm:p-4">
    <!-- Score and New Game Button -->
    <div class="flex items-center justify-between w-full max-w-4xl min-h-[40px]">
      <div class="text-xl sm:text-2xl font-bold">
        <span v-if="scoreMultiplier > 1" class="text-xs sm:text-sm text-green-400"> (×{{ scoreMultiplier.toFixed(1) }}) </span>
      </div>

      <div class="flex gap-2">
        <button
          v-if="isGameOver"
          @click="emit('new-game')"
          class="px-3 sm:px-4 py-1 bg-green-600 hover:bg-green-700 rounded font-bold text-sm sm:text-base"
        >
          New Game
        </button>
      </div>
    </div>

    <!-- Game Over Message -->
    <div class="min-h-[24px] sm:min-h-[32px] flex items-center justify-center">
      <div v-if="isGameOver" class="text-lg sm:text-2xl font-bold text-red-500 animate-pulse">Game Over! No valid moves remaining.</div>
    </div>

    <!-- Game Grid and Right Controls -->
    <div class="flex gap-4 items-start justify-center w-full">
      <!-- Game Grid -->
      <div
        ref="gridRef"
        class="grid gap-0.5 bg-gray-700 p-1 rounded-lg"
        :style="{
          gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
          gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
        }"
        @mouseleave="clearHover"
      >
        <div v-for="(row, rowIdx) in grid" :key="`row-${rowIdx}`" class="contents">
          <div
            v-for="(cell, colIdx) in row"
            :key="`cell-${rowIdx}-${colIdx}`"
            :class="getCellClass(rowIdx, colIdx)"
            class="border transition-colors cursor-pointer relative flex items-center justify-center"
            @click="handleCellClick(rowIdx, colIdx)"
            @mouseenter="handleCellHover(rowIdx, colIdx)"
          >
            <div
              v-if="cell === 2 || gemCells.some((g) => g.row === rowIdx && g.col === colIdx)"
              class="w-4 h-4 rounded-full bg-linear-to-br from-purple-500 via-pink-500 to-yellow-500 animate-pulse"
              style="box-shadow: 0 0 8px rgba(236, 72, 153, 0.6)"
            />
          </div>
        </div>
      </div>

      <!-- Right Side Controls -->
      <div class="flex flex-col gap-3 items-center">
        <!-- Hold Piece Area -->
        <div class="flex flex-col gap-2">
          <div class="text-xs text-center text-neutral-400">Held</div>
          <div
            v-if="heldPiece"
            :class="[
              'p-2 rounded-lg transition-all w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] flex items-center justify-center cursor-grab active:cursor-grabbing',
              selectedPiece === heldPiece ? 'bg-blue-700 scale-110' : 'bg-gray-700/50 border-2 border-dashed border-gray-500',
              isDragging && draggedPiece === heldPiece ? 'opacity-50' : '',
            ]"
            @click="selectPiece(heldPiece)"
            @mousedown="(e) => heldPiece && handleDragStart(e, heldPiece)"
            @touchstart="(e) => heldPiece && handleDragStart(e, heldPiece)"
          >
            <div
              class="grid gap-0.5"
              :style="{
                gridTemplateColumns: `repeat(${heldPiece.shape[0]?.length || 0}, 15px)`,
                gridTemplateRows: `repeat(${heldPiece.shape.length}, 15px)`,
              }"
            >
              <div v-for="(row, r) in heldPiece.shape" :key="`held-row-${r}`" class="contents">
                <div
                  v-for="(cell, c) in row"
                  :key="`held-cell-${r}-${c}`"
                  :class="cell === 1 ? 'bg-current' : 'bg-transparent'"
                  :style="{ color: heldPiece.color }"
                  class="rounded-sm"
                />
              </div>
            </div>
          </div>
          <div
            v-else
            class="p-2 rounded-lg transition-all w-[80px] h-[80px] sm:w-[100px] sm:h-[100px] flex items-center justify-center bg-gray-700/50 border-2 border-dashed border-gray-500"
          >
            <div class="text-xs text-center text-neutral-500">Empty</div>
          </div>
        </div>

        <!-- Undo Button -->
        <button
          v-if="canUseUndo"
          @click="emit('undo')"
          class="w-[80px] sm:w-[100px] px-2 py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-xs sm:text-sm font-medium"
        >
          Undo<br />({{ undoDisplayText }})
        </button>

        <!-- Remove Block Button -->
        <button
          v-if="canUseRemoveBlock"
          @click="toggleRemoveMode"
          :class="[
            'w-[80px] sm:w-[100px] px-2 py-2 rounded text-xs sm:text-sm font-medium',
            removeMode ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700',
          ]"
        >
          {{ removeMode ? 'Cancel' : `Remove` }}<br />({{ removeBlockDisplayText }})
        </button>
      </div>
    </div>

    <!-- Available Pieces -->
    <div class="flex gap-2 sm:gap-4 items-start justify-center flex-wrap">
      <div
        v-for="(piece, idx) in currentPieces"
        :key="`piece-${idx}-${piece.id}`"
        data-piece-container
        class="flex flex-col gap-2 w-[100px] sm:w-[120px]"
      >
        <div class="flex flex-col items-center">
          <div
            :class="[
              'p-2 sm:p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all touch-none w-[100px] h-[100px] sm:w-[120px] sm:h-[120px]',
              selectedPiece === piece ? 'bg-blue-700 scale-110' : 'bg-gray-700 hover:bg-gray-600',
              isDragging && draggedPiece === piece ? 'opacity-50' : '',
            ]"
            @click="selectPiece(piece)"
            @mousedown="(e) => handleDragStart(e, piece)"
            @touchstart="(e) => handleDragStart(e, piece)"
          >
            <div class="flex items-center justify-center w-full h-full">
              <div
                class="grid gap-0.5"
                :style="{
                  gridTemplateColumns: `repeat(${piece.shape[0]?.length || 0}, 15px)`,
                  gridTemplateRows: `repeat(${piece.shape.length}, 15px)`,
                }"
              >
                <div v-for="(row, r) in piece.shape" :key="`piece-row-${r}`" class="contents">
                  <div
                    v-for="(cell, c) in row"
                    :key="`piece-cell-${r}-${c}`"
                    :class="cell === 1 ? 'bg-current' : 'bg-transparent'"
                    :style="{ color: piece.color }"
                    class="rounded-sm"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="flex gap-1 sm:gap-2 h-[28px] sm:h-[32px]">
          <button
            @click="emit('rotate-piece', piece)"
            :disabled="!canUseRotate"
            :class="[
              'flex-1 px-1 sm:px-2 py-1 text-[10px] sm:text-xs rounded transition-colors whitespace-nowrap',
              canUseRotate ? 'bg-blue-600/50 hover:bg-blue-600/80' : 'bg-gray-600/30 cursor-not-allowed opacity-50',
            ]"
          >
            🔄 ({{ rotateDisplayText }})
          </button>
          <button
            @click="emit('hold-piece', piece)"
            :disabled="!canUseHold"
            :class="[
              'flex-1 px-1 sm:px-2 py-1 text-[10px] sm:text-xs rounded transition-colors whitespace-nowrap flex items-center justify-center gap-1',
              canUseHold ? 'bg-purple-600/50 hover:bg-purple-600/80' : 'bg-gray-600/30 cursor-not-allowed opacity-50',
            ]"
          >
            <span class="inline-block w-3 h-3 border-2 border-dashed border-current rounded-sm"></span>
            <span>({{ holdDisplayText }})</span>
          </button>
        </div>
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

<style scoped>
  @keyframes clearPulse {
    0% {
      transform: scale(1);
      background-color: rgb(59 130 246);
    }
    50% {
      transform: scale(1.1);
      background-color: rgb(251 191 36);
      box-shadow: 0 0 20px rgba(251, 191, 36, 0.8);
    }
    100% {
      transform: scale(0.8);
      opacity: 0;
    }
  }

  .clearing-cell {
    animation: clearPulse 0.4s ease-out forwards;
  }
</style>
