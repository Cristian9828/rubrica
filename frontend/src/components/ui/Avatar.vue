<script setup lang="ts">
import { cn } from '@/lib/utils';
import { computed } from 'vue';

const props = defineProps<{
  name: string;
  class?: string;
  size?: 'sm' | 'md' | 'lg';
}>();

const initials = computed(() => {
  const parts = props.name.trim().split(/\s+/);
  return parts.length > 1
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : props.name.slice(0, 2).toUpperCase();
});

const colors = [
  'bg-blue-500', 'bg-emerald-500', 'bg-violet-500', 'bg-amber-500',
  'bg-rose-500', 'bg-cyan-500', 'bg-indigo-500', 'bg-teal-500',
];

const bgColor = computed(() => {
  let hash = 0;
  for (const c of props.name) hash = c.charCodeAt(0) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
});

const sizeClass = computed(() => {
  const sizes = { sm: 'h-8 w-8 text-xs', md: 'h-10 w-10 text-sm', lg: 'h-12 w-12 text-base' };
  return sizes[props.size || 'md'];
});
</script>

<template>
  <div
    :class="cn('inline-flex items-center justify-center rounded-full text-white font-medium', bgColor, sizeClass, $props.class)"
  >
    {{ initials }}
  </div>
</template>
