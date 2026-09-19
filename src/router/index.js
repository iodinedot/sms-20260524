import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { navItems } from '@/config/nav'

const routes = [
  //{ path: '/', redirect: '/login' },
  { path: '/', redirect: '/login' },
  {
    path: '/dev',
    name: 'FsMove',
    component: () => import('@/dev/FsMove.vue')
  },
  { path: '/login', component: () => import('@/pages/LoginPage.vue') },
  { path: '/onboarding', component: () => import('@/pages/OnboardingPage.vue') },
  { path: '/no-invitation', component: () => import('@/pages/NoInvitationPage.vue') },
  {
    path: '/app',
    component: () => import('@/App.vue'),
    children: [
      { path: '', redirect: '/app/billing' },
      ...navItems.map(item => ({
        path: item.path.replace('/app/', ''),
        component: item.component
      }))
    ]
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

// ⭐ 拿共用狀態，不再自己開一份 onAuthStateChanged
const { status, init } = useAuth()
init()

router.beforeEach((to) => {
  //console.log('[Guard]', to.path, 'status:', status.value)

  switch (status.value) {
    case 'loading':
      return true // 查詢中先放行，避免卡住；可搭配 App 外層 loading UI

    case 'unauthenticated':
      return to.path === '/login' ? true : '/login'

    case 'no-invitation':
      return to.path === '/no-invitation' ? true : '/no-invitation'

    case 'onboarding':
      return to.path === '/onboarding' ? true : '/onboarding'

    case 'ready':
      return (['/login', '/onboarding', '/no-invitation'].includes(to.path))
        ? '/app'
        : true

    default:
      return true
  }
})

export default router