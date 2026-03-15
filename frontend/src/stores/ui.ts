import { defineStore } from 'pinia';
import { ref } from 'vue';

export const useUiStore = defineStore('ui', () => {
  const sidebarCollapsed = ref(
    localStorage.getItem('sidebar-collapsed') === 'true',
  );

  function toggleSidebar() {
    sidebarCollapsed.value = !sidebarCollapsed.value;
    localStorage.setItem('sidebar-collapsed', String(sidebarCollapsed.value));
  }

  function setSidebarCollapsed(value: boolean) {
    sidebarCollapsed.value = value;
    localStorage.setItem('sidebar-collapsed', String(value));
  }

  return { sidebarCollapsed, toggleSidebar, setSidebarCollapsed };
});
