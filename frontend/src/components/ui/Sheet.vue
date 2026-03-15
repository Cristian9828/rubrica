<script setup lang="ts">
import { cn } from '@/lib/utils';

defineProps<{
  open: boolean;
  class?: string;
}>();

defineEmits<{
  close: [];
}>();
</script>

<template>
  <Teleport to="body">
    <Transition name="sheet">
      <div v-if="open" class="fixed inset-0 z-50">
        <div class="fixed inset-0 bg-black/80" @click="$emit('close')" />
        <div
          :class="cn('fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-background shadow-lg border-l overflow-y-auto', $props.class)"
        >
          <slot />
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.sheet-enter-active,
.sheet-leave-active {
  transition: all 0.3s ease;
}
.sheet-enter-active > div:last-child,
.sheet-leave-active > div:last-child {
  transition: transform 0.3s ease;
}
.sheet-enter-from > div:first-child,
.sheet-leave-to > div:first-child {
  opacity: 0;
}
.sheet-enter-from > div:last-child {
  transform: translateX(100%);
}
.sheet-leave-to > div:last-child {
  transform: translateX(100%);
}
</style>
