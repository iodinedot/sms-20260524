<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import logo from '@/assets/bukibo_logo.png'

const router = useRouter()
const { loginWithGoogle, waitUntilResolved } = useAuth()
const isLoggingIn = ref(false)
const errorMsg = ref('')

const handleLogin = async () => {
  isLoggingIn.value = true
  errorMsg.value = ''
  try {
    await loginWithGoogle()

    // ⭐ 關鍵：等 useAuth 把 orgState 查完、status 確定之後，
    // 再觸發一次導航，讓 guard 用最新的 status 做最終判斷
    await waitUntilResolved()
    router.push('/app') // 實際去哪裡由 guard 依 status 決定
  } catch (err) {
    errorMsg.value = '登入失敗，請檢查網路連線或再試一次'
    console.error('[LoginPage] login failed:', err)
  } finally {
    isLoggingIn.value = false
  }
}
</script>

<template>
  <div class="modal-overlay">
    <div class="ui-card modal" style="width: 400px; text-align: center;">
      <!-- 系統標題區 -->
      <div class="modal-header" style="justify-content: center; flex-direction: column; gap: 6px;">
        <img
          :src="logo"
          alt="Bukibo 補記本"
          style="height: 96px; object-fit: contain;"
        />
        <span class="text-secondary" style="font-size: 12px; letter-spacing: 0.5px;">
          極簡、精準、如手帳般的校務結算體驗
        </span>
      </div>

      <!-- 登入卡片主體 -->
      <div class="modal-body form-group" style="padding: 24px 16px; align-items: center;">
        <p class="text-secondary" style="font-size: 13px; margin-bottom: 8px;">
          請使用補習班授權之 Google 帳號進行身分驗證
        </p>

        <!-- Google 登入按鈕（利用 theme.css 既有的 btn 與 btn-primary 類別） -->
        <button 
          class="btn btn-primary" 
          style="width: 100%; height: var(--control-height); display: flex; align-items: center; justify-content: center; gap: 8px; font-weight: 600;"
          :disabled="isLoggingIn" 
          @click="handleLogin"
        >
          <!-- Google 圖示 -->
          <svg viewBox="0 0 24 24" width="16" height="16">
            <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"/>
            <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.15C3.26 21.3 7.31 24 12 24z"/>
            <path fill="#FBBC05" d="M5.28 14.24c-.25-.72-.38-1.49-.38-2.24s.13-1.52.38-2.24V6.61H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.39l3.99-3.15z"/>
            <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.61l3.99 3.15c.95-2.85 3.6-4.96 6.72-4.96z"/>
          </svg>
          <span>{{ isLoggingIn ? '驗證登入中...' : '使用 Google 帳號登入' }}</span>
        </button>

        <!-- 錯誤訊息提示區 -->
        <p v-if="errorMsg" class="error-text" style="margin-top: 12px; font-weight: 500;">
          ⚠️ {{ errorMsg }}
        </p>
      </div>

      <!-- 頁尾宣告 -->
      <div class="modal-footer" style="justify-content: center; padding: 12px; border-top: 1px solid var(--border-soft);">
        <span class="text-secondary" style="font-size: 11px;">
          Bukibo Billing System &copy; 2026
        </span>
      </div>
    </div>
  </div>
</template>