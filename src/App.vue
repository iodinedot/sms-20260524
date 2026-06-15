<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { schemas } from '@/schemas'
import { useCrud } from '@/composables/useCrud'
import CourseManager from '@/modules/course/CourseManager.vue';
import StudentManager from '@/modules/student/StudentManager.vue';
import BillingManager from '@/modules/billing/BillingManager.vue';
import AdminView from '@/modules/admin/AdminView.vue';

// 2. 導覽狀態
const currentTab = ref('courses');
const isSidebarCollapsed = ref(window.innerWidth <= 768);

onMounted(() => {
  window.addEventListener('resize', () => {
    // 只有在跨越 768px 門檻時才被動調整，避免頻繁觸發
    if (window.innerWidth > 768 && isSidebarCollapsed.value) {
      isSidebarCollapsed.value = false;
    }
  });
});

// 🔥 存所有 unsubscribe（可選，但我幫你做完整）
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
});

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};

</script>

<template>
  <!-- 使用動態 Class 控制收合狀態 -->
  <div 
    class="admin-wrapper" 
    :class="{ 
      'sidebar-collapsed': isSidebarCollapsed,
      'sidebar-expanded': !isSidebarCollapsed 
    }"
  >
    <!-- 左側側邊欄 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <!-- 漢堡按鈕 -->
        <button
          class="toggle-btn"
          @click="toggleSidebar"
        >
          ☰
        </button>
        <div v-if="!isSidebarCollapsed" class="sidebar-logo">校務管理系統</div>
      </div>

      <nav class="nav-menu">
        <div
          class="nav-item"
          :class="{ active: currentTab === 'courses' }"
          @click="currentTab = 'courses'; isSidebarCollapsed = true"
          :title="isSidebarCollapsed ? '課程資料' : ''"
        >
          <span class="nav-icon">📚</span>
          <span v-if="!isSidebarCollapsed" class="nav-text">課程資料</span>
        </div>
        
        <div
          class="nav-item"
          :class="{ active: currentTab === 'students' }"
          @click="currentTab = 'students'; isSidebarCollapsed = true"
          :title="isSidebarCollapsed ? '學生資料' : ''"
        >
          <span class="nav-icon">👤</span>
          <span v-if="!isSidebarCollapsed" class="nav-text">學生資料</span>
        </div>
        
        <div
          class="nav-item"
          :class="{ active: currentTab === 'billing' }"
          @click="currentTab = 'billing'; isSidebarCollapsed = true"
          :title="isSidebarCollapsed ? '帳單記錄' : ''"
        >
          <span class="nav-icon">💰</span>
          <span v-if="!isSidebarCollapsed" class="nav-text">繳費單業務</span>
        </div>
        
        <div
          class="nav-item"
          :class="{ active: currentTab === 'admin' }"
          @click="currentTab = 'admin'; isSidebarCollapsed = true"
          :title="isSidebarCollapsed ? '行政項目設定' : ''"
        >
          <span class="nav-icon">⚙️</span>
          <span v-if="!isSidebarCollapsed" class="nav-text">行政項目設定</span>
        </div>
      </nav>
    </aside>

    <div 
      class="sidebar-mobile-overlay" 
      @click="isSidebarCollapsed = true"
    ></div>
    
    <!-- 右側內容區 -->
    <main class="main-body">
      <div class="content-container">
        <CourseManager v-show="currentTab === 'courses'" />
        <StudentManager 
          v-show="currentTab === 'students'" 
          :active-tab="currentTab"
          @switch-tab="currentTab = $event" 
        />
        <BillingManager v-show="currentTab === 'billing'" :active-tab="currentTab" />
        <AdminView v-show="currentTab === 'admin'" />
      </div>
    </main>
  </div>
</template>
