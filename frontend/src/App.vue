<script setup lang="ts">
import { computed } from 'vue';
import { RouterView } from 'vue-router';
import { Toaster } from 'vue-sonner';
import { useTheme } from '@/composables/useTheme';

const { isDark } = useTheme();
const theme = computed(() => isDark.value ? 'dark' : 'light');
</script>

<template>
  <RouterView />
  <Toaster position="top-right" :theme="theme" richColors />
</template>
