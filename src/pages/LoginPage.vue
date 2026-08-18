<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()

const { loginWithGoogle } = useAuth(router)

const handleLogin = async () => {
  try {
    const user = await loginWithGoogle()
    console.log('[Login] success:', user)
  } catch (err) {
    console.error('[Login] failed:', err)
  }
}
</script>

<template>
  <div class="login-page">
    <div class="login-card">
      <h1>校務管理系統</h1>

      <button class="google-btn" @click="handleLogin">
        使用 Google 登入
      </button>
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