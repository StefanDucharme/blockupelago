<script setup lang="ts">
  import type { Piece } from '~/utils/types';

  const props = defineProps<{
    piece: Piece;
    isSelected: boolean;
    isDragging: boolean;
    isPlaceable: boolean;
    canRotate: boolean;
    canMirror: boolean;
    canShrink: boolean;
    rotateDisplayText: string | number;
    mirrorDisplayText: string | number;
    shrinkDisplayText: string | number;
    size?: 'small' | 'normal';
  }>();

  const emit = defineEmits<{
    (e: 'select'): void;
    (e: 'drag-start', event: MouseEvent | TouchEvent): void;
    (e: 'rotate'): void;
    (e: 'mirror'): void;
    (e: 'shrink'): void;
  }>();

  const cellSize = props.size === 'small' ? '15px' : '13px';
  const containerClass = props.size === 'small' ? 'w-16 h-16 sm:w-25 sm:h-25' : 'w-[72px] h-[72px] sm:w-30 sm:h-30';
</script>

<template>
  <div class="flex flex-col items-center">
    <div
      :class="[
        'p-2 sm:p-3 rounded-lg cursor-grab active:cursor-grabbing transition-all touch-none',
        containerClass,
        isSelected ? 'bg-blue-700 scale-110' : 'bg-gray-700 hover:bg-gray-600',
        isDragging ? 'opacity-50' : '',
        !isPlaceable ? 'opacity-40 saturate-0' : '',
      ]"
      @click="emit('select')"
      @mousedown="(e) => emit('drag-start', e)"
      @touchstart="(e) => emit('drag-start', e)"
    >
      <div class="flex items-center justify-center w-full h-full">
        <div
          class="grid gap-0.5"
          :style="{
            gridTemplateColumns: `repeat(${piece.shape[0]?.length || 0}, ${cellSize})`,
            gridTemplateRows: `repeat(${piece.shape.length}, ${cellSize})`,
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
    <div v-if="size !== 'small'" class="flex flex-col sm:flex-row gap-0.5 pt-1">
      <button
        @click="emit('rotate')"
        :disabled="!canRotate"
        :class="[
          'w-full sm:flex-1 text-xs rounded transition-colors p-1',
          canRotate ? 'bg-blue-600/50 hover:bg-blue-600/80' : 'bg-gray-600/30 cursor-not-allowed opacity-50',
        ]"
      >
        🔃<span v-if="!piece.hasBeenRotated && rotateDisplayText" class="block"> {{ rotateDisplayText }}</span>
      </button>
      <button
        @click="emit('mirror')"
        :disabled="!canMirror"
        :class="[
          'w-full sm:flex-1 text-xs rounded transition-colors p-1',
          canMirror ? 'bg-cyan-600/50 hover:bg-cyan-600/80' : 'bg-gray-600/30 cursor-not-allowed opacity-50',
        ]"
      >
        <span class="text-cyan-300">↔️</span><span v-if="!piece.hasBeenMirrored && mirrorDisplayText" class="block"> {{ mirrorDisplayText }}</span>
      </button>
      <button
        @click="emit('shrink')"
        :disabled="!canShrink"
        :class="[
          'w-full sm:flex-1 text-xs rounded transition-colors p-1',
          canShrink ? 'bg-orange-600/50 hover:bg-orange-600/80' : 'bg-gray-600/30 cursor-not-allowed opacity-50',
        ]"
      >
        ⬇️ <span v-if="shrinkDisplayText" class="block">{{ shrinkDisplayText }}</span>
      </button>
    </div>
  </div>
</template>
