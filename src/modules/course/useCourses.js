import { computed } from 'vue'
import { useCrud } from '@/composables/useCrud'

export function useCourses() {
  const { list } = useCrud('courses')

  // 🔥 核心：給 billing / enrollment 用
  const courseMap = computed(() => {
    const map = {}
    for (const c of list.value || []) {
      map[c.id] = c
    }
    return map
  })

  // （可選）單筆取得
  const getById = (id) => {
    return courseMap.value[id] || null
  }

  return {
    list,        // 給 UI（table / select）
    courseMap,   // 🔥 給計算（billing 用）
    getById      // 🔥 給邏輯（可選）
  }
}