// src/config/nav.js

export const navItems = [
    {
      key: 'courses',
      label: '課程資料',
      icon: '📚',
      path: '/app/courses',
      component: () => import('@/modules/course/CourseManager.vue')
    },
    {
      key: 'students',
      label: '學生資料',
      icon: '👤',
      path: '/app/students',
      component: () => import('@/modules/student/StudentManager.vue')
    },
    {
      key: 'billing',
      label: '繳費單業務',
      icon: '💰',
      path: '/app/billing',
      component: () => import('@/modules/billing/BillingManager.vue')
    },
    {
      key: 'admin',
      label: '行政項目設定',
      icon: '⚙️',
      path: '/app/admin',
      component: () => import('@/modules/admin/AdminView.vue')
    }
  ]