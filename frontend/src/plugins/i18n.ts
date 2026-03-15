import { createI18n } from 'vue-i18n';
import it from '@/locales/it';
import en from '@/locales/en';

const browserLang = navigator.language.split('-')[0];
const defaultLocale = ['it', 'en'].includes(browserLang) ? browserLang : 'it';

const i18n = createI18n({
  locale: defaultLocale,
  fallbackLocale: 'it',
  messages: { it, en },
  legacy: false,
});

export default i18n;
