<script setup lang="ts">
import { ref } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';
import { Button } from '@/components/ui/button';
import Input from '@/components/ui/Input.vue';
import Card from '@/components/ui/Card.vue';
import { BookUser } from 'lucide-vue-next';

const { t } = useI18n();
const router = useRouter();
const auth = useAuthStore();

const username = ref('');
const password = ref('');
const error = ref('');
const loading = ref(false);

async function handleLogin() {
  error.value = '';
  loading.value = true;
  try {
    await auth.login(username.value, password.value);
    router.push('/');
  } catch (e: any) {
    error.value = e.response?.data?.message || t('auth.loginError');
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-background p-4">
    <Card class="w-full max-w-sm p-8">
      <div class="flex flex-col items-center gap-2 mb-8">
        <div class="h-12 w-12 rounded-xl bg-primary flex items-center justify-center">
          <BookUser class="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 class="text-2xl font-bold">{{ t('auth.title') }}</h1>
        <p class="text-sm text-muted-foreground">{{ t('auth.subtitle') }}</p>
      </div>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('auth.username') }}</label>
          <Input v-model="username" placeholder="admin" autofocus />
        </div>
        <div class="space-y-2">
          <label class="text-sm font-medium">{{ t('auth.password') }}</label>
          <Input v-model="password" type="password" :placeholder="t('auth.password')" />
        </div>
        <p v-if="error" class="text-sm text-destructive">{{ error }}</p>
        <Button type="submit" class="w-full" :disabled="loading">
          {{ loading ? t('auth.loggingIn') : t('auth.login') }}
        </Button>
      </form>
    </Card>
  </div>
</template>
