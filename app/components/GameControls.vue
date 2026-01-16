<script setup lang="ts">
  import type { Piece } from '~/utils/types';
  import PieceCard from './PieceCard.vue';

  const props = defineProps<{
    undoUses: number;
    removeBlockUses: number;
    holdUses: number;
    heldPiece: Piece | null;
    removeMode: boolean;
    canUseUndo: boolean;
    canUseRemoveBlock: boolean;
    canUseHold: boolean;
    undoDisplayText: string | number;
    removeBlockDisplayText: string | number;
    holdDisplayText: string | number;
    isHoveringHoldArea: boolean;
    isDragging: boolean;
    draggedPiece: Piece | null;
    selectedPiece: Piece | null;
  }>();

  const emit = defineEmits<{
    (e: 'undo'): void;
    (e: 'toggle-remove-mode'): void;
    (e: 'select-held-piece'): void;
    (e: 'drag-start-held', event: MouseEvent | TouchEvent): void;
    (e: 'hold-area-ref', ref: HTMLElement | null): void;
  }>();

  const holdAreaRef = (el: any) => {
    emit('hold-area-ref', el);
  };
</script>

<template>
  <div class="flex flex-col gap-1.5 sm:gap-3 items-center">
    <!-- Undo Button -->
    <button
      v-if="canUseUndo"
      @click="emit('undo')"
      class="w-22 sm:w-25 px-1 sm:px-2 py-1.5 sm:py-2 bg-yellow-600 hover:bg-yellow-700 rounded text-xs font-medium leading-tight"
    >
      Undo {{ undoDisplayText }}
    </button>

    <!-- Remove Block Button -->
    <button
      v-if="canUseRemoveBlock"
      @click="emit('toggle-remove-mode')"
      :class="[
        'w-22 sm:w-25 px-1 sm:px-2 py-1.5 sm:py-2 rounded text-xs font-medium leading-tight',
        removeMode ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700',
      ]"
    >
      {{ removeMode ? 'Cancel' : `Remove` }} {{ removeBlockDisplayText }}
    </button>

    <!-- Hold Piece Area -->
    <div class="flex flex-col gap-1 sm:gap-2">
      <div
        :ref="holdAreaRef"
        :class="[
          'p-1.5 sm:p-2 rounded-lg transition-all w-16 h-16 sm:w-25 sm:h-25 flex flex-col items-center justify-center',
          heldPiece ? 'cursor-grab active:cursor-grabbing' : '',
          heldPiece && selectedPiece === heldPiece ? 'bg-blue-700 scale-110' : '',
          heldPiece ? 'bg-gray-700/50 border-2 border-dashed border-gray-500' : 'bg-purple-600/30 border-2 border-dashed border-purple-500',
          !heldPiece && isHoveringHoldArea && canUseHold ? 'bg-purple-600/60 border-purple-400 scale-110' : '',
          !heldPiece && !canUseHold ? 'opacity-50 cursor-not-allowed' : '',
          heldPiece && isDragging && draggedPiece === heldPiece ? 'opacity-50' : '',
        ]"
        @click="heldPiece && emit('select-held-piece')"
        @mousedown="(e) => heldPiece && emit('drag-start-held', e)"
        @touchstart="(e) => heldPiece && emit('drag-start-held', e)"
      >
        <div
          v-if="heldPiece"
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
        <template v-else>
          <div class="text-lg sm:text-2xl mb-0.5">📦</div>
          <div class="text-2xs sm:text-xs text-center font-medium" :class="canUseHold ? 'text-purple-300' : 'text-neutral-500'">
            {{ isHoveringHoldArea ? 'Drop!' : 'Hold' }}
          </div>
          <div v-if="holdDisplayText" class="text-2xs text-center" :class="canUseHold ? 'text-purple-200' : 'text-neutral-600'">
            {{ holdDisplayText }}
          </div>
        </template>
      </div>
    </div>
  </div>
</template>
