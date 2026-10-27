import { ref, computed, watch } from 'vue'
import { createAuthService, computeStatus } from '@/logic/authService'
import { authRepository } from '@/data'

const service = createAuthService({ repo: authRepository })

// ⭐ 模組層級 singleton，全 app 共用同一份
const user = ref(null)
const isReady = ref(false)
const orgState = ref(undefined)

let unsubscribe = null
let initialized = false
let authVersion = 0 // 每次 auth 變化 +1，用來丟棄過期的非同步結果

const status = computed(() =>
  computeStatus({ isReady: isReady.value, user: user.value, orgState: orgState.value })
)

function waitUntilResolved() {
  return new Promise((resolve) => {
    if (status.value !== 'loading') return resolve()
    const stop = watch(status, (val) => {
      if (val !== 'loading') {
        stop()
        resolve()
      }
    })
  })
}

export function useAuth() {
  const init = () => {
    if (initialized) return
    initialized = true

    unsubscribe = service.onAuthChanged(async (firebaseUser) => {
      const version = ++authVersion
      user.value = firebaseUser
      orgState.value = undefined

      if (!firebaseUser) {
        isReady.value = true
        return
      }

      try {
        await service.syncUser(firebaseUser)
        const state = await service.loadOrgState(firebaseUser)
        if (version !== authVersion) return // 期間已登出/換人，丟棄
        orgState.value = state
        isReady.value = true
      } catch (err) {
        console.error('[useAuth] 載入使用者/組織狀態失敗', err)
        if (version !== authVersion) return
        // 讓狀態收斂成 unauthenticated，而不是永遠 loading
        await service.signOut()
      }
    })
  }

  const loginWithGoogle = () => service.signInWithGoogle()
  const logout = () => service.signOut()

  const completeOnboarding = async (formData) => {
    if (!user.value || !orgState.value) return
    orgState.value = await service.completeOnboarding({
      user: user.value,
      orgState: orgState.value,
      formData
    })
  }

  const stop = () => {
    if (unsubscribe) unsubscribe()
    initialized = false
  }

  return {
    user, orgState, isReady, status,
    init, stop, loginWithGoogle, logout, completeOnboarding, waitUntilResolved
  }
}