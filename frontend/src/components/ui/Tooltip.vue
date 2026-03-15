<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';

const props = defineProps<{
  text: string;
  side?: 'top' | 'right' | 'bottom' | 'left';
  disabled?: boolean;
}>();

const show = ref(false);
const trigger = ref<HTMLElement>();
const tooltip = ref<HTMLElement>();
let timeout: ReturnType<typeof setTimeout>;

function onEnter() {
  if (props.disabled) return;
  timeout = setTimeout(() => {
    show.value = true;
  }, 400);
}

function onLeave() {
  clearTimeout(timeout);
  show.value = false;
}
</script>

<template>
  <div class="relative inline-flex" @mouseenter="onEnter" @mouseleave="onLeave">
    <slot />
    <Transition name="tooltip">
      <div
        v-if="show && text"
        ref="tooltip"
        :class="[
          'absolute z-[100] px-2 py-1 text-xs font-medium rounded-md bg-popover text-popover-foreground border shadow-md whitespace-nowrap pointer-events-none',
          (side === 'right' || !side) && 'left-full ml-2 top-1/2 -translate-y-1/2',
          side === 'left' && 'right-full mr-2 top-1/2 -translate-y-1/2',
          side === 'top' && 'bottom-full mb-2 left-1/2 -translate-x-1/2',
          side === 'bottom' && 'top-full mt-2 left-1/2 -translate-x-1/2',
        ]"
      >
        {{ text }}
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.15s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
}
</style>
