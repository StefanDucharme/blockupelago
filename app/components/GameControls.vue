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
    canRotateHeld: boolean;
    canMirrorHeld: boolean;
    canShrinkHeld: boolean;
    rotateDisplayText: string | number;
    mirrorDisplayText: string | number;
    shrinkDisplayText: string | number;
  }>();

  const emit = defineEmits<{
    (e: 'undo'): void;
    (e: 'toggle-remove-mode'): void;
    (e: 'select-held-piece'): void;
    (e: 'drag-start-held', event: MouseEvent | TouchEvent): void;
    (e: 'hold-area-ref', ref: HTMLElement | null): void;
    (e: 'rotate-held'): void;
    (e: 'mirror-held'): void;
    (e: 'shrink-held'): void;
  }>();

  const holdAreaRef = (el: any) => {
    emit('hold-area-ref', el);
  };
</script>

<template>
  <div class="flex flex-col gap-1.5 sm:gap-3 items-center">
    <!-- Undo Button -->
    <!-- Icon options: ↶ ↺ ⤶ ⮌ ⎌ -->
    <button
      @click="emit('undo')"
      :disabled="!canUseUndo"
      :class="[
        'w-22 sm:w-25 px-1 sm:px-2 py-1.5 sm:py-2 rounded text-xs font-medium leading-tight transition-colors',
        canUseUndo ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-gray-600/30 cursor-not-allowed opacity-50',
      ]"
      title="Undo last move"
    >
      <span class="text-base">↶</span> Undo {{ undoDisplayText }}
    </button>

    <!-- Remove Block Button -->
    <!-- Icon options: ✕ × ╳ ⨯ 🗑 -->
    <button
      @click="emit('toggle-remove-mode')"
      :disabled="!canUseRemoveBlock && !removeMode"
      :class="[
        'w-22 sm:w-25 px-1 sm:px-2 py-1.5 sm:py-2 rounded text-xs font-medium leading-tight transition-colors',
        removeMode
          ? 'bg-red-600 hover:bg-red-700'
          : canUseRemoveBlock
            ? 'bg-orange-600 hover:bg-orange-700'
            : 'bg-gray-600/30 cursor-not-allowed opacity-50',
      ]"
      :title="removeMode ? 'Cancel remove mode' : 'Remove a single block from the grid'"
    >
      <span class="text-base">✕</span> {{ removeMode ? 'Cancel' : 'Remove' }} {{ removeBlockDisplayText }}
    </button>

    <!-- Hold Piece Area -->
    <div class="flex flex-col gap-1 sm:gap-2">
      <div v-if="heldPiece" class="w-18 sm:w-30">
        <PieceCard
          :piece="heldPiece"
          :is-selected="selectedPiece === heldPiece"
          :is-dragging="isDragging && draggedPiece === heldPiece"
          :is-placeable="true"
          :can-rotate="canRotateHeld"
          :can-mirror="canMirrorHeld"
          :can-shrink="canShrinkHeld"
          :rotate-display-text="rotateDisplayText"
          :mirror-display-text="mirrorDisplayText"
          :shrink-display-text="shrinkDisplayText"
          @select="emit('select-held-piece')"
          @drag-start="(e) => emit('drag-start-held', e)"
          @rotate="emit('rotate-held')"
          @mirror="emit('mirror-held')"
          @shrink="emit('shrink-held')"
        />
      </div>
      <div
        v-else
        :ref="holdAreaRef"
        :class="[
          'p-1.5 sm:p-2 rounded-lg transition-all w-18 h-18 sm:w-30 sm:h-30 flex flex-col items-center justify-center',
          'bg-purple-600/30 border-2 border-dashed border-purple-500',
          isHoveringHoldArea && canUseHold ? 'bg-purple-600/60 border-purple-400 scale-110' : '',
          !canUseHold ? 'opacity-50 cursor-not-allowed' : '',
        ]"
      >
        <div class="text-lg sm:text-2xl mb-0.5">📦</div>
        <div class="text-2xs sm:text-xs text-center font-medium" :class="canUseHold ? 'text-purple-300' : 'text-neutral-500'">
          {{ isHoveringHoldArea ? 'Drop!' : 'Hold' }}
        </div>
        <div v-if="holdDisplayText" class="text-2xs text-center" :class="canUseHold ? 'text-purple-200' : 'text-neutral-600'">
          {{ holdDisplayText }}
        </div>
      </div>
    </div>
  </div>
</template>
