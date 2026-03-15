import { useI18n } from 'vue-i18n';
import { useAuthStore } from '@/stores/auth';

export function useLocale() {
  const { locale } = useI18n();
  const auth = useAuthStore();

  async function setLanguage(lang: string) {
    locale.value = lang as 'it' | 'en';
    await auth.updateSettings({ language: lang });
  }

  return { locale, setLanguage };
}
