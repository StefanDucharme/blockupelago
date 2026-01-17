<script setup lang="ts">
  const props = defineProps<{
    scoreMilestones: number[];
    lineClearMilestones: number[];
    boxClearMilestones: number[];
    pieceMilestones: number[];
    totalScore: number;
    totalLinesCleared: number;
    totalBoxesCleared: number;
    totalPiecesPlaced: number;
    totalGemsCollected: number;
    maxGemChecks: number;
    completedChecks: Set<number>;
    getScoreLocationId: (score: number) => number | null;
    getLineClearLocationId: (clears: number) => number | null;
    getBoxClearLocationId: (clears: number) => number | null;
    getPieceLocationId: (pieces: number) => number | null;
    getGemLocationId: (gemNumber: number) => number | null;
  }>();

  function isLocationCompleted(locationId: number): boolean {
    return props.completedChecks.has(locationId);
  }
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="font-semibold text-neutral-100 mb-1">Location Checks</h2>
      <p class="text-xs text-neutral-400">Track your progress</p>
    </div>

    <!-- Score Milestones -->
    <section class="space-y-3">
      <h3 class="section-heading">Score Milestones</h3>
      <div class="bg-neutral-800/30 rounded-sm p-4">
        <div class="space-y-2">
          <div v-for="(score, idx) in scoreMilestones" :key="score" class="flex items-center justify-between text-xs">
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
          <div v-for="clears in lineClearMilestones" :key="clears" class="flex items-center justify-between text-xs">
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
          <div v-for="clears in boxClearMilestones" :key="clears" class="flex items-center justify-between text-xs">
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
          <div v-for="pieces in pieceMilestones" :key="pieces" class="flex items-center justify-between text-xs">
            <span class="text-neutral-300">{{ pieces }} Piece{{ pieces > 1 ? 's' : '' }}</span>
            <span v-if="isLocationCompleted(getPieceLocationId(pieces) || 0)" class="text-green-400">✓</span>
            <span v-else-if="totalPiecesPlaced >= pieces" class="text-yellow-400">⏳</span>
            <span v-else class="text-neutral-600">○</span>
          </div>
        </div>
      </div>
    </section>

    <!-- Gem Checks -->
    <section class="space-y-3">
      <h3 class="section-heading">Gems Collected</h3>
      <div class="bg-neutral-800/30 rounded-sm p-4">
        <div class="grid grid-cols-2 gap-2">
          <div v-for="gem in maxGemChecks" :key="gem" class="flex items-center justify-between text-xs">
            <span class="text-pink-300">Gem #{{ gem }}</span>
            <span v-if="isLocationCompleted(getGemLocationId(gem) || 0)" class="text-green-400">✓</span>
            <span v-else-if="totalGemsCollected >= gem" class="text-yellow-400">⏳</span>
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
</template>
