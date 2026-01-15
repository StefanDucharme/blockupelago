<script setup lang="ts">
  import { ref, computed } from 'vue';
  import type { Piece, BlockGrid } from '~/utils/blockudoku';
  import { canPlacePiece } from '~/utils/blockudoku';

  const props = defineProps<{
    grid: BlockGrid;
    gridSize: number;
    currentPieces: Piece[];
    isGameOver: boolean;
    score: number;
    canUndo: boolean;
    undoUses: number;
    removeBlockUses: number;
    hintUses: number;
    scoreMultiplier: number;
  }>();

  const emit = defineEmits<{
    (e: 'place-piece', piece: Piece, row: number, col: number): void;
    (e: 'undo'): void;
    (e: 'remove-block', row: number, col: number): void;
    (e: 'new-game'): void;
  }>();

  const selectedPiece = ref<Piece | null>(null);
  const hoveredCell = ref<{ row: number; col: number } | null>(null);
  const removeMode = ref(false);

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

    return `
        ${cellValue === 1 ? 'bg-blue-500' : 'bg-gray-800'}
        ${boxBorder ? 'border-gray-600' : 'border-gray-700'}
        ${isPreviewCell(row, col) ? (canPlaceAtHovered.value ? 'bg-green-400 border-green-500' : 'bg-red-400 border-red-500') : ''}
        ${removeMode.value && cellValue === 1 ? 'hover:bg-red-500' : ''}
      `;
  }

  function toggleRemoveMode() {
    removeMode.value = !removeMode.value;
    if (removeMode.value) {
      selectedPiece.value = null;
    }
  }
</script>

<template>
  <div class="flex flex-col items-center gap-6 p-4">
    <!-- Score and Controls -->
    <div class="flex items-center justify-between w-full max-w-2xl">
      <div class="text-2xl font-bold">
        Score: {{ score.toLocaleString() }}
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
    <div class="flex gap-4">
      <div
        v-for="(piece, idx) in currentPieces"
        :key="`piece-${idx}-${piece.id}`"
        :class="['p-4 rounded-lg cursor-pointer transition-all', selectedPiece === piece ? 'bg-blue-700 scale-110' : 'bg-gray-700 hover:bg-gray-600']"
        @click="selectPiece(piece)"
      >
        <div class="flex flex-col items-center gap-2">
          <div class="text-sm font-semibold">{{ piece.name }}</div>
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
    </div>

    <!-- Instructions -->
    <div v-if="!isGameOver" class="text-center text-sm text-gray-400 max-w-md">
      <p>Select a piece and click on the grid to place it.</p>
      <p>Complete rows, columns, or 3x3 boxes to clear them and score points!</p>
    </div>
  </div>
</template>
