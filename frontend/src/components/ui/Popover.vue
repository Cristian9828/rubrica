<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, nextTick } from 'vue';
import { cn } from '@/lib/utils';

defineProps<{
  class?: string;
  align?: 'start' | 'center' | 'end';
}>();

const open = ref(false);
const trigger = ref<HTMLElement>();
const content = ref<HTMLElement>();

function toggle() {
  open.value = !open.value;
}

function close() {
  open.value = false;
}

function onClickOutside(e: MouseEvent) {
  if (
    !trigger.value?.contains(e.target as Node) &&
    !content.value?.contains(e.target as Node)
  ) {
    close();
  }
}

onMounted(() => document.addEventListener('click', onClickOutside));
onBeforeUnmount(() => document.removeEventListener('click', onClickOutside));

defineExpose({ close });
</script>

<template>
  <div class="relative">
    <div ref="trigger" @click="toggle">
      <slot name="trigger" />
    </div>
    <Transition name="popover">
      <div
        v-if="open"
        ref="content"
        :class="cn(
          'absolute bottom-full mb-2 z-50 min-w-[200px] rounded-md border bg-popover p-1 text-popover-foreground shadow-md',
          align === 'end' ? 'right-0' : align === 'center' ? 'left-1/2 -translate-x-1/2' : 'left-0',
          $props.class
        )"
      >
        <slot :close="close" />
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.popover-enter-active,
.popover-leave-active {
  transition: all 0.15s ease;
}
.popover-enter-from,
.popover-leave-to {
  opacity: 0;
  transform: translateY(4px);
}
</style>
