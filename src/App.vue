<script setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'

import { schemas } from '@/schemas'
import { useCrud } from '@/composables/useCrud'
import { navItems } from '@/config/nav'

// ⭐ router
const router = useRouter()
const route = useRoute()

// ⭐ sidebar 狀態（保留你的邏輯）
const isSidebarCollapsed = ref(window.innerWidth <= 768)

// ⭐ resize 行為（保留）
const handleResize = () => {
  if (window.innerWidth > 768 && isSidebarCollapsed.value) {
    isSidebarCollapsed.value = false
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

// ⭐ subscription（完全保留）
const unsubscribers = []

onMounted(() => {
  console.log('🔥 App init subscribe all collections')

  Object.keys(schemas).forEach(type => {
    const { subscribe, stop } = useCrud(type)

    subscribe()
    unsubscribers.push(stop)

    console.log(`✅ subscribed: ${type}`)
  })
})

onUnmounted(() => {
  console.log('🛑 App unmount, stop all subscriptions')

  unsubscribers.forEach(stop => stop && stop())
  window.removeEventListener('resize', handleResize)
})

// ⭐ sidebar toggle（保留）
const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value
}

// ⭐ 導航（取代 currentTab）
const go = (path) => {
  router.push(path)
  isSidebarCollapsed.value = true
}

// ⭐ active 判斷（取代 currentTab）
const isActive = (path) => {
  return route.path.startsWith(path)
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
        <button class="toggle-btn" @click="toggleSidebar">
          ☰
        </button>
        <div v-if="!isSidebarCollapsed" class="sidebar-logo">
          校務管理系統
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
    </aside>

    <!-- mobile overlay -->
    <div 
      class="sidebar-mobile-overlay" 
      @click="isSidebarCollapsed = true"
    ></div>

    <!-- ⭐ 核心：router 控畫面 -->
    <main class="main-body">
      <div class="content-container">
        <router-view />
      </div>
    </main>
  </div>
</template>