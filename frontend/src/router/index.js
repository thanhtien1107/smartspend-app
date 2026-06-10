import { createRouter, createWebHistory } from 'vue-router';
import Auth from '../components/Auth.vue';
import MainLayout from '../layouts/MainLayout.vue';
import HomeView from '../views/HomeView.vue';
import BudgetView from '../views/BudgetView.vue';
import AIView from '../views/AIView.vue';
import AddView from '../views/AddView.vue';
import ReportView from '../views/ReportView.vue';
import ProfileView from '../views/ProfileView.vue';
import OnboardingView from '../views/OnboardingView.vue';
import { useAppStore } from '../stores/useAppStore';

const routes = [
  {
    path: '/login',
    name: 'login',
    component: Auth,
    meta: { public: true }
  },
  {
    path: '/onboarding',
    name: 'onboarding',
    component: OnboardingView
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: '',
        name: 'home',
        component: HomeView
      },
      {
        path: 'add',
        name: 'add',
        component: AddView
      },
      {
        path: 'report',
        name: 'report',
        component: ReportView
      },
      {
        path: 'budget',
        name: 'budget',
        component: BudgetView
      },
      {
        path: 'ai',
        name: 'ai',
        component: AIView
      },
      {
        path: 'profile',
        name: 'profile',
        component: ProfileView
      }
    ]
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes
});

router.beforeEach((to) => {
  const appStore = useAppStore();

  if (to.meta.public && appStore.isAuthenticated) {
    return { name: 'home' };
  }

  if (!to.meta.public && !appStore.isAuthenticated) {
    return { name: 'login' };
  }

  if (appStore.isAuthenticated && to.name !== 'onboarding' && localStorage.getItem('smartspendOnboardingCompleted') !== 'true') {
    return { name: 'onboarding' };
  }

  if (to.name === 'onboarding' && localStorage.getItem('smartspendOnboardingCompleted') === 'true') {
    return { name: 'home' };
  }

  return true;
});

export default router;
