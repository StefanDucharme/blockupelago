<script setup lang="ts">
  import { computed, ref } from 'vue';
  import type { BlockGrid, Piece } from '~/utils/types';
  import { canPlacePiece, placePiece, getCellsThatWouldClear } from '~/utils/blockudoku';

  const props = defineProps<{
    grid: BlockGrid;
    gridSize: number;
    cellSize: number;
    clearingCells: Set<string>;
    gemCells: { row: number; col: number; checkId: number }[];
    selectedPiece: Piece | null;
    hoveredCell: { row: number; col: number } | null;
    removeMode: boolean;
  }>();

  const emit = defineEmits<{
    (e: 'cell-click', row: number, col: number): void;
    (e: 'cell-hover', row: number, col: number): void;
    (e: 'clear-hover'): void;
  }>();

  // Expose the root element for parent component to access
  const rootEl = ref<HTMLElement | null>(null);
  defineExpose({ rootEl });

  // Check if piece can be placed at hovered position
  const canPlaceAtHovered = computed(() => {
    if (!props.selectedPiece || !props.hoveredCell) return false;
    return canPlacePiece(props.grid, props.selectedPiece, props.hoveredCell.row, props.hoveredCell.col);
  });

  // Get preview cells for piece placement
  const previewCells = computed(() => {
    if (!props.selectedPiece || !props.hoveredCell || !canPlaceAtHovered.value) {
      return [];
    }

    const cells: { row: number; col: number }[] = [];
    const piece = props.selectedPiece;
    const { row: startRow, col: startCol } = props.hoveredCell;

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
    if (!props.selectedPiece || !props.hoveredCell || !canPlaceAtHovered.value) {
      return new Set<string>();
    }

    // Simulate placing the piece
    const simulatedGrid = placePiece(props.grid, props.selectedPiece, props.hoveredCell.row, props.hoveredCell.col);

    // Get cells that would clear
    return getCellsThatWouldClear(simulatedGrid);
  });

  function isPreviewCell(row: number, col: number): boolean {
    return previewCells.value.some((cell) => cell.row === row && cell.col === col);
  }

  function getCellClass(row: number, col: number): string {
    const isBox = props.gridSize === 9;
    const isTopBoxBorder = isBox && row % 3 === 0 && row !== 0;
    const isLeftBoxBorder = isBox && col % 3 === 0 && col !== 0;
    const cellValue = props.grid[row]?.[col];
    const isClearing = props.clearingCells.has(`${row}-${col}`);
    const willClear = cellsThatWouldClear.value.has(`${row}-${col}`);

    // Gems no longer affect background, just use normal cell coloring
    let bgColor = cellValue === 1 ? 'bg-blue-500' : 'bg-gray-800';

    // Highlight cells that will be cleared in yellow/gold
    if (willClear && cellValue === 1) {
      bgColor = 'bg-yellow-400';
    }

    return `
        ${bgColor}
        border-gray-700
        ${isTopBoxBorder ? 'border-t-2 border-t-gray-400' : ''}
        ${isLeftBoxBorder ? 'border-l-2 border-l-gray-400' : ''}
        ${isPreviewCell(row, col) ? (canPlaceAtHovered.value ? 'bg-green-400 border-green-500' : 'bg-red-400 border-red-500') : ''}
        ${props.removeMode && cellValue === 1 ? 'hover:bg-red-500' : ''}
        ${isClearing ? 'clearing-cell' : ''}
        ${willClear ? 'transition-colors duration-150' : ''}
      `;
  }
</script>

<template>
  <div
    ref="rootEl"
    class="grid gap-0.5 bg-gray-700 p-0.5 sm:p-1 rounded-lg"
    :style="{
      gridTemplateColumns: `repeat(${gridSize}, ${cellSize}px)`,
      gridTemplateRows: `repeat(${gridSize}, ${cellSize}px)`,
    }"
    @mouseleave="emit('clear-hover')"
  >
    <div v-for="(row, rowIdx) in grid" :key="`row-${rowIdx}`" class="contents">
      <div
        v-for="(cell, colIdx) in row"
        :key="`cell-${rowIdx}-${colIdx}`"
        :class="getCellClass(rowIdx, colIdx)"
        class="border transition-colors cursor-pointer relative flex items-center justify-center"
        @click="emit('cell-click', rowIdx, colIdx)"
        @mouseenter="emit('cell-hover', rowIdx, colIdx)"
      >
        <div
          v-if="cell === 2 || gemCells.some((g) => g.row === rowIdx && g.col === colIdx)"
          class="w-4 h-4 rounded-full bg-linear-to-br from-purple-500 via-pink-500 to-yellow-500 animate-pulse"
          style="box-shadow: 0 0 8px rgba(236, 72, 153, 0.6)"
        />
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
