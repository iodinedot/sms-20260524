import { createRouter, createWebHistory } from 'vue-router'

const routes = [
  { path: '/', redirect: '/billing' },

  {
    path: '/courses',
    component: () => import('@/modules/course/CourseManager.vue')
  },
  {
    path: '/students',
    component: () => import('@/modules/student/StudentManager.vue')
  },
  {
    path: '/billing',
    component: () => import('@/modules/billing/BillingManager.vue')
  },
  {
    path: '/billing/batch-create',
    component: () => import('@/modules/billing/BatchCreatePage.vue')
  },
  {
    path: '/admin',
    component: () => import('@/modules/admin/AdminView.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router