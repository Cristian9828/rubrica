<script setup lang="ts">
import { cn } from '@/lib/utils';

defineProps<{
  open: boolean;
  class?: string;
  title?: string;
}>();

defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="dialog">
      <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center">
        <div class="fixed inset-0 bg-black/80" @click="$emit('close')" />
        <div
          :class="cn('relative z-50 w-full max-w-lg rounded-lg bg-background p-6 shadow-lg border mx-4', $props.class)"
        >
          <h2 v-if="title" class="text-lg font-semibold mb-4">{{ title }}</h2>
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.dialog-enter-active,
.dialog-leave-active {
  transition: all 0.2s ease;
}
.dialog-enter-from,
.dialog-leave-to {
  opacity: 0;
}
.dialog-enter-from > div:last-child {
  transform: scale(0.95);
}
</style>
