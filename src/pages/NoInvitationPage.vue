<script setup>
import { useRouter } from 'vue-router'
import { useAuth } from '@/composables/useAuth'

const router = useRouter()
const { logout } = useAuth()

const handleLogout = async () => {
  await logout()
  router.push('/login')
}
</script>

<template>
  <div style="padding: 40px; max-width: 500px; text-align: center;">
    <h2>尚未收到邀請</h2>
    <p>目前這個帳號還沒有被邀請加入任何組織，請聯絡管理員取得邀請。</p>
    <button @click="handleLogout">登出並切換帳號</button>
  </div>
</template>