<script setup lang="ts">
  const props = defineProps<{
    host: string;
    port: number;
    slot: string;
    password: string;
    useSecureConnection: boolean;
    status: string;
    lastMessage: string;
  }>();

  const emit = defineEmits<{
    (e: 'update:host', value: string): void;
    (e: 'update:port', value: number): void;
    (e: 'update:slot', value: string): void;
    (e: 'update:password', value: string): void;
    (e: 'update:use-secure-connection', value: boolean): void;
    (e: 'connect'): void;
    (e: 'disconnect'): void;
    (e: 'sync-items'): void;
  }>();
</script>

<template>
  <div class="space-y-6">
    <div>
      <h2 class="font-semibold text-neutral-100 mb-1">Archipelago Connection</h2>
      <p class="text-xs text-neutral-400">Connect to multiplayer server</p>
    </div>

    <div class="bg-neutral-800/30 rounded-sm p-4 space-y-4">
      <p class="text-xs text-neutral-400">Enter your server details</p>

      <div class="space-y-3">
        <div class="space-y-1">
          <label class="text-xs font-medium text-neutral-300">Host</label>
          <input
            :value="host"
            @input="emit('update:host', ($event.target as HTMLInputElement).value)"
            class="input-field"
            placeholder="archipelago.gg"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium text-neutral-300">Port</label>
          <input
            :value="port"
            @input="emit('update:port', parseInt(($event.target as HTMLInputElement).value))"
            class="input-field"
            placeholder="38281"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium text-neutral-300">Player Name</label>
          <input
            :value="slot"
            @input="emit('update:slot', ($event.target as HTMLInputElement).value)"
            class="input-field"
            placeholder="Your player name"
          />
        </div>
        <div class="space-y-1">
          <label class="text-xs font-medium text-neutral-300">Password</label>
          <input
            :value="password"
            @input="emit('update:password', ($event.target as HTMLInputElement).value)"
            type="password"
            class="input-field"
            placeholder="Optional password"
          />
        </div>
        <div class="flex items-center gap-3 pt-2">
          <input
            type="checkbox"
            :checked="useSecureConnection"
            @change="emit('update:use-secure-connection', ($event.target as HTMLInputElement).checked)"
            class="checkbox-field"
            id="secure-connection"
          />
          <label for="secure-connection" class="text-xs text-neutral-300 cursor-pointer">
            Use secure connection
            <span class="text-neutral-500 text-2xs ml-1">(uncheck for local servers)</span>
          </label>
        </div>
      </div>

      <div class="flex gap-3 pt-2">
        <button class="btn-primary flex-1" @click="emit('connect')" :disabled="status === 'connected' || status === 'connecting'">
          {{ status === 'connecting' ? 'Connecting…' : 'Connect' }}
        </button>
        <button class="btn-secondary" @click="emit('disconnect')" :disabled="status !== 'connected'">Disconnect</button>
      </div>

      <div v-if="status === 'connected'" class="pt-2">
        <button
          class="btn-secondary w-full text-xs"
          @click="emit('sync-items')"
          title="Reprocess all items from server (use if local data was cleared)"
        >
          🔄 Resync Items
        </button>
      </div>

      <div v-if="lastMessage" class="mt-4 p-3 bg-neutral-900/50 rounded-lg border border-neutral-600">
        <div class="text-xs text-neutral-300">{{ lastMessage }}</div>
      </div>
    </div>
  </div>
</template>
