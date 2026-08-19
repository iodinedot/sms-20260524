<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useAuth } from '@/composables/useAuth'
import { navItems } from '@/config/nav'

const router = useRouter()
const route = useRoute()

const { user, logout, init } = useAuth()

onMounted(() => {
  console.log('[App] init auth')
  init()
})

// ⭐ sidebar 收合狀態
const isSidebarCollapsed = ref(window.innerWidth <= 768)

const handleResize = () => {
  if (window.innerWidth > 768 && isSidebarCollapsed.value) {
    isSidebarCollapsed.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// ⭐ 導航
const go = (path) => {
  console.log('[Nav] go:', path)
  router.push(path)
  // 手機版點擊選單後自動收合
  if (window.innerWidth <= 768) {
    isSidebarCollapsed.value = true
  }
}

const isActive = (path) => route.path.startsWith(path)

const handleLogout = async () => {
  console.log('[App] logout clicked')
  await logout()
  router.push('/login')
}
</script>

<template>
  <div
    class="admin-wrapper"
    :class="{
      'sidebar-collapsed': isSidebarCollapsed,
      'sidebar-expanded': !isSidebarCollapsed
    }"
  >
    <!-- Sidebar -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <button class="toggle-btn" @click="toggleSidebar">☰</button>
        <div v-if="!isSidebarCollapsed" class="sidebar-logo">
          補記本 Bukibo
        </div>
      </div>

      <nav class="nav-menu">
        <div
          v-for="item in navItems"
          :key="item.key"
          class="nav-item"
          :class="{ active: isActive(item.path) }"
          @click="go(item.path)"
          :title="isSidebarCollapsed ? item.label : ''"
        >
          <span class="nav-icon">{{ item.icon }}</span>
          <span v-if="!isSidebarCollapsed" class="nav-text">
            {{ item.label }}
          </span>
        </div>
      </nav>

      <!-- 👤 User Info -->
      <div v-if="user" class="sidebar-user">
        <div class="nav-item">
          <span class="nav-icon">👤</span>
          <span v-if="!isSidebarCollapsed" class="nav-text">
            {{ user.displayName || user.email }}
          </span>
        </div>

        <div class="nav-item" @click="handleLogout">
          <span class="nav-icon">🚪</span>
          <span v-if="!isSidebarCollapsed" class="nav-text">
            登出
          </span>
        </div>
      </div>
    </aside>

    <!-- mobile overlay -->
    <div
      v-if="!isSidebarCollapsed"
      class="sidebar-mobile-overlay"
      @click="isSidebarCollapsed = true"
    ></div>

    <!-- 主要內容 -->
    <main class="main-body">
      <div class="content-container">
        <router-view />
      </div>
    </main>
  </div>
</template>