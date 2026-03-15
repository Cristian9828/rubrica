import { createRouter, createWebHistory } from 'vue-router';
import axios from 'axios';
import { useAuthStore } from '@/stores/auth';

// Cache dello stato setup: null = non ancora controllato
let setupConfigured: boolean | null = null;

async function checkSetupStatus(): Promise<boolean> {
  if (setupConfigured !== null) return setupConfigured;
  try {
    const { data } = await axios.get('/api/setup/status');
    setupConfigured = data.configured;
  } catch {
    setupConfigured = true; // in caso di errore, non bloccare
  }
  return setupConfigured!;
}

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/setup',
      name: 'setup',
      component: () => import('@/views/SetupView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/LoginView.vue'),
      meta: { guest: true },
    },
    {
      path: '/',
      component: () => import('@/views/MainLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        {
          path: '',
          name: 'contacts',
          component: () => import('@/views/ContactsView.vue'),
        },
        {
          path: 'admin/users',
          name: 'admin-users',
          component: () => import('@/views/AdminUsersView.vue'),
          meta: { admin: true },
        },
        {
          path: 'settings',
          name: 'settings',
          component: () => import('@/views/SettingsView.vue'),
        },
        {
          path: 'tags',
          name: 'tags',
          component: () => import('@/views/TagsView.vue'),
        },
        {
          path: 'sections',
          name: 'sections',
          component: () => import('@/views/SectionsView.vue'),
        },
      ],
    },
  ],
});

router.beforeEach(async (to) => {
  const configured = await checkSetupStatus();

  // Se non configurato, forza /setup (tranne se ci sei già)
  if (!configured && to.name !== 'setup') {
    return '/setup';
  }

  // Se configurato e vai su /setup, redirect al login
  if (configured && to.name === 'setup') {
    return '/login';
  }

  const auth = useAuthStore();

  if (auth.isAuthenticated && !auth.user) {
    await auth.fetchMe();
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return '/login';
  }

  if (to.meta.guest && auth.isAuthenticated) {
    return '/';
  }

  if (to.meta.admin && !auth.isAdmin) {
    return '/';
  }
});

export default router;
