<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

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
    errorMsg.value = '登入失敗，請再試一次'
    console.error('[LoginPage] login failed:', err)
  } finally {
    isLoggingIn.value = false
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>校務管理系統</h1>
      <button class="google-btn" :disabled="isLoggingIn" @click="handleLogin">
        {{ isLoggingIn ? '登入中...' : '使用 Google 登入' }}
      </button>
      <p v-if="errorMsg" style="color: red;">{{ errorMsg }}</p>
    </div>
  </div>
</template>

<style scoped>
.login-page {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: #f5f1ea;
}
.login-card {
  padding: 40px;
  background: white;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 30px rgba(0,0,0,0.1);
}
.google-btn {
  margin-top: 20px;
  padding: 10px 20px;
  border: none;
  background: #4285F4;
  color: white;
  border-radius: 6px;
  cursor: pointer;
}
</style>