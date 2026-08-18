import { createRouter, createWebHistory } from 'vue-router'
import { auth } from '@/firebase/config'
import { onAuthStateChanged } from 'firebase/auth'

const routes = [
  { path: '/', redirect: '/login' },

  {
    path: '/login',
    component: () => import('@/pages/LoginPage.vue')
  },

  {
    path: '/onboarding',
    component: () => import('@/pages/OnboardingPage.vue')
  },

  {
    path: '/app',
    component: () => import('@/App.vue'),
    children: [
      { path: '', redirect: '/app/billing' },

      {
        path: 'courses',
        component: () => import('@/modules/course/CourseManager.vue')
      },
      {
        path: 'students',
        component: () => import('@/modules/student/StudentManager.vue')
      },
      {
        path: 'billing',
        component: () => import('@/modules/billing/BillingManager.vue')
      },
      {
        path: 'billing/batch-create',
        component: () => import('@/modules/billing/components/BatchCreate.vue')
      },
      {
        path: 'admin',
        component: () => import('@/modules/admin/AdminView.vue')
      }
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// =========================
// Auth state cache
// =========================
let currentUser = null

onAuthStateChanged(auth, (user) => {
  currentUser = user
})

// =========================
// 1️⃣ Login guard
// =========================
router.beforeEach((to) => {
  const isLogin = to.path === '/login'
  const isOnboarding = to.path === '/onboarding'

  if (!currentUser && !isLogin) {
    return '/login'
  }
  
  if (currentUser && isLogin) {
    return '/app/billing'
  }
  
  // ✅ 加這行（讓 onboarding 不被擋）
  if (isOnboarding) {
    return true
  }

  return true
})

router.beforeEach((to, from) => {
  console.log('[Router] from → to:', from.fullPath, '→', to.fullPath)
})

export default router