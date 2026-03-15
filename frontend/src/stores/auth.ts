import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import api from '@/lib/api';
import i18n from '@/plugins/i18n';
import { useTheme } from '@/composables/useTheme';

interface UserSettings {
  language: string;
  theme: string;
  accentColor: string;
}

interface User {
  id: number;
  username: string;
  displayName: string;
  role: 'admin' | 'user';
  settings?: UserSettings;
}

function applySettings(settings: UserSettings) {
  const { setTheme, setAccent } = useTheme();
  i18n.global.locale.value = settings.language as 'it' | 'en';
  setTheme(settings.theme as 'light' | 'dark' | 'system');
  setAccent(settings.accentColor);
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null);
  const token = ref(localStorage.getItem('token') || '');

  const isAuthenticated = computed(() => !!token.value);
  const isAdmin = computed(() => user.value?.role === 'admin');

  async function login(username: string, password: string) {
    const { data } = await api.post('/auth/login', { username, password });
    token.value = data.access_token;
    user.value = data.user;
    localStorage.setItem('token', data.access_token);
    if (data.user?.settings) applySettings(data.user.settings);
  }

  async function fetchMe() {
    try {
      const { data } = await api.get('/auth/me');
      user.value = data;
      if (data.settings) applySettings(data.settings);
    } catch {
      logout();
    }
  }

  function logout() {
    token.value = '';
    user.value = null;
    localStorage.removeItem('token');
  }

  async function updateProfile(data: { displayName?: string; password?: string }) {
    if (!user.value) return;
    const { data: updated } = await api.patch(`/users/${user.value.id}`, data);
    user.value = { ...user.value, ...updated };
  }

  async function updateSettings(settings: Partial<UserSettings>) {
    const { data } = await api.patch('/user-settings/me', settings);
    if (user.value) {
      user.value = {
        ...user.value,
        settings: { ...user.value.settings, ...data } as UserSettings,
      };
    }
    applySettings({ language: 'it', theme: 'system', accentColor: 'blue', ...user.value?.settings, ...settings });
  }

  return { user, token, isAuthenticated, isAdmin, login, fetchMe, logout, updateProfile, updateSettings };
});
