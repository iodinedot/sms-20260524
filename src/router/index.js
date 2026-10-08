import { watch } from 'vue'
import { createRouter, createWebHistory } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { navItems } from '@/config/nav'

/**
 * meta.access 說明（沒寫 = 'app'，預設安全）：
 *   'guest'         僅未登入可進（登入頁）
 *   'no-invitation' 僅 no-invitation 可進
 *   'onboarding'    僅 onboarding 可進
 *   'app'           僅 ready 可進（預設）
 *   'public'        任何狀態皆可，且不等待 auth
 */
const routes = [
  { path: '/', redirect: '/app' }, // 未登入會被 guard 導去 /login，已登入直接進系統
  {
    path: '/login',
    component: () => import('@/pages/LoginPage.vue'),
    meta: { access: 'guest' }
  },
  {
    path: '/onboarding',
    component: () => import('@/pages/OnboardingPage.vue'),
    meta: { access: 'onboarding' }
  },
  {
    path: '/no-invitation',
    component: () => import('@/pages/NoInvitationPage.vue'),
    meta: { access: 'no-invitation' }
  },
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
  },
  // 開發工具只在 dev 環境註冊；不寫 meta → 預設需 ready
  ...(import.meta.env.DEV
    ? [{
        path: '/dev',
        name: 'FsMove',
        component: () => import('@/dev/FsMove.vue')
      }]
    : []),
  // 404：統一丟回 /app，讓 guard 依狀態再導去正確位置
  { path: '/:pathMatch(.*)*', redirect: '/app' }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

const { status, init, waitUntilResolved } = useAuth()
init() // 內部有 initialized 防重

// 每個 status 的「歸屬頁面」。不變式：home 路由的 access 必須等於該 rule 的 access，
// 否則會無限迴圈。
const STATUS_RULES = {
  unauthenticated: { access: 'guest', home: '/login' },
  'no-invitation': { access: 'no-invitation', home: '/no-invitation' },
  onboarding: { access: 'onboarding', home: '/onboarding' },
  ready: { access: 'app', home: '/app' }
}

const AUTH_TIMEOUT_MS = 10000

// 等到 status 不是 loading，附帶逾時保護
async function resolveStatus() {
  let timer
  const timeout = new Promise((resolve) => {
    timer = setTimeout(() => resolve('timeout'), AUTH_TIMEOUT_MS)
  })
  const settled = (async () => {
    // 用迴圈：resolve 之後 status 可能又被切回 loading（例如剛登入、正在載入 org）
    while (status.value === 'loading') {
      await waitUntilResolved()
    }
    return status.value
  })()

  try {
    return await Promise.race([settled, timeout])
  } finally {
    clearTimeout(timer)
  }
}

router.beforeEach(async (to) => {
  const access = to.meta.access ?? 'app'

  if (access === 'public') return true

  const current = await resolveStatus() // await 之後才讀取，不用快取值

  if (current === 'timeout') {
    // 逾時：導去登入頁；已在登入頁就放行，避免每 10 秒循環導向
    return to.path === '/login' ? true : '/login'
  }

  const rule = STATUS_RULES[current]
  if (access === rule.access) return true

  return rule.home
})

// status 改變時（登入/登出/完成 onboarding）重新評估當前頁面。
// 必須等初始導航完成才註冊，否則會在初始導航等待 auth 時，
// 被這個 watcher 用 START_LOCATION 的 '/' 劫持掉。
router.isReady().then(() => {
  watch(status, (s) => {
    if (s === 'loading') return
    const { path, query, hash } = router.currentRoute.value
    router.replace({ path, query, hash, force: true }) // force 才會重跑 guard
  })
})

export default router