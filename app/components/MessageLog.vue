<script setup lang="ts">
  import type { MessageLogEntry } from '~/utils/types';

  defineProps<{
    messageLog: MessageLogEntry[];
  }>();

  const emit = defineEmits<{
    (e: 'clear'): void;
  }>();
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="font-semibold text-neutral-100 mb-1">Message Log</h2>
      <p class="text-xs text-neutral-400">Archipelago communications</p>
    </div>

    <div class="bg-neutral-800/30 rounded-sm p-4 space-y-3 max-h-150 overflow-y-auto">
      <div v-if="messageLog.length === 0" class="text-center text-neutral-500 py-8">No messages yet</div>
      <div v-else class="space-y-2">
        <div
          v-for="(message, index) in messageLog"
          :key="index"
          class="p-3 rounded text-sm"
          :class="{
            'bg-blue-500/10 border border-blue-500/30': message.type === 'chat',
            'bg-green-500/10 border border-green-500/30': message.type === 'item',
            'bg-red-500/10 border border-red-500/30': message.type === 'error',
            'bg-neutral-700/30 border border-neutral-600/30': message.type === 'info',
          }"
        >
          <div class="flex items-start justify-between gap-2 mb-1">
            <span
              class="text-xs font-semibold"
              :class="{
                'text-blue-400': message.type === 'chat',
                'text-green-400': message.type === 'item',
                'text-red-400': message.type === 'error',
                'text-neutral-400': message.type === 'info',
              }"
            >
              {{ message.type === 'chat' ? '💬 Chat' : message.type === 'item' ? '📦 Item' : message.type === 'error' ? '❌ Error' : 'ℹ️ Info' }}
            </span>
            <span class="text-2xs text-neutral-500">
              {{ message.time.toLocaleTimeString() }}
            </span>
          </div>
          <div class="text-neutral-200">{{ message.text }}</div>
        </div>
      </div>
    </div>

    <button
      @click="emit('clear')"
      class="w-full px-4 py-2 bg-neutral-700/50 hover:bg-neutral-600/50 text-neutral-300 rounded text-sm transition-colors"
    >
      Clear Log
    </button>
  </div>
</template>
