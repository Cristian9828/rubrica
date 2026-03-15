import { ref, watchEffect } from 'vue';

type ThemeMode = 'light' | 'dark' | 'system';

const themeMode = ref<ThemeMode>(
  (localStorage.getItem('theme') as ThemeMode) || 'system',
);

const accentColor = ref(localStorage.getItem('accent') || 'blue');

// System preference media query
const systemDark = window.matchMedia('(prefers-color-scheme: dark)');

function applyDark(dark: boolean) {
  document.documentElement.classList.toggle('dark', dark);
}

watchEffect(() => {
  const mode = themeMode.value;
  localStorage.setItem('theme', mode);
  if (mode === 'system') {
    applyDark(systemDark.matches);
  } else {
    applyDark(mode === 'dark');
  }
});

// Listen for system preference changes
systemDark.addEventListener('change', (e) => {
  if (themeMode.value === 'system') applyDark(e.matches);
});

watchEffect(() => {
  localStorage.setItem('accent', accentColor.value);
  document.documentElement.setAttribute('data-accent', accentColor.value);
});

// Expose isDark for backward compat (used in App.vue for Toaster theme)
const isDark = ref(document.documentElement.classList.contains('dark'));
const obs = new MutationObserver(() => {
  isDark.value = document.documentElement.classList.contains('dark');
});
obs.observe(document.documentElement, { attributeFilter: ['class'] });

export function useTheme() {
  function setTheme(mode: ThemeMode) {
    themeMode.value = mode;
  }

  function setAccent(color: string) {
    accentColor.value = color;
  }

  // legacy toggle
  function toggle() {
    themeMode.value = themeMode.value === 'dark' ? 'light' : 'dark';
  }

  return { isDark, themeMode, accentColor, setTheme, setAccent, toggle };
}
