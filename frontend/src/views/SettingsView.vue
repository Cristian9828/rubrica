<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { useTheme } from '@/composables/useTheme';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/Input.vue';
import Card from '@/components/ui/Card.vue';
import Avatar from '@/components/ui/Avatar.vue';
import { toast } from 'vue-sonner';

const { t } = useI18n();
const auth = useAuthStore();
const { themeMode, accentColor, setTheme, setAccent } = useTheme();

const displayName = ref(auth.user?.displayName || '');
const password = ref('');
const passwordConfirm = ref('');
const loading = ref(false);

const ACCENTS = [
  { key: 'blue',   color: '#3b82f6' },
  { key: 'green',  color: '#22c55e' },
  { key: 'purple', color: '#a855f7' },
  { key: 'orange', color: '#f97316' },
  { key: 'rose',   color: '#f43f5e' },
];

async function saveProfile() {
  loading.value = true;
  try {
    const payload: any = {};
    if (displayName.value !== auth.user?.displayName) {
      payload.displayName = displayName.value;
    }
    if (password.value) {
      if (password.value !== passwordConfirm.value) {
        toast.error(t('settings.passwordMismatch'));
        return;
      }
      payload.password = password.value;
    }
    if (Object.keys(payload).length === 0) {
      toast.info(t('common.noChanges'));
      return;
    }
    await auth.updateProfile(payload);
    password.value = '';
    passwordConfirm.value = '';
    toast.success(t('settings.profileUpdated'));
  } catch (e: any) {
    toast.error(e.response?.data?.message || t('common.error'));
  } finally {
    loading.value = false;
  }
}

async function handleTheme(mode: 'light' | 'dark' | 'system') {
  setTheme(mode);
  await auth.updateSettings({ theme: mode });
}

async function handleAccent(color: string) {
  setAccent(color);
  await auth.updateSettings({ accentColor: color });
}
</script>

<template>
  <div class="p-4 lg:p-6 max-w-lg space-y-6">
    <h1 class="text-xl lg:text-2xl font-bold">{{ t('settings.title') }}</h1>

    <!-- Profile -->
    <Card class="p-6 space-y-6">
      <div class="flex items-center gap-4">
        <Avatar :name="auth.user?.displayName || 'U'" size="lg" />
        <div>
          <p class="font-medium">{{ auth.user?.displayName }}</p>
          <p class="text-sm text-muted-foreground">@{{ auth.user?.username }}</p>
        </div>
      </div>

      <form @submit.prevent="saveProfile" class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('settings.displayName') }}</label>
          <Input v-model="displayName" />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('settings.newPassword') }}</label>
          <Input v-model="password" type="password" :placeholder="t('settings.newPasswordPlaceholder')" />
        </div>
        <div v-if="password" class="space-y-2">
          <label class="text-sm font-medium">{{ t('settings.confirmPassword') }}</label>
          <Input v-model="passwordConfirm" type="password" :placeholder="t('settings.confirmPasswordPlaceholder')" />
        </div>
        <Button type="submit" :disabled="loading">
          {{ loading ? t('common.saving') : t('common.save') }}
        </Button>
      </form>
    </Card>

    <!-- Appearance -->
    <Card class="p-6 space-y-5">
      <!-- Language -->
      <div class="space-y-2">
        <label class="text-sm font-medium">{{ t('settings.language') }}</label>
        <div class="flex gap-2">
          <button
            v-for="lang in [{ code: 'it', label: '🇮🇹 Italiano' }, { code: 'en', label: '🇬🇧 English' }]"
            :key="lang.code"
            @click="auth.updateSettings({ language: lang.code })"
            :class="[
              'px-3 py-1.5 rounded-md border text-sm transition-colors',
              auth.user?.settings?.language === lang.code
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-accent'
            ]"
          >
            {{ lang.label }}
          </button>
        </div>
      </div>

      <!-- Theme -->
      <div class="space-y-2">
        <label class="text-sm font-medium">{{ t('settings.theme') }}</label>
        <div class="flex gap-2">
          <button
            v-for="opt in [
              { value: 'light', label: t('settings.themeLight') },
              { value: 'dark',  label: t('settings.themeDark') },
              { value: 'system', label: t('settings.themeSystem') },
            ]"
            :key="opt.value"
            @click="handleTheme(opt.value as 'light' | 'dark' | 'system')"
            :class="[
              'px-3 py-1.5 rounded-md border text-sm transition-colors',
              themeMode === opt.value
                ? 'bg-primary text-primary-foreground border-primary'
                : 'hover:bg-accent'
            ]"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>

      <!-- Accent color -->
      <div class="space-y-2">
        <label class="text-sm font-medium">{{ t('settings.accentColor') }}</label>
        <div class="flex gap-2">
          <button
            v-for="a in ACCENTS"
            :key="a.key"
            @click="handleAccent(a.key)"
            :title="a.key"
            :class="[
              'h-7 w-7 rounded-full border-2 transition-all',
              accentColor === a.key ? 'border-foreground scale-110' : 'border-transparent'
            ]"
            :style="{ backgroundColor: a.color }"
          />
        </div>
      </div>
    </Card>

  </div>
</template>
