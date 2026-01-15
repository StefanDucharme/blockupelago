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
    canUndo: boolean;
    undoUses: number;
    removeBlockUses: number;
    scoreMultiplier: number;
    canRotate: boolean;
    canHold: boolean;
    heldPiece: Piece | null;
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

  // Calculate cell size based on grid size
  const cellSize = computed(() => {
    const maxSize = 40;
    const minSize = 25;
    if (props.gridSize === 6) return maxSize;
    if (props.gridSize === 7) return 35;
    return minSize; // 9x9
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
    const boxBorder = isBox && (row % 3 === 0 || col % 3 === 0);
    const cellValue = props.grid[row]?.[col];
    const isClearing = props.clearingCells.has(`${row}-${col}`);

    return `
        ${cellValue === 1 ? 'bg-blue-500' : 'bg-gray-800'}
        ${boxBorder ? 'border-gray-600' : 'border-gray-700'}
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
  <div class="flex flex-col items-center gap-6 p-4">
    <!-- Score and Controls -->
    <div class="flex items-center justify-between w-full max-w-2xl">
      <div class="text-2xl font-bold">
        <span v-if="scoreMultiplier > 1" class="text-sm text-green-400"> (×{{ scoreMultiplier.toFixed(1) }}) </span>
      </div>

      <div class="flex gap-2">
        <button v-if="canUndo && undoUses > 0" @click="emit('undo')" class="px-3 py-1 bg-yellow-600 hover:bg-yellow-700 rounded">
          Undo ({{ undoUses }})
        </button>

        <button
          v-if="removeBlockUses > 0"
          @click="toggleRemoveMode"
          :class="['px-3 py-1 rounded', removeMode ? 'bg-red-600' : 'bg-orange-600 hover:bg-orange-700']"
        >
          {{ removeMode ? 'Cancel' : `Remove (${removeBlockUses})` }}
        </button>

        <button v-if="isGameOver" @click="emit('new-game')" class="px-4 py-1 bg-green-600 hover:bg-green-700 rounded font-bold">New Game</button>
      </div>
    </div>

    <!-- Game Over Message -->
    <div v-if="isGameOver" class="text-2xl font-bold text-red-500 animate-pulse">Game Over! No valid moves remaining.</div>

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
          class="border transition-colors cursor-pointer"
          @click="handleCellClick(rowIdx, colIdx)"
          @mouseenter="handleCellHover(rowIdx, colIdx)"
        />
      </div>
    </div>

    <!-- Available Pieces -->
    <div class="flex gap-4 items-start">
      <!-- Hold Piece Area -->
      <div class="flex flex-col gap-2">
        <div class="text-xs text-center text-neutral-400">Hold (H)</div>
        <div
          :class="[
            'p-4 rounded-lg transition-all w-22 h-22 flex items-center justify-center',
            canHold ? 'bg-gray-700/50 border-2 border-dashed border-gray-500' : 'bg-gray-800/30 border-2 border-gray-700/30',
            !canHold && 'opacity-50 cursor-not-allowed',
          ]"
        >
          <div
            v-if="heldPiece"
            class="grid gap-0.5"
            :style="{
              gridTemplateColumns: `repeat(${heldPiece.shape[0]?.length || 0}, 20px)`,
              gridTemplateRows: `repeat(${heldPiece.shape.length}, 20px)`,
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
          <div v-else-if="!canHold" class="text-xs text-center text-neutral-600">Locked</div>
          <div v-else class="text-xs text-center text-neutral-500">Empty</div>
        </div>
      </div>

      <!-- Current Pieces -->
      <div class="flex gap-4">
        <div v-for="(piece, idx) in currentPieces" :key="`piece-${idx}-${piece.id}`" data-piece-container class="flex flex-col gap-2">
          <div
            :class="[
              'p-4 rounded-lg cursor-grab active:cursor-grabbing transition-all touch-none',
              selectedPiece === piece ? 'bg-blue-700 scale-110' : 'bg-gray-700 hover:bg-gray-600',
              isDragging && draggedPiece === piece ? 'opacity-50' : '',
            ]"
            @click="selectPiece(piece)"
            @mousedown="(e) => handleDragStart(e, piece)"
            @touchstart="(e) => handleDragStart(e, piece)"
          >
            <div class="flex flex-col items-center gap-2">
              <div
                class="grid gap-0.5"
                :style="{
                  gridTemplateColumns: `repeat(${piece.shape[0]?.length || 0}, 20px)`,
                  gridTemplateRows: `repeat(${piece.shape.length}, 20px)`,
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
          <div class="flex gap-2">
            <button
              v-if="canRotate"
              @click="emit('rotate-piece', piece)"
              class="flex-1 px-2 py-1 text-xs bg-blue-600/50 hover:bg-blue-600/80 rounded transition-colors"
            >
              🔄 Rotate
            </button>
            <button
              v-if="canHold"
              @click="emit('hold-piece', piece)"
              class="flex-1 px-2 py-1 text-xs bg-purple-600/50 hover:bg-purple-600/80 rounded transition-colors"
            >
              Hold
            </button>
          </div>
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
