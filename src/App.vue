<script setup>
/*import { ref, onMounted } from 'vue';
import CourseManager from './components/CourseManager.vue';
import StudentManager from './components/StudentManager.vue';
import BillingView from './components/BillingView.vue';
import AdminView from './components/AdminView.vue';

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

const toggleSidebar = () => {
  isSidebarCollapsed.value = !isSidebarCollapsed.value;
};
*/
// test payment.js
import { onMounted } from 'vue'

import {
  useBillingDrafts
} from '@/modules/billing/composables/useBillingDrafts'

const {
  drafts,
  generate
} = useBillingDrafts()

onMounted(() => {

generate({
  studentIds: [
    'stu001',
    'stu002'
  ],

  students: [
    {
      id: 'stu001',
      name: '王小明'
    },
    {
      id: 'stu002',
      name: '陳小華'
    }
  ],

  enrollments: [
    {
      studentId: 'stu001',
      courseId: 'course001',
      status: 'active'
    },
    {
      studentId: 'stu002',
      courseId: 'course001',
      status: 'active'
    }
  ],

  courses: [
    {
      id: 'course001',
      name: '數學班',
      billingType: 'fixed-weekly',
      unitPrice: 300,
      startDate: '2026-03-15',
      endDate: '2026-06-30',
      schedules: [
        { dayOfWeek: 2 },
        { dayOfWeek: 5 }
      ]
    }
  ],

  feeItems: [
    {
      id: 'fee001',
      name: '教材費',
      defaultAmount: 500,
      isRequired: true
    }
  ],

  holidays: [
    {
      date: '2026-03-20'
    }
  ],

  billingStartDate: '2026-03-01',
  billingEndDate: '2026-03-31'
})

console.log('Drafts')
console.log(drafts.value)

})
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
          <span v-if="!isSidebarCollapsed" class="nav-text">帳單記錄</span>
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
        <BillingView v-show="currentTab === 'billing'" :active-tab="currentTab" />
        <AdminView v-show="currentTab === 'admin'" />
      </div>
    </main>
  </div>
</template>
