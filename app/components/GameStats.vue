<script setup lang="ts">
  import { ref } from 'vue';
  import ThemePicker from './ThemePicker.vue';

  const props = defineProps<{
    gameMode: 'free-play' | 'archipelago';
    totalScore: number;
    totalGemsCollected: number;
    totalLinesCleared: number;
    totalBoxesCleared: number;
    totalCombos: number;
    totalPiecesPlaced: number;
    scoreMultiplier: number;
    isMobile: boolean;
  }>();

  const mobileStatsExpanded = ref(false);
</script>

<template>
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
</template>
